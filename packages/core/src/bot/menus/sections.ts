import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import { moduleLoader } from '../module-loader'

/**
 * Section menu display utilities
 * Per FR-019: hierarchical navigation with main sections and sub-sections
 */

/**
 * Display main sections menu (Super Admin or scoped ADMIN)
 * Shows only main sections (parentId = null)
 */
export async function showMainSectionsMenu(ctx: BotContext): Promise<void> {
  const sections = await prisma.section.findMany({
    where: { parentId: null, isActive: true },
    orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
    include: {
      children: {
        where: { isActive: true },
        select: { id: true, name: true, nameEn: true },
      },
      _count: {
        select: { modules: { where: { isActive: true } } },
      },
    },
  })

  if (sections.length === 0) {
    ctx.reply(ctx.t('sections-list-empty'))
    return
  }

  const keyboard: any[][] = []

  for (const section of sections) {
    const hasSubSections = (section.children ?? []).length > 0
    const hasModules = (section._count?.modules ?? 0) > 0

    if (hasSubSections) {
      // Main section with sub-sections
      keyboard.push([
        {
          text: `${section.icon} ${ctx.t(section.name as any)}`,
          callback_data: `section:view:${section.id}`,
        },
      ])
    }
    else if (hasModules) {
      // Standalone main section with modules
      keyboard.push([
        {
          text: `${section.icon} ${ctx.t(section.name as any)}`,
          callback_data: `section:view:${section.id}`,
        },
      ])
    }
  }

  keyboard.push([
    { text: ctx.t('button-add-section'), callback_data: 'section:add' },
  ])
  keyboard.push([
    { text: ctx.t('button-back-to-menu'), callback_data: 'menu:main' },
  ])

  ctx.reply(ctx.t('sections-menu-title'), {
    reply_markup: { inline_keyboard: keyboard },
  })
}

/**
 * Display sub-sections for a main section
 * Shows sub-sections + back button
 */
export async function showSubSectionsMenu(ctx: BotContext, parentSectionId: string): Promise<void> {
  const parentSection = await prisma.section.findUnique({
    where: { id: parentSectionId },
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
        include: {
          _count: {
            select: { modules: { where: { isActive: true } } },
          },
        },
      },
    },
  })

  if (!parentSection) {
    logger.warn({ sectionId: parentSectionId }, 'Section not found, returning to menu')
    ctx.answerCallbackQuery(ctx.t('errors-section-not-found'))
    return
  }

  const subSections = parentSection.children ?? []

  if (subSections.length === 0) {
    // No sub-sections, show modules directly
    await showSectionModules(ctx, parentSectionId)
    return
  }

  const keyboard: any[][] = []

  for (const section of subSections) {
    const hasModules = (section._count?.modules ?? 0) > 0

    keyboard.push([
      {
        text: `${section.icon} ${ctx.t(section.name as any)}`,
        callback_data: `section:view:${section.id}`,
      },
    ])
  }

  keyboard.push([
    { text: ctx.t('button-add-subsection'), callback_data: `section:add:${parentSectionId}` },
  ])
  keyboard.push([
    { text: ctx.t('button-back-to-sections'), callback_data: 'menu:sections' },
  ])

  ctx.answerCallbackQuery()
  ctx.editMessageText(ctx.t('subsections-menu-title', {
    parentName: ctx.t(parentSection.name as any),
  }), {
    reply_markup: { inline_keyboard: keyboard },
  })
}

/**
 * Display modules for a section
 * Handles both main sections and sub-sections
 */
