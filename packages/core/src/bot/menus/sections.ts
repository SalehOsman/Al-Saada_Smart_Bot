/**
 * @file sections.ts
 * @module bot/menus/sections
 *
 * Section menu display utilities.
 * Handles hierarchical navigation between main sections and sub-sections (FR-019).
 */

import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import { moduleLoader } from '../module-loader'
import { replyOrEdit } from '../utils/reply'

/**
 * Displays the main sections menu.
 * Shows only top-level sections (where parentId is null) and provides an
 * interface for Super Admins to add new sections.
 *
 * @param ctx - The bot context
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
    const emptyKeyboard = [[{ text: ctx.t('button-back-to-menu'), callback_data: 'menu:main' }]]
    await replyOrEdit(ctx, ctx.t('sections-list-empty'), { inline_keyboard: emptyKeyboard })
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

  await replyOrEdit(ctx, ctx.t('sections-menu-title'), { inline_keyboard: keyboard })
}

/**
 * Display sub-sections for a main section
 * Shows sub-sections + direct modules + back button
 */
export async function showSubSectionsMenu(ctx: BotContext, parentSectionId: string): Promise<void> {
  const parentSection = await prisma.section.findUnique({
    where: { id: parentSectionId },
    include: {
      children: {
        where: { isActive: true },
        orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      },
      modules: {
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' },
      },
    },
  })

  if (!parentSection) {
    logger.warn({ sectionId: parentSectionId }, 'Section not found, returning to menu')
    ctx.answerCallbackQuery(ctx.t('errors-section-not-found'))
    return
  }

  const subSections = parentSection.children ?? []
  const directModules = parentSection.modules ?? []

  if (subSections.length === 0 && directModules.length === 0) {
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

  const keyboard: any[][] = []

  // 1. Add Sub-sections
  for (const section of subSections) {
    keyboard.push([
      {
        text: `📂 ${section.icon} ${ctx.t(section.name as any)}`,
        callback_data: `section:view:${section.id}`,
      },
    ])
  }

  // 2. Add Direct Modules
  const allLoadedModules = moduleLoader.getLoadedModules()
  const sectionModules = allLoadedModules.filter((m) => {
    return m.config.sectionSlug === parentSection.slug
  }).sort((a, b) => (a.config.orderIndex ?? 0) - (b.config.orderIndex ?? 0))

  for (const mod of sectionModules) {
    keyboard.push([
      {
        text: `${mod.config.icon} ${ctx.t(mod.config.name as any)}`,
        callback_data: `mod:${mod.slug}`,
      },
    ])
  }

  keyboard.push([
    { text: ctx.t('button-back-to-sections'), callback_data: 'menu:main' },
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
      children: { where: { isActive: true } },
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

  // If it's a main section with children, show the sub-sections menu
  if (!section.parentId && section.children.length > 0) {
    await showSubSectionsMenu(ctx, section.id)
    return
  }

  // Otherwise, show modules for this specific (sub)section
  const allLoadedModules = moduleLoader.getLoadedModules()
  const sectionModules = allLoadedModules.filter((m) => {
    return m.config.sectionSlug === section.slug
  }).sort((a, b) => (a.config.orderIndex ?? 0) - (b.config.orderIndex ?? 0))

  const keyboard: any[][] = []

  for (const mod of sectionModules) {
    keyboard.push([
      {
        text: `${mod.config.icon} ${ctx.t(mod.config.name as any)}`,
        callback_data: `mod:${mod.slug}`,
      },
    ])
  }

  // Determine back button destination
  const backData = section.parentId ? `section:view:${section.parentId}` : 'menu:main'

  keyboard.push([
    { text: ctx.t('button-back-short'), callback_data: backData },
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
    await menuHandler(ctx)
    return
  }

  // Pop current level
  ctx.session.currentMenu = currentMenu.slice(0, -1)
  const previousMenu = ctx.session.currentMenu[ctx.session.currentMenu.length - 1]

  // Navigate to previous level
  const previousMenuItem = previousMenu as any
  if (previousMenuItem.level === 'sections') {
    await showMainSectionsMenu(ctx)
    return
  }

  if (previousMenuItem.level === 'section') {
    await showSectionModules(ctx, previousMenuItem.id)
    return
  }

  if (previousMenuItem.level === 'main') {
    const { menuHandler } = await import('../handlers/menu')
    await menuHandler(ctx)
    return
  }

  // Default back to main menu
  ctx.session.currentMenu = []
  const { menuHandler } = await import('../handlers/menu')
  await menuHandler(ctx)
}
