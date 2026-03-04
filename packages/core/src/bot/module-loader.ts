import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Bot } from 'grammy'
import { createConversation } from '@grammyjs/conversations'
import type { ModuleDefinition } from '@al-saada/module-kit'
import { prisma } from '../database/prisma'
import logger from '../utils/logger'
import type { BotContext } from '../types/context'
import { i18n } from './i18n'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '../../../../')
const MODULES_DIR = path.join(REPO_ROOT, 'modules')

export interface LoadedModule {
  slug: string
  config: ModuleDefinition
  status: 'loaded' | 'error'
  error?: string
}

class ModuleLoader {
  private modules: Map<string, LoadedModule> = new Map()

  /**
   * Scans the modules directory, validates configs, and registers them.
   * Performs shallow scan of modules.
   */
  async loadModules(bot: Bot<BotContext>): Promise<void> {
    const startTime = Date.now()
    logger.info('Starting ModuleLoader discovery...')

    if (!fs.existsSync(MODULES_DIR)) {
      logger.warn(`Modules directory not found at ${MODULES_DIR}. Skipping discovery.`)
      return
    }

    const entries = fs.readdirSync(MODULES_DIR, { withFileTypes: true })
    const moduleFolders = entries
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name)

    for (const folder of moduleFolders) {
      const configPath = path.join(MODULES_DIR, folder, 'config.ts')
      const localesDir = path.join(MODULES_DIR, folder, 'locales')

      if (!fs.existsSync(configPath)) {
        continue
      }

      try {
        // Dynamic import of the module config
        // Note: Using absolute path with file:// protocol for ESM dynamic import on Windows/Linux
        const moduleUrl = `file://${configPath.replace(/\\/g, '/')}`
        const imported = await import(moduleUrl)
        const config: ModuleDefinition = imported.default

        if (!config || config.slug !== folder) {
          throw new Error(`Module slug mismatch or missing default export. Expected "${folder}", got "${config?.slug}"`)
        }

        // 1. Register i18n locales if they exist
        this.loadModuleLocales(folder, localesDir)

        // 2. Register conversations
        if (config.addEntryPoint) {
          bot.use(createConversation(config.addEntryPoint, `${config.slug}-add`))
        }
        if (config.editEntryPoint) {
          bot.use(createConversation(config.editEntryPoint, `${config.slug}-edit`))
        }

        // 3. Sync with database (upsert module record)
        // Note: we need sectionId. We'll resolve sectionSlug -> sectionId first.
        const section = await prisma.section.findUnique({
          where: { slug: config.sectionSlug },
          select: { id: true },
        })

        if (section) {
          await prisma.module.upsert({
            where: { slug: config.slug },
            update: {
              name: config.name,
              nameEn: config.nameEn,
              icon: config.icon,
              sectionId: section.id,
              isActive: true,
              configPath: `modules/${folder}/config.ts`,
            },
            create: {
              slug: config.slug,
              name: config.name,
              nameEn: config.nameEn,
              icon: config.icon,
              sectionId: section.id,
              isActive: true,
              configPath: `modules/${folder}/config.ts`,
            },
          })
        }
        else {
          logger.warn(`Module "${config.slug}" refers to non-existent section "${config.sectionSlug}". Database sync skipped.`)
        }

        this.modules.set(config.slug, {
          slug: config.slug,
          config,
          status: 'loaded',
        })

        logger.info(`Successfully loaded module: ${config.slug}`)
      }
      catch (error: any) {
        logger.error(`Failed to load module "${folder}": ${error.message}`)
        this.modules.set(folder, {
          slug: folder,
          config: {} as any,
          status: 'error',
          error: error.message,
        })

        // Notify SUPER_ADMINs about the failure
        await this.notifyAdminsOfFailure(bot, folder, error.message)
      }
    }

    const duration = Date.now() - startTime
    logger.info(`ModuleLoader finished in ${duration}ms. Loaded ${this.getLoadedModules().length} modules.`)

    if (duration > 5000) {
      logger.warn(`ModuleLoader took ${duration}ms, exceeding the 5s performance target (QA-001).`)
    }
  }

  /**
   * Loads Fluent locale files from a module's locales directory.
   */
  private loadModuleLocales(slug: string, localesDir: string): void {
    if (!fs.existsSync(localesDir)) {
      logger.warn(`Module "${slug}" is missing locales directory.`)
      return
    }

    const arPath = path.join(localesDir, 'ar.ftl')
    const enPath = path.join(localesDir, 'en.ftl')

    if (fs.existsSync(arPath)) {
      i18n.loadLocale('ar', { filePath: arPath })
    }
    else {
      logger.warn(`Module "${slug}" missing Arabic locale (ar.ftl).`)
    }

    if (fs.existsSync(enPath)) {
      i18n.loadLocale('en', { filePath: enPath })
    }
    else {
      logger.warn(`Module "${slug}" missing English locale (en.ftl).`)
    }
  }

  /**
   * Notifies all SUPER_ADMINs about a module loading failure.
   */
  private async notifyAdminsOfFailure(bot: Bot<BotContext>, slug: string, reason: string): Promise<void> {
    try {
      const superAdmins = await prisma.user.findMany({
        where: { role: 'SUPER_ADMIN', isActive: true },
        select: { telegramId: true, language: true },
      })

      for (const admin of superAdmins) {
        try {
          const lang = admin.language || 'ar'
          const title = i18n.t(lang, 'notification-module-load-error-title')
          const body = i18n.t(lang, 'notification-module-load-error-message', { slug, reason })
          const message = `${title}\n\n${body}`

          await bot.api.sendMessage(admin.telegramId.toString(), message)
        }
        catch (err) {
          logger.error(`Failed to send error notification to admin ${admin.telegramId}:`, err)
        }
      }
    }
    catch (err) {
      logger.error('Failed to fetch SUPER_ADMINs for error notification:', err)
    }
  }

  /**
   * Returns all loaded modules, sorted by orderIndex then slug.
   */
  getLoadedModules(): LoadedModule[] {
    return Array.from(this.modules.values())
      .filter(m => m.status === 'loaded')
      .sort((a, b) => {
        const orderA = a.config.orderIndex ?? 999
        const orderB = b.config.orderIndex ?? 999
        if (orderA !== orderB)
          return orderA - orderB
        return a.slug.localeCompare(b.slug)
      })
  }

  /**
   * Returns a specific module by slug.
   */
  getModule(slug: string): LoadedModule | undefined {
    return this.modules.get(slug)
  }

  /**
   * Returns all module statuses (for CLI/Admin view).
   */
  getAllStatuses(): LoadedModule[] {
    return Array.from(this.modules.values())
  }
}

export const moduleLoader = new ModuleLoader()
