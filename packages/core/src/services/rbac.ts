import { Role } from '@prisma/client'
import { adminScopeService } from './admin-scope'

export interface AccessOptions {
  sectionId?: string
  moduleId?: string
}

export const rbacService = {
  /**
   * Check if a user with a given role can access a resource
   * SUPER_ADMIN: full access
   * ADMIN: access if scope exists in adminScopeService
   * EMPLOYEE: basic access to sections/modules (but no management)
   * VISITOR: restricted access
   */
  async canAccess(userId: bigint, role: Role, options?: AccessOptions): Promise<boolean> {
    // 1. SUPER_ADMIN always has full access
    if (role === Role.SUPER_ADMIN) {
      return true
    }

    // 2. If no specific resource (section/module) is requested, 
    // basic access depends on the role (all except VISITOR usually)
    if (!options?.sectionId && !options?.moduleId) {
      return role !== Role.VISITOR
    }

    // 3. ADMIN access check (scoped permissions)
    if (role === Role.ADMIN) {
      const scopes = await adminScopeService.getScopes(userId)

      // If specific section is requested
      if (options.sectionId) {
        // FR-037: Resolve hierarchy for scope inheritance
        const { prisma } = await import('../database/prisma')
        const { redis } = await import('../cache/redis')
        const cacheKey = `section:hierarchy:${options.sectionId}`
        
        let parentId: string | null = null
        const cachedParentId = await redis.get(cacheKey)
        
        if (cachedParentId !== null && cachedParentId !== undefined) {
          parentId = cachedParentId === 'root' ? null : cachedParentId
        } else {
          const section = await prisma.section.findUnique({
            where: { id: options.sectionId },
            select: { parentId: true }
          })
          parentId = section?.parentId || null
          await redis.setex(cacheKey, 86400, parentId || 'root')
        }

        // Check if user has scope for the requested section OR its parent main section
        const hasScope = scopes.some((scope) => {
          // Grant access if:
          // 1. Direct scope on requested section
          // 2. Scope on parent main section (inheritance)
          const isTargetSection = scope.sectionId === options.sectionId || (parentId && scope.sectionId === parentId)
          if (!isTargetSection) return false
          
          // If a specific module is requested, scope must match OR be section-wide
          if (options.moduleId) {
            return scope.moduleId === options.moduleId || scope.moduleId === null
          }

          // If only section is requested, must have a section-wide scope (moduleId is null)
          // or at least one module scope in that section? 
          // (Usually canAccess(section) for management means full section access)
          return scope.moduleId === null
        })

        return hasScope
      }

      // If only moduleId is requested (less common but possible)
      if (options.moduleId) {
        return scopes.some(scope => scope.moduleId === options.moduleId)
      }
    }

    // 4. EMPLOYEE access
    // Employees can access sections/modules but usually this is for content consumption.
    // canAccess(sectionId) in RBAC middleware context often implies management.
    // For now, we follow the "default to standard role checks" instruction.
    if (role === Role.EMPLOYEE) {
      // Employees can view but not manage. 
      // If options are provided, we assume it's checking for "management/administrative" access
      // and thus return false, unless the system allows employees to 'access' them in a read-only way.
      // Based on the prompt: "For ADMIN, allow if scope exists... Else default to standard role checks."
      return false 
    }

    return false
  },

  /**
   * Checks if a user can perform a specific action within a module.
   */
  async canPerformAction(
    userId: bigint,
    role: Role,
    moduleSlug: string,
    action: 'view' | 'create' | 'edit' | 'delete'
  ): Promise<boolean> {
    const { moduleLoader } = await import('../bot/module-loader')
    const loadedModule = moduleLoader.getModule(moduleSlug)
    if (!loadedModule) return false

    const permissions = loadedModule.config.permissions
    const allowedRoles = permissions[action] || []

    if (!allowedRoles.includes(role)) return false

    // ADMIN must have matching scope
    if (role === Role.ADMIN) {
      const { prisma } = await import('../database/prisma')
      const section = await prisma.section.findUnique({
        where: { slug: loadedModule.config.sectionSlug },
        select: { id: true }
      })
      if (!section) return false

      const scopes = await adminScopeService.getScopes(userId)
      return scopes.some(s => 
        s.sectionId === section.id && 
        (s.moduleId === null || s.moduleId === moduleSlug)
      )
    }

    return true
  }
}
