import { InlineKeyboard } from 'grammy'
import { AuditAction, Role } from '@prisma/client'
import { prisma } from '../../database/prisma'
import { redis } from '../../cache/redis'
import { adminScopeService } from '../../services/admin-scope'
import type { BotContext } from '../../types/context'
import { auditService } from '../../services/audit-logs'
import logger from '../../utils/logger'

/**
 * Super Admin user management handler (/users)
 * US1, US2, FR-017
 */
export async function usersHandler(ctx: BotContext) {
  const users = await prisma.user.findMany({
    take: 10, // Simple first 10 users for brevity
    orderBy: { createdAt: 'desc' },
  })

  if (users.length === 0) {
    return ctx.reply(ctx.t('users-list-empty'))
  }

  const keyboard = new InlineKeyboard()
  for (const user of users) {
    const status = user.isActive ? '✅' : '🚫'
    keyboard.text(`${status} ${user.fullName} (${user.role})`, `user:view:${user.telegramId}`)
    keyboard.row()
  }

  return ctx.reply(ctx.t('users-list-title'), { reply_markup: keyboard })
}

/**
 * Handle user management actions
 */
export async function userActionsHandler(ctx: BotContext) {
  const query = ctx.callbackQuery?.data
  if (!query)
    return

  const [_, action, targetIdStr, extra] = query.split(':')
  const targetId = BigInt(targetIdStr)

  if (action === 'view') {
    return showUserDetails(ctx, targetId)
  }

  if (action === 'toggle') {
    const user = await prisma.user.findUnique({ where: { telegramId: targetId } })
    if (!user)
      return ctx.answerCallbackQuery(ctx.t('errors-user-not-found'))

    const newStatus = !user.isActive
    await prisma.user.update({
      where: { telegramId: targetId },
      data: { isActive: newStatus },
    })

    if (!newStatus) {
      // Trigger session deletion from Redis (logout)
      await redis.del(`session:${targetId}`)
      logger.info({ userId: targetId.toString() }, 'User deactivated, session cleared')
    }

    await auditService.log({
      userId: BigInt(ctx.from?.id || 0),
      action: newStatus ? AuditAction.USER_ACTIVATE : AuditAction.USER_DEACTIVATE,
      targetType: 'User',
      targetId: targetId.toString(),
    })

    await ctx.answerCallbackQuery(ctx.t('user-status-updated'))
    return showUserDetails(ctx, targetId)
  }

  if (action === 'role') {
    const newRole = extra as Role
    await prisma.user.update({
      where: { telegramId: targetId },
      data: { role: newRole },
    })

    await auditService.log({
      userId: BigInt(ctx.from?.id || 0),
      action: AuditAction.ROLE_CHANGE,
      targetType: 'User',
      targetId: targetId.toString(),
      details: { newRole },
    })

    await ctx.answerCallbackQuery(ctx.t('user-role-updated'))
    return showUserDetails(ctx, targetId)
  }

  if (action === 'scopes') {
    return showUserScopes(ctx, targetId)
  }

  if (action === 'scope_assign') {
    const sectionId = extra
    await adminScopeService.assignScope({
      userId: targetId,
      sectionId,
      createdBy: BigInt(ctx.from?.id || 0),
    })
    await ctx.answerCallbackQuery(ctx.t('scope-assigned'))
    return showUserScopes(ctx, targetId)
  }

  if (action === 'scope_revoke') {
    const scopeId = extra // In this simple case, extra is the sectionId for section-wide scope
    await adminScopeService.revokeScope({
      userId: targetId,
      sectionId: scopeId,
    })
    await ctx.answerCallbackQuery(ctx.t('scope-revoked'))
    return showUserScopes(ctx, targetId)
  }
}

async function showUserDetails(ctx: BotContext, telegramId: bigint) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  })

  if (!user)
    return ctx.reply(ctx.t('errors-user-not-found'))

  const keyboard = new InlineKeyboard()

  // Toggle Active
  keyboard.text(
    user.isActive ? ctx.t('button-deactivate') : ctx.t('button-activate'),
    `user:toggle:${telegramId}`,
  )
  keyboard.row()

  // Change Role
  const roles: Role[] = ['ADMIN', 'EMPLOYEE', 'VISITOR']
  for (const role of roles) {
    if (user.role !== role) {
      keyboard.text(ctx.t(`role-${role.toLowerCase()}`), `user:role:${telegramId}:${role}`)
    }
  }
  keyboard.row()

  // Admin Scopes (Only for ADMIN role)
  if (user.role === Role.ADMIN) {
    keyboard.text(ctx.t('button-manage-scopes'), `user:scopes:${telegramId}`)
    keyboard.row()
  }

  keyboard.text(ctx.t('button-back-to-list'), 'users:list')

  const text = ctx.t('user-details', {
    name: user.fullName,
    role: user.role,
    status: user.isActive ? ctx.t('status-active') : ctx.t('status-inactive'),
    phone: user.phone || ctx.t('value-unknown'),
  })

  return ctx.editMessageText(text, { reply_markup: keyboard })
}

async function showUserScopes(ctx: BotContext, telegramId: bigint) {
  const user = await prisma.user.findUnique({ where: { telegramId } })
  if (!user)
    return ctx.answerCallbackQuery(ctx.t('errors-user-not-found'))

  const currentScopes = await adminScopeService.getScopes(telegramId)
  const allSections = await prisma.section.findMany({ where: { isActive: true } })

  const keyboard = new InlineKeyboard()

  // List existing scopes with revoke option
  for (const scope of currentScopes) {
    keyboard.text(`❌ ${scope.section.name}`, `user:scope_revoke:${telegramId}:${scope.sectionId}`)
    keyboard.row()
  }

  // List available sections to assign
  const existingSectionIds = new Set(currentScopes.map(s => s.sectionId))
  for (const section of allSections) {
    if (!existingSectionIds.has(section.id)) {
      keyboard.text(`➕ ${section.name}`, `user:scope_assign:${telegramId}:${section.id}`)
      keyboard.row()
    }
  }

  keyboard.text(ctx.t('button-back-to-user'), `user:view:${telegramId}`)

  return ctx.editMessageText(ctx.t('user-scopes-title', { name: user.fullName }), {
    reply_markup: keyboard,
  })
}
