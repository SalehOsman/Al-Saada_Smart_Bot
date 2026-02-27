import { type Middleware } from 'grammy'
import { Role } from '@prisma/client'
import { prisma } from '../../database/prisma'
import { rbacService } from '../../services/rbac'
import type { BotContext } from '../../types/context'
import { defaultSession } from './session'
import logger from '../../utils/logger'

/**
 * RBAC and User Status Middleware (T111, T029)
 * 1. Checks if user is active in DB.
 * 2. Protects restricted commands based on role and scope.
 */
export const rbacMiddleware: Middleware<BotContext> = async (ctx, next) => {
  const telegramId = ctx.from?.id ? BigInt(ctx.from.id) : null

  if (!telegramId) {
    return next()
  }

  // 1. ACTIVE CHECK (T111)
  // Fetch user from DB to check current status on every request
  const user = await prisma.user.findUnique({
    where: { telegramId },
    select: { isActive: true, role: true },
  })

  if (user && !user.isActive) {
    logger.warn({ userId: telegramId.toString() }, 'Blocked inactive user attempt')
    
    // Clear session
    ctx.session = defaultSession()
    
    // Notify user
    await ctx.reply(ctx.t('errors-account-deactivated'))
    return // Halt
  }

  // Sync role to session if it changed in DB
  if (user && ctx.session.role !== user.role) {
    ctx.session.role = user.role
  }

  // 2. ROUTE PROTECTION (T029)
  const text = ctx.message?.text || ''
  const command = text.split(' ')[0]
  const currentRole = (user?.role as Role) || Role.VISITOR

  // Super Admin only commands
  const superAdminOnly = ['/users', '/audit', '/maintenance', '/settings']
  if (superAdminOnly.includes(command) && currentRole !== Role.SUPER_ADMIN) {
    logger.warn({ userId: telegramId.toString(), command }, 'Unauthorized command access attempt')
    await ctx.reply(ctx.t('errors-unauthorized'))
    return
  }

  // Scoped/Admin commands
  const adminOnly = ['/sections']
  if (adminOnly.includes(command)) {
    const hasAccess = await rbacService.canAccess(telegramId, currentRole, {
      // In a real section management flow, we'd check specific section IDs if provided
      // For the top-level command, we just check if they are ADMIN/SUPER_ADMIN
    })

    if (!hasAccess) {
      logger.warn({ userId: telegramId.toString(), command }, 'Unauthorized scoped command access attempt')
      await ctx.reply(ctx.t('errors-unauthorized'))
      return
    }
  }

  await next()
}