export async function showSectionModules(ctx: BotContext, sectionId: string): Promise<void> {
  const section = await prisma.section.findUnique({
    where: { id: sectionId },
    include: {
      children: true,
      modules: {
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  if (!section) {
    logger.warn({ sectionId }, 'Section not found, returning to main menu')
    ctx.answerCallbackQuery(ctx.t('errors-section-not-found'))
    showOrphanedSectionHandler(ctx)
    return
  }

  const hasSubSections = (section.children ?? []).length > 0
  const modules = section.modules ?? []

  if (hasSubSections) {
    // Main section with sub-sections, show sub-sections instead of modules
    await showSubSectionsMenu(ctx, section.id)
    return
  }

  if (modules.length === 0) {
    // Empty section message
    ctx.answerCallbackQuery()
    const keyboard = [
      [{ text: ctx.t('button-back-to-sections'), callback_data: 'menu:sections' }],
    ]
    ctx.editMessageText(ctx.t('section-empty-modules'), {
      reply_markup: { inline_keyboard: keyboard },
    })
    return
  }

  // Display modules using moduleLoader (single source of truth for loaded modules)
  const allLoadedModules = moduleLoader.getLoadedModules()
  const sectionModules = allLoadedModules.filter((m) => {
    // Match by section: check if the module's sectionSlug maps to this section
    return m.config.sectionSlug === section.slug
  }).sort((a, b) => (a.config.orderIndex ?? 0) - (b.config.orderIndex ?? 0))

  const keyboard: any[][] = []

  if (sectionModules.length > 0) {
    for (const mod of sectionModules) {
      keyboard.push([
        {
          text: `${mod.config.icon} ${ctx.t(mod.config.name as any)}`,
          callback_data: `mod:${mod.slug}`,
        },
      ])
    }
  }

  keyboard.push([
    { text: ctx.t('button-back-to-sections'), callback_data: 'menu:sections' },
  ])

  ctx.answerCallbackQuery()
  ctx.editMessageText(ctx.t('section-modules-title', {
    sectionName: ctx.t(section.name as any),
  }), {
    reply_markup: { inline_keyboard: keyboard },
  })
}

/**
 * Handle orphaned section (section deleted while user was viewing it)
 * Per spec Edge Case
 */
export function showOrphanedSectionHandler(ctx: BotContext): void {
  const keyboard = [
    [{ text: ctx.t('button-back-to-menu'), callback_data: 'menu:main' }],
  ]

  ctx.reply(ctx.t('errors-section-deleted'), {
    reply_markup: { inline_keyboard: keyboard },
  })
}

/**
 * Update navigation breadcrumb in session
 * Stores navigation stack as currentMenu array
 */
export async function updateNavigationBreadcrumb(
  ctx: BotContext,
  level: string,
  targetId?: string,
): Promise<void> {
  const currentMenu = ctx.session.currentMenu || []

  // If targetId is provided and already exists, don't duplicate
  if (targetId && currentMenu.some((item: any) => item.id === targetId)) {
    return
  }

  const newMenu = [...currentMenu]
  if (targetId) {
    newMenu.push({ level, id: targetId })
  }
  else {
    newMenu.push({ level, id: 'menu:main' })
  }

  ctx.session.currentMenu = newMenu
  logger.debug({ menu: newMenu }, 'Navigation breadcrumb updated')
}

/**
 * Handle back button navigation
 * Pops last item from navigation stack
 */
export async function handleBackNavigation(ctx: BotContext): Promise<void> {
  const currentMenu = ctx.session.currentMenu || []

  if (currentMenu.length <= 1) {
    // At top level, go back to main menu
    ctx.session.currentMenu = []
    const { menuHandler } = await import('../handlers/menu')
    menuHandler(ctx)
    return
  }

  // Pop current level
  const previousMenu = currentMenu[currentMenu.length - 2] // The one before current
  ctx.session.currentMenu = currentMenu.slice(0, -1)

  // Navigate to previous level
  const previousMenuItem = previousMenu as any
  if (previousMenuItem.level === 'sections') {
    showMainSectionsMenu(ctx)
    return
  }

  if (previousMenuItem.level === 'section') {
    showSectionModules(ctx, previousMenuItem.id)
    return
  }

  if (previousMenuItem.level === 'main') {
    const { menuHandler } = await import('../handlers/menu')
    menuHandler(ctx)
    return
  }

  // Default back to main menu
  ctx.session.currentMenu = []
  const { menuHandler } = await import('../handlers/menu')
  menuHandler(ctx)
}
