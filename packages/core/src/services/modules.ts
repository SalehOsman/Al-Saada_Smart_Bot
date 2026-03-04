import { prisma } from '../database/prisma'
import logger from '../utils/logger'

export interface ModuleConfig {
  id: string
  slug: string
  name: string
  nameEn: string
  sectionId: string
  icon: string
  isActive: boolean
  orderIndex: number
  configPath: string
}

/**
 * Module discovery and management service
 * Per FR-020, FR-021, FR-030
 */
export const moduleService = {
  /**
   * Registry of loaded modules (in-memory cache)
   * Populated by ModuleLoader at startup
   */
  loadedModules: new Map<string, ModuleConfig>(),

  /**
   * Register a discovered module
   * Called by ModuleLoader when a valid module config is found
   */
  registerModule(config: ModuleConfig): void {
    this.loadedModules.set(config.slug, config)
    logger.info({ slug: config.slug }, 'Module registered')
  },

  /**
   * Unregister a module from the registry
   * Called when a module is removed or becomes invalid
   */
  unregisterModule(slug: string): boolean {
    const removed = this.loadedModules.delete(slug)
    if (removed) {
      logger.info({ slug }, 'Module unregistered')
    }
    return removed
  },

  /**
   * Get a registered module by slug
   */
  getModule(slug: string): ModuleConfig | undefined {
    return this.loadedModules.get(slug)
  },

  /**
   * Get all registered modules
   */
  getAllModules(): ModuleConfig[] {
    return Array.from(this.loadedModules.values())
  },

  /**
   * Get active modules for a given section
   * Per FR-030: returns active modules with proper filtering
   * by isActive flag and orderIndex sorting
   */
  async getModulesBySection(sectionId: string): Promise<ModuleConfig[]> {
    // Get the section to verify it exists
    const section = await prisma.section.findUnique({
      where: { id: sectionId },
      select: { id: true, parentId: true },
    })

    if (!section) {
      return []
    }

    // Filter registered modules by section
    const modules = this.getAllModules()
      .filter(m => m.sectionId === sectionId && m.isActive)
      .sort((a, b) => a.orderIndex - b.orderIndex)

    return modules
  },

  /**
   * Get active modules for a section by slug
   */
  async getModulesBySectionSlug(sectionSlug: string): Promise<ModuleConfig[]> {
    // Get the section by slug to find its ID
    const section = await prisma.section.findUnique({
      where: { slug: sectionSlug },
      select: { id: true, parentId: true },
    })

    if (!section) {
      return []
    }

    return this.getModulesBySection(section.id)
  },

  /**
   * Persist module discovery to database
   * Creates/updates Module records for discovered configs
   */
  async persistModules(modules: ModuleConfig[]): Promise<void> {
    for (const config of modules) {
      await prisma.module.upsert({
        where: { slug: config.slug },
        update: {
          name: config.name,
          nameEn: config.nameEn,
          sectionId: config.sectionId,
          icon: config.icon,
          isActive: config.isActive,
          orderIndex: config.orderIndex,
          configPath: config.configPath,
        },
        create: {
          id: config.id,
          slug: config.slug,
          name: config.name,
          nameEn: config.nameEn,
          sectionId: config.sectionId,
          icon: config.icon,
          isActive: config.isActive,
          orderIndex: config.orderIndex,
          configPath: config.configPath,
        },
      })
    }
    logger.info({ count: modules.length }, 'Modules persisted to database')
  },

  /**
   * Clear a module's persisted record (e.g., when removed)
   */
  async clearModule(slug: string): Promise<void> {
    await prisma.module.deleteMany({
      where: { slug },
    })
    logger.info({ slug }, 'Module cleared from database')
  },
}

/**
 * Convenience export for moduleLoader
 * Can be imported as: import { moduleService } from './services/modules'
 */
export default moduleService
