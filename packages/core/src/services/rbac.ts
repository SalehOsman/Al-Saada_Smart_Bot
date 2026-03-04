import { Role } from '@prisma/client'
import { adminScopeService } from './admin-scope'

export interface AccessOptions {
  sectionId?: string
  moduleId?: string
}

export const rbacService = {
  /**
   * Resolve section hierarchy (all ancestor IDs) with caching
   * Per FR-037
   */
  async getSectionAncestry(sectionId: string): Promise<string[]> {
    const { redis } = await import('../cache/redis')
    const { sectionService } = await import('./sections')

    const cacheKey = `section:ancestry:${sectionId}`
    const cached = await redis.get(cacheKey)

    if (cached) {
      return JSON.parse(cached)
    }

    const ancestors = await sectionService.getAncestors(sectionId)
    await redis.setex(cacheKey, 86400, JSON.stringify(ancestors))

    return ancestors
  },

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
        const ancestors = await this.getSectionAncestry(options.sectionId)
        const ancestry = [options.sectionId, ...ancestors]

        // Check if user has scope for the requested section OR any of its ancestors
        const hasScope = scopes.some((scope) => {
          const isMatch = ancestry.includes(scope.sectionId)
          if (!isMatch)
            return false

          // If a specific module is requested, scope must match OR be section-wide
          if (options.moduleId) {
            return scope.moduleId === options.moduleId || scope.moduleId === null
          }

          // If only section is requested, must have a section-wide scope (moduleId is null)
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
    if (role === Role.EMPLOYEE) {
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
    action: 'view' | 'create' | 'edit' | 'delete',
  ): Promise<boolean> {
    const { moduleLoader } = await import('../bot/module-loader')
    const loadedModule = moduleLoader.getModule(moduleSlug)
    if (!loadedModule)
      return false

    const permissions = loadedModule.config.permissions
    const allowedRoles = permissions[action] || []

    if (!allowedRoles.includes(role))
      return false

    // ADMIN must have matching scope (with full hierarchy inheritance)
    if (role === Role.ADMIN) {
      const { prisma } = await import('../database/prisma')
      const section = await prisma.section.findUnique({
        where: { slug: loadedModule.config.sectionSlug },
        select: { id: true },
      })
      if (!section)
        return false

      const ancestors = await this.getSectionAncestry(section.id)
      const ancestry = [section.id, ...ancestors]

      const scopes = await adminScopeService.getScopes(userId)
      return scopes.some((s) => {
        const isMatch = ancestry.includes(s.sectionId)
        if (!isMatch)
          return false
        return s.moduleId === null || s.moduleId === moduleSlug
      })
    }

    return true
  },
}
