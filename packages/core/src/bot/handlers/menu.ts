import type { Prisma, Role } from '@prisma/client'
import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'
import type { LoadedModule } from '../module-loader'
import { moduleLoader } from '../module-loader'

/** User row including adminScopes — matches to findUnique query in menuHandler */
type MenuUser = Prisma.UserGetPayload<{ include: { adminScopes: true } }>

/**
 * Handles different role-based menu displays
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

    // Get authorized modules
    const modules = await getAuthorizedModules(user)

    // Build menu based on role and modules
    await showDynamicMenu(ctx, user, modules)
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

  // Get all section slugs for which user has scope
  const sectionIds = (user.adminScopes || []).map(s => s.sectionId)
  let scopedSectionSlugs: string[] = []

  if (sectionIds.length > 0) {
    const sections = await prisma.section.findMany({
      where: { id: { in: sectionIds } },
      select: { id: true, slug: true },
    })
    scopedSectionSlugs = sections.map(s => s.slug)
  }

  return allModules.filter((m) => {
    const permissions = m.config.permissions
    const isRoleAllowed = permissions.view.includes(user.role as Role)

    if (!isRoleAllowed)
      return false

    // ADMIN must have scope for the module's section
    if (user.role === 'ADMIN') {
      return scopedSectionSlugs.includes(m.config.sectionSlug)
    }

    return true
  })
}

/**
 * Renders a menu with system buttons and authorized modules.
 */
async function showDynamicMenu(ctx: BotContext, user: MenuUser, modules: LoadedModule[]) {
  const menuText = ctx.t(`menu-${user.role.toLowerCase()}` as any, { name: user.fullName })

  const keyboard: any[][] = []

  // 1. Add Role-Specific System Buttons
  if (user.role === 'SUPER_ADMIN') {
    keyboard.push([
      { text: ctx.t('button-sections'), callback_data: 'menu-sections' },
      { text: ctx.t('button-users'), callback_data: 'menu-users' },
    ])
    keyboard.push([
      { text: ctx.t('button-maintenance'), callback_data: 'menu-maintenance' },
      { text: ctx.t('button-audit'), callback_data: 'menu-audit' },
    ])
    keyboard.push([
      { text: ctx.t('button-settings'), callback_data: 'menu-settings' },
    ])
    keyboard.push([
      { text: ctx.t('button-modules'), callback_data: 'menu-modules' },
      { text: ctx.t('button-notifications'), callback_data: 'menu-notifications' },
    ])
  }
  else if (user.role === 'ADMIN') {
    // ADMIN: Sections (scoped) + Users (scoped) only — no Maintenance/Audit (spec US1)
    keyboard.push([
      { text: ctx.t('button-sections'), callback_data: 'menu-sections' },
      { text: ctx.t('button-users'), callback_data: 'menu-users' },
    ])
  }
  else {
    // EMPLOYEE / VISITOR
    keyboard.push([
      { text: ctx.t('button-sections'), callback_data: 'menu-sections' },
    ])
  }

  // 2. Add Module Buttons (Grouped by Section could be added later, for now just append)
  if (modules.length > 0) {
    // Add a separator or header? Inline keyboards don't support headers well.
    // We'll just add them in rows of 2.
    for (let i = 0; i < modules.length; i += 2) {
      const row = []
      const m1 = modules[i]
      row.push({ text: `${m1.config.icon} ${ctx.t(m1.config.name as any)}`, callback_data: `mod:${m1.slug}` })

      if (i + 1 < modules.length) {
        const m2 = modules[i + 1]
        row.push({ text: `${m2.config.icon} ${ctx.t(m2.config.name as any)}`, callback_data: `mod:${m2.slug}` })
      }

      keyboard.push(row)
    }
  }

  await ctx.reply(menuText, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  })
}
