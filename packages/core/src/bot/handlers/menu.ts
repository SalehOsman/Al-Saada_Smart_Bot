import type { Prisma } from '@prisma/client'
import type { BotContext } from '../../types/context'
import { prisma } from '../../database/prisma'
import logger from '../../utils/logger'

/** User row including adminScopes — matches the findUnique query in menuHandler */
type MenuUser = Prisma.UserGetPayload<{ include: { adminScopes: true } }>

/**
 * Handles different role-based menu displays
 * SUPER_ADMIN: Full admin access
 * ADMIN: Admin management capabilities
 * EMPLOYEE: Employee-level access
 * VISITOR: Basic visitor access
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

    // Get role-specific menu text
    switch (user.role) {
      case 'SUPER_ADMIN':
        await showSuperAdminMenu(ctx, user)
        break
      case 'ADMIN':
        await showAdminMenu(ctx, user)
        break
      case 'EMPLOYEE':
        await showEmployeeMenu(ctx, user)
        break
      case 'VISITOR':
        await showVisitorMenu(ctx, user)
        break
      default:
        await showVisitorMenu(ctx, user)
    }
  } catch (error) {
    logger.error('Error in menu handler:', error)
    return ctx.reply(ctx.t('error-generic'))
  }
}

/**
 * Shows menu for Super Admin users with full system access
 */
async function showSuperAdminMenu(ctx: BotContext, user: MenuUser) {
  const menuText = ctx.t('menu-super-admin', { name: user.fullName })

  // Create keyboard buttons
  const keyboard = [
    [
      { text: ctx.t('button-sections'), callback_data: 'menu-sections' },
      { text: ctx.t('button-users'), callback_data: 'menu-users' },
    ],
    [
      { text: ctx.t('button-maintenance'), callback_data: 'menu-maintenance' },
      { text: ctx.t('button-audit'), callback_data: 'menu-audit' },
    ],
    [
      { text: ctx.t('button-modules'), callback_data: 'menu-modules' },
      { text: ctx.t('button-notifications'), callback_data: 'menu-notifications' },
    ],
  ]

  await ctx.reply(menuText, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  })
}

/**
 * Shows menu for Admin users with management capabilities
 */
async function showAdminMenu(ctx: BotContext, user: MenuUser) {
  const menuText = ctx.t('menu-admin', { name: user.fullName })

  // Create keyboard buttons
  const keyboard = [
    [
      { text: ctx.t('button-sections'), callback_data: 'menu-sections' },
      { text: ctx.t('button-users'), callback_data: 'menu-users' },
    ],
    [
      { text: ctx.t('button-maintenance'), callback_data: 'menu-maintenance' },
      { text: ctx.t('button-audit'), callback_data: 'menu-audit' },
    ],
  ]

  await ctx.reply(menuText, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  })
}

/**
 * Shows menu for Employee users with limited access
 */
async function showEmployeeMenu(ctx: BotContext, user: MenuUser) {
  const menuText = ctx.t('menu-employee', { name: user.fullName })

  // Create keyboard buttons for employee-level access
  const keyboard = [
    [
      { text: ctx.t('button-sections'), callback_data: 'menu-sections' },
    ],
  ]

  await ctx.reply(menuText, {
    reply_markup: {
      inline_keyboard: keyboard,
    },
  })
}

/**
 * Shows menu for Visitor users with basic access
 */
async function showVisitorMenu(ctx: BotContext, user: MenuUser) {
  const menuText = ctx.t('menu-visitor', { name: user.fullName })

  await ctx.reply(menuText, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: ctx.t('button-sections'), callback_data: 'menu-sections' },
        ],
      ],
    },
  })
}
