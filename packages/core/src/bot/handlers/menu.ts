/**
 * @file menu.ts
 * @module bot/handlers/menu
 *
 * Role-based main menu handler and module filtering logic.
 */

import type { Prisma, Role } from '@prisma/client'
import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import type { LoadedModule } from '../module-loader'
import { moduleLoader } from '../module-loader'
import { maintenanceService } from '../../services/maintenance'
import { replyOrEdit } from '../utils/reply'

/** User row including adminScopes — matches to findUnique query in menuHandler */
type MenuUser = Prisma.UserGetPayload<{ include: { adminScopes: true } }>

/**
 * Entry point for the main menu.
 * Fetches the user's role and scopes, filters authorized modules,
 * and renders a dynamic inline keyboard menu.
 *
 * @param ctx - The bot context
 */
export async function menuHandler(ctx: BotContext) {
  const telegramId = BigInt(ctx.from?.id || 0)
  if (telegramId === 0n)
    return

  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { telegramId },
      include: {
        adminScopes: true,
      },
    })

    if (!user || !user.isActive) {
      return ctx.reply(ctx.t('user-inactive'))
    }

    // Menu access is not one of the 25 defined AuditActions — no audit log here.
    // Audit logging is reserved for state-changing actions (FR-026).

    logger.debug('menuHandler: User fetched successfully, building modules list...')
    // Get authorized modules
    const modules = await getAuthorizedModules(user)
    logger.debug(`menuHandler: Got ${modules.length} authorized modules, rendering menu...`)

    // Build menu based on role and modules
    await showDynamicMenu(ctx, user, modules)
    logger.debug('menuHandler: Menu successfully sent to user.')
  }
  catch (error) {
    logger.error('Error in menu handler:', error)
    return ctx.reply(ctx.t('error-generic'))
  }
}

/**
 * Filters loaded modules based on user role and scopes.
 */
async function getAuthorizedModules(user: MenuUser): Promise<LoadedModule[]> {
  const allModules = moduleLoader.getLoadedModules()

  if (user.role === 'SUPER_ADMIN') {
    return allModules
  }

  // Get all section IDs for which user has scope
  const scopedSectionIds = (user.adminScopes || []).map(s => s.sectionId)
  if (scopedSectionIds.length === 0 && user.role === 'ADMIN') {
    return []
  }

  // For ADMIN, we need to find all sub-sections of their scoped sections
  let authorizedSectionSlugs: string[] = []
  if (user.role === 'ADMIN') {
    const sections = await prisma.section.findMany({
      where: {
        OR: [
          { id: { in: scopedSectionIds } },
          { parentId: { in: scopedSectionIds } },
        ],
      },
      select: { slug: true },
    })
    authorizedSectionSlugs = sections.map(s => s.slug)
  }

  return allModules.filter((m) => {
    const permissions = m.config.permissions
    const isRoleAllowed = permissions.view.includes(user.role as Role)

    if (!isRoleAllowed)
      return false

    // ADMIN must have scope for the module's section or its parent
    if (user.role === 'ADMIN') {
      return authorizedSectionSlugs.includes(m.config.sectionSlug)
    }

    return true
  })
}

/**
 * Renders a menu with system buttons and authorized modules.
 */
async function showDynamicMenu(ctx: BotContext, user: MenuUser, modules: LoadedModule[]) {
  const displayName = user.nickname || user.fullName
  const menuText = ctx.t(`menu-${user.role.toLowerCase().replace(/_/g, '-')}` as any, { name: displayName })

  const keyboard: any[][] = []

  // 1. Add Role-Specific System Buttons
  if (user.role === 'SUPER_ADMIN') {
    const isMaintenance = await maintenanceService.isMaintenanceMode()
    const maintenanceLabel = isMaintenance
      ? ctx.t('button-maintenance-off')
      : ctx.t('button-maintenance-on')

    keyboard.push([
      { text: `🗂️ ${ctx.t('button-sections-manage')}`, callback_data: 'menu-sections' },
      { text: `👥 ${ctx.t('button-users')}`, callback_data: 'menu-users' },
    ])
    keyboard.push([
      { text: `🔧 ${maintenanceLabel}`, callback_data: 'menu-maintenance' },
      { text: `📋 ${ctx.t('button-audit')}`, callback_data: 'menu-audit' },
    ])
    keyboard.push([{ text: ctx.t('button-settings'), callback_data: 'menu-settings' }])
    keyboard.push([
      { text: `📦 ${ctx.t('button-modules-manage')}`, callback_data: 'menu-modules' },
      { text: `🔔 ${ctx.t('button-notifications')}`, callback_data: 'menu-notifications' },
    ])
  }
  else if (user.role === 'ADMIN') {
    keyboard.push([
      { text: ctx.t('button-sections-manage'), callback_data: 'menu-sections' },
      { text: ctx.t('button-users'), callback_data: 'menu-users' },
    ])
  }

  // 2. Add Main Sections for Navigation (FR-005)
  const scopedSectionIds = (user.adminScopes || []).map(s => s.sectionId)
  const allMainSections = await prisma.section.findMany({
    where: { parentId: null, isActive: true },
    include: { children: { where: { isActive: true }, select: { slug: true } } },
    orderBy: { orderIndex: 'asc' },
  })

  // Determine which sections to show
  let mainSections = allMainSections
  if (user.role !== 'SUPER_ADMIN') {
    const authorizedSectionSlugs = new Set(modules.map(m => m.config.sectionSlug))
    mainSections = allMainSections.filter((s) => {
      if (authorizedSectionSlugs.has(s.slug)) {
        return true
      }
      if (s.children.some(c => authorizedSectionSlugs.has(c.slug))) {
        return true
      }
      if (user.role === 'ADMIN' && scopedSectionIds.includes(s.id)) {
        return true
      }
      return false
    })
  }

  if (mainSections.length > 0) {
    // Add a separator label if we have many sections?
    // keyboard.push([{ text: `--- ${ctx.t('label-sections')} ---`, callback_data: 'noop' }])
    for (let i = 0; i < mainSections.length; i += 2) {
      const row = []
      const s1 = mainSections[i]
      row.push({ text: `${s1.icon} ${ctx.t(s1.name as any)}`, callback_data: `section:view:${s1.id}` })

      if (i + 1 < mainSections.length) {
        const s2 = mainSections[i + 1]
        row.push({ text: `${s2.icon} ${ctx.t(s2.name as any)}`, callback_data: `section:view:${s2.id}` })
      }
      keyboard.push(row)
    }
  }

  // 3. Add Standalone Module Buttons (those not in sections or just keep the old behavior for now)
  // For now, we only show sections. If a module is not in a main section, it might be in a sub-section.
  // The user navigates through sections to find modules.
  // EXCEPT for modules that might be assigned directly to the user or are global?
  // The current logic shows ALL authorized modules in a flat list.
  // We should probably change this to only show modules if they are not in a section or if the user wants a flat list.
  // Spec says: Main Menu -> Section Menu -> Sub-section Menu -> Module.
  // So we SHOULD NOT list all modules in the main menu anymore.

  logger.debug('showDynamicMenu: Calling replyOrEdit()')
  await replyOrEdit(ctx, menuText, {
    inline_keyboard: keyboard,
  })
  logger.debug('showDynamicMenu: replyOrEdit() completed')
}
