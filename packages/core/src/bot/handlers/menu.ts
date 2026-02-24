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
      return ctx.reply(ctx.t('user_inactive'))
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

    // Log menu access
    await prisma.auditLog.create({
      data: {
        userId: telegramId,
        action: 'MENU_ACCESS',
        targetType: 'User',
        targetId: user.id,
        details: { role: user.role },
      },
    })
  }
  catch (error) {
    logger.error('Error in menu handler:', error)
    return ctx.reply(ctx.t('error_generic'))
  }
}

/**
 * Shows menu for Super Admin users with full system access
 */
async function showSuperAdminMenu(ctx: BotContext, user: MenuUser) {
  const menuText = ctx.t('menu_super_admin', { name: user.fullName })

  // Create keyboard buttons
  const keyboard = [
    [
      { text: ctx.t('button_sections'), callback_data: 'menu_sections' },
      { text: ctx.t('button_users'), callback_data: 'menu_users' },
    ],
    [
      { text: ctx.t('button_maintenance'), callback_data: 'menu_maintenance' },
      { text: ctx.t('button_audit'), callback_data: 'menu_audit' },
    ],
    [
      { text: ctx.t('button_modules'), callback_data: 'menu_modules' },
      { text: ctx.t('button_notifications'), callback_data: 'menu_notifications' },
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
  const menuText = ctx.t('menu_admin', { name: user.fullName })

  // Create keyboard buttons
  const keyboard = [
    [
      { text: ctx.t('button_sections'), callback_data: 'menu_sections' },
      { text: ctx.t('button_users'), callback_data: 'menu_users' },
    ],
    [
      { text: ctx.t('button_maintenance'), callback_data: 'menu_maintenance' },
      { text: ctx.t('button_audit'), callback_data: 'menu_audit' },
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
  const menuText = ctx.t('menu_employee', { name: user.fullName })

  // Create keyboard buttons for employee-level access
  const keyboard = [
    [
      { text: ctx.t('button_sections'), callback_data: 'menu_sections' },
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
  const menuText = ctx.t('menu_visitor', { name: user.fullName })

  await ctx.reply(menuText, {
    reply_markup: {
      inline_keyboard: [
        [
          { text: ctx.t('button_sections'), callback_data: 'menu_sections' },
        ],
      ],
    },
  })
}
