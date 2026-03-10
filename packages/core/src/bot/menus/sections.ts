/**
 * @file sections.ts
 * @module bot/menus/sections
 *
 * Section menu display utilities.
 * Handles hierarchical navigation between main sections and sub-sections (FR-019).
 */

import type { Role } from '@prisma/client'
import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import { moduleLoader } from '../module-loader'
import { replyOrEdit } from '../utils/reply'

/**
 * Displays the main sections management menu (Super Admin only).
 * Shows only top-level sections (where parentId is null) and provides an
 * interface for Super Admins to add new sections.
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
    keyboard.push([
      {
        text: `${section.icon} ${ctx.t(section.name as any)}`,
        callback_data: `section:view:${section.id}`,
      },
    ])
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
 * Display modules for a section
 * Handles both main sections and sub-sections with hierarchical navigation (US2)
 */
export async function showSectionModules(ctx: BotContext, sectionId: string): Promise<void> {
  const telegramId = BigInt(ctx.from?.id || 0)

  // 1. Fetch section and user info for authorization
  const [section, user] = await Promise.all([
    prisma.section.findUnique({
      where: { id: sectionId },
      include: {
        children: { where: { isActive: true }, orderBy: { orderIndex: 'asc' } },
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    }),
    prisma.user.findUnique({
      where: { telegramId },
      include: { adminScopes: true },
    }),
  ])

  if (!section || !user) {
    logger.warn({ sectionId }, 'Section or User not found')
    ctx.answerCallbackQuery(ctx.t('error-generic'))
    return
  }

  const allLoadedModules = moduleLoader.getLoadedModules()
  const keyboard: any[][] = []

  // 2. Filter authorized sub-sections and modules
  if (user.role === 'SUPER_ADMIN') {
    // Super Admin sees everything
    for (const child of section.children) {
      keyboard.push([
        {
          text: `📁 ${child.icon} ${ctx.t(child.name as any)}`,
          callback_data: `section:view:${child.id}`,
        },
      ])
    }

    const sectionModules = allLoadedModules.filter(m => m.config.sectionSlug === section.slug)
    for (const mod of sectionModules) {
      keyboard.push([
        {
          text: `${mod.config.icon} ${ctx.t(mod.config.name as any)}`,
          callback_data: `mod:${mod.slug}`,
        },
      ])
    }
  }
  else {
    // RBAC filtering for ADMIN/EMPLOYEE
    const authorizedSectionSlugs = new Set<string>()
    const scopedSectionIds = (user.adminScopes || []).map(s => s.sectionId)

    // Filter modules based on role permissions
    const authorizedModules = allLoadedModules.filter((m) => {
      const isRoleAllowed = m.config.permissions.view.includes(user.role as Role)
      if (!isRoleAllowed)
        return false

      if (user.role === 'ADMIN') {
        // ADMIN needs scope for this section or its parent
        return scopedSectionIds.includes(section.id) || (section.parentId && scopedSectionIds.includes(section.parentId))
      }
      return true
    })

    authorizedModules.forEach(m => authorizedSectionSlugs.add(m.config.sectionSlug))

    // Add sub-sections if they have authorized modules or admin has scope
    for (const child of section.children) {
      const hasAuthModules = allLoadedModules.some(m =>
        m.config.sectionSlug === child.slug
        && m.config.permissions.view.includes(user.role as Role),
      )

      if (hasAuthModules || (user.role === 'ADMIN' && scopedSectionIds.includes(child.id))) {
        keyboard.push([
          {
            text: `📁 ${child.icon} ${ctx.t(child.name as any)}`,
            callback_data: `section:view:${child.id}`,
          },
        ])
      }
    }

    // Add modules in this specific section
    const sectionModules = authorizedModules.filter(m => m.config.sectionSlug === section.slug)
    for (const mod of sectionModules) {
      keyboard.push([
        {
          text: `${mod.config.icon} ${ctx.t(mod.config.name as any)}`,
          callback_data: `mod:${mod.slug}`,
        },
      ])
    }
  }

  // 3. Determine back button destination (T017)
  const backData = section.parentId ? `section:view:${section.parentId}` : 'menu:main'
  keyboard.push([
    { text: ctx.t('button-back-short'), callback_data: backData },
  ])

  const titleKey = section.parentId ? 'subsections-menu-title' : 'section-modules-title'
  const titleParams = section.parentId
    ? { parentName: ctx.t(section.name as any) }
    : { sectionName: ctx.t(section.name as any) }

  ctx.answerCallbackQuery()
  await replyOrEdit(ctx, ctx.t(titleKey as any, titleParams as any), {
    inline_keyboard: keyboard,
  })
}

/**
 * Handle back button navigation (breadcrumb-based if used, or direct)
 */
export async function handleBackNavigation(ctx: BotContext): Promise<void> {
  const { menuHandler } = await import('../handlers/menu')
  await menuHandler(ctx)
}

/**
 * Legacy handler for backward compatibility if needed
 */
export async function showSubSectionsMenu(ctx: BotContext, parentSectionId: string): Promise<void> {
  return showSectionModules(ctx, parentSectionId)
}

/**
 * Update navigation breadcrumb in session
 * Stub for backward compatibility
 */
export async function updateNavigationBreadcrumb(
  _ctx: BotContext,
  _level: string,
  _targetId?: string,
): Promise<void> {
  // Navigation is now handled dynamically without explicit breadcrumb pushing
}
