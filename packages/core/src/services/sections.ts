import { prisma } from '../database/prisma'
import logger from '../utils/logger'

export interface CreateSectionParams {
  slug: string
  name: string
  nameEn: string
  icon: string
  parentId?: string | null
  orderIndex?: number
  createdBy: bigint
}

export interface UpdateSectionParams {
  id: string
  slug?: string
  name?: string
  nameEn?: string
  icon?: string
  parentId?: string | null
  isActive?: boolean
  orderIndex?: number
}

/**
 * Section management service
 * Handles CRUD operations for sections with two-level hierarchy support
 * Per FR-018, FR-037
 */
export const sectionService = {
  /**
   * Get all main sections (parentId = null) ordered by orderIndex
   */
  async getMainSections() {
    return prisma.section.findMany({
      where: { parentId: null, isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: { children: true },
    })
  },

  /**
   * Get a section by ID with its children
   */
  async getById(id: string) {
    return prisma.section.findUnique({
      where: { id },
      include: {
        children: {
          orderBy: { orderIndex: 'asc' },
        },
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
  },

  /**
   * Get a section by slug
   */
  async getBySlug(slug: string) {
    return prisma.section.findUnique({
      where: { slug },
      include: {
        children: {
          orderBy: { orderIndex: 'asc' },
        },
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
  },

  /**
   * Get all sections (including sub-sections)
   */
  async getAll() {
    return prisma.section.findMany({
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        children: true,
        modules: true,
      },
    })
  },

  /**
   * Create a new section
   * Validates 2-level depth: parentId must reference a main section (parentId = null)
   */
  async create(params: CreateSectionParams) {
    // Validate parentId for 2-level depth constraint
    if (params.parentId) {
      const parentSection = await prisma.section.findUnique({
        where: { id: params.parentId },
        select: { parentId: true },
      })

      if (!parentSection) {
        throw new Error('Parent section not found')
      }

      // Parent must be a main section (parentId = null)
      if (parentSection.parentId !== null) {
        throw new Error('Cannot create 3rd level section')
      }
    }

    const section = await prisma.section.create({
      data: {
        slug: params.slug,
        name: params.name,
        nameEn: params.nameEn,
        icon: params.icon,
        parentId: params.parentId,
        orderIndex: params.orderIndex ?? 0,
        createdBy: params.createdBy,
      },
    })

    logger.info(
      { sectionId: section.id, slug: section.slug, createdBy: params.createdBy.toString() },
      'Section created',
    )

    return section
  },

  /**
   * Update an existing section
   * Validates hierarchy: cannot set a sub-section as parent (3rd level)
   */
  async update(params: UpdateSectionParams) {
    // If changing parentId, validate hierarchy depth
    if (params.parentId !== undefined) {
      const parentSection = params.parentId
        ? await prisma.section.findUnique({
          where: { id: params.parentId },
          select: { parentId: true },
        })
        : null

      if (params.parentId && !parentSection) {
        throw new Error('Parent section not found')
      }

      // Parent must be a main section (parentId = null)
      if (parentSection && parentSection.parentId !== null) {
        throw new Error('Cannot reparent to sub-section (max 2 levels)')
      }

      // Prevent creating cycle: cannot set a section's own descendant as parent
      if (params.parentId === params.id) {
        throw new Error('Cannot set section as its own parent')
      }

      // Check if new parent is a descendant of this section
      if (params.parentId) {
        const isDescendant = await this.isDescendant(params.id, params.parentId)
        if (isDescendant) {
          throw new Error('Cannot set descendant as parent')
        }
      }
    }

    const section = await prisma.section.update({
      where: { id: params.id },
      data: {
        ...(params.slug !== undefined && { slug: params.slug }),
        ...(params.name !== undefined && { name: params.name }),
        ...(params.nameEn !== undefined && { nameEn: params.nameEn }),
        ...(params.icon !== undefined && { icon: params.icon }),
        ...(params.parentId !== undefined && { parentId: params.parentId }),
        ...(params.isActive !== undefined && { isActive: params.isActive }),
        ...(params.orderIndex !== undefined && { orderIndex: params.orderIndex }),
      },
    })

    logger.info(
      { sectionId: section.id, slug: section.slug },
      'Section updated',
    )

    return section
  },

  /**
   * Delete a section
   * Per FR-018: blocked if section has active modules
   * Cascade delete: deletes all sub-sections
   */
  async delete(id: string) {
    // Check if section has active modules
    const sectionWithModules = await prisma.section.findUnique({
      where: { id },
      include: {
        modules: {
          where: { isActive: true },
          select: { id: true },
        },
        children: {
          include: {
            modules: {
              where: { isActive: true },
              select: { id: true },
            },
          },
        },
      },
    })

    if (!sectionWithModules) {
      throw new Error('Section not found')
    }

    // Check if this section has active modules
    if (sectionWithModules.modules.length > 0) {
      throw new Error('Cannot delete section with active modules')
    }

    // Check if any sub-section has active modules
    for (const child of sectionWithModules.children) {
      if (child.modules && child.modules.length > 0) {
        throw new Error('Cannot delete main section with sub-sections that have active modules')
      }
    }

    // Delete the section - cascade will handle children via Prisma relations
    await prisma.section.delete({
      where: { id },
    })

    logger.info({ sectionId: id }, 'Section deleted')
  },

  /**
   * Enable or disable a section
   */
  async toggleActive(id: string, isActive: boolean) {
    const section = await prisma.section.update({
      where: { id },
      data: { isActive },
    })

    logger.info(
      { sectionId: id, isActive },
      `Section ${isActive ? 'enabled' : 'disabled'}`,
    )

    return section
  },

  /**
   * Get sub-sections for a given main section
   */
  async getSubSections(parentId: string) {
    return prisma.section.findMany({
      where: { parentId, isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
  },

  /**
   * Check if a section ID is a descendant of another section ID
   */
  async isDescendant(ancestorId: string, potentialDescendantId: string): Promise<boolean> {
    let current = await prisma.section.findUnique({
      where: { id: potentialDescendantId },
      select: { parentId: true },
    })

    const maxDepth = 10 // Safety limit to prevent infinite loops
    let depth = 0

    while (current && current.parentId && depth < maxDepth) {
      if (current.parentId === ancestorId) {
        return true
      }
      current = await prisma.section.findUnique({
        where: { id: current.parentId },
        select: { parentId: true },
      })
      depth++
    }

    return false
  },

  /**
   * Get all ancestor IDs for a given section
   */
  async getAncestors(sectionId: string): Promise<string[]> {
    const ancestors: string[] = []
    let currentId = sectionId

    const maxDepth = 10
    let depth = 0

    while (depth < maxDepth) {
      const section = await prisma.section.findUnique({
        where: { id: currentId },
        select: { parentId: true },
      })

      if (!section || !section.parentId) {
        break
      }

      ancestors.push(section.parentId)
      currentId = section.parentId
      depth++
    }

    return ancestors
  },

  /**
   * Get active modules for a section
   * If section is a main section, includes modules from sub-sections
   * Per FR-030
   */
  async getActiveModules(sectionId: string) {
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        children: {
          where: { isActive: true },
          include: {
            modules: {
              where: { isActive: true },
              orderBy: { orderIndex: 'asc' },
            },
          },
        },
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })

    if (!section) {
      return []
    }

    // Collect modules from this section
    const directModules = section.modules ?? []

    // If this is a main section, collect modules from sub-sections
    const allModules = [...directModules]
    if (section.parentId === null) {
      for (const child of section.children ?? []) {
        allModules.push(...(child.modules ?? []))
      }
    }

    return allModules.sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  },
}
