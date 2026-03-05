import { InlineKeyboard } from 'grammy'
import { AuditAction, Role } from '@prisma/client'
import { prisma } from '../../database/prisma'
import { redis } from '../../cache/redis'
import { adminScopeService } from '../../services/admin-scope'
import type { BotContext } from '../../types/context'
import { auditService } from '../../services/audit-logs'
import logger from '../../utils/logger'
import { replyOrEdit } from '../utils/reply'
import { formatArabicDate, formatArabicDateTime, truncateText } from '../utils/formatters'

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
    const emptyKeyboard = new InlineKeyboard().text(ctx.t('button-back-to-menu'), 'menu:main')
    return replyOrEdit(ctx, ctx.t('users-list-empty'), emptyKeyboard)
  }

  const keyboard = new InlineKeyboard()
  for (const user of users) {
    const status = user.isActive ? '✅' : '🚫'
    const displayName = user.nickname || user.fullName
    // Truncate display name for mobile buttons
    const truncatedName = truncateText(displayName, 20)
    keyboard.text(`${status} ${truncatedName} (${user.role})`, `user:view:${user.telegramId}`)
    keyboard.row()
  }

  // Add back button for super admin menus matching the pattern
  keyboard.text(ctx.t('button-back-to-menu'), 'menu:main')

  return replyOrEdit(ctx, ctx.t('users-list-title'), keyboard)
}

/**
 * Handle user management actions
 */
export async function userActionsHandler(ctx: BotContext) {
  const query = ctx.callbackQuery?.data
  if (!query)
    return

  if (query === 'users:list') {
    return usersHandler(ctx)
  }

  const [_, action, targetIdStr, extra] = query.split(':')
  const targetId = BigInt(targetIdStr)

  if (action === 'view') {
    return showUserProfile(ctx, targetId)
  }

  if (action === 'toggle_confirm') {
    if (targetId.toString() === ctx.from?.id.toString()) {
      return ctx.answerCallbackQuery(ctx.t('errors-cannot-change-own-role')) // Reuse this message or make a new one, this accurately reflects the system rejection.
    }

    const user = await prisma.user.findUnique({ where: { telegramId: targetId } })
    if (!user) {
      return ctx.answerCallbackQuery(ctx.t('errors-user-not-found'))
    }

    // Set confirmation state in redis with 5 minute TTL (300 seconds)
    await redis.setex(`confirm:user_toggle:${ctx.from?.id}:${targetId}`, 300, 'pending')

    const keyboard = new InlineKeyboard()
      .text(ctx.t('button-confirm-short'), `user:toggle_execute:${targetId}`)
      .text(ctx.t('button-cancel-short'), `user:toggle_cancel:${targetId}`)

    const msgKey = user.isActive ? 'confirmation-deactivate-user' : 'confirmation-activate-user'
    return ctx.editMessageText(ctx.t(msgKey, { name: user.fullName }), { reply_markup: keyboard })
  }

  if (action === 'toggle_cancel') {
    await redis.del(`confirm:user_toggle:${ctx.from?.id}:${targetId}`)
    await ctx.answerCallbackQuery(ctx.t('confirmation-cancelled'))
    return showUserProfile(ctx, targetId)
  }

  if (action === 'toggle_execute') {
    const confirmKey = `confirm:user_toggle:${ctx.from?.id}:${targetId}`
    const hasConfirm = await redis.get(confirmKey)

    if (!hasConfirm) {
      await ctx.answerCallbackQuery(ctx.t('confirmation-timeout'))
      return showUserProfile(ctx, targetId)
    }

    await redis.del(confirmKey)

    const user = await prisma.user.findUnique({ where: { telegramId: targetId } })
    if (!user) {
      return ctx.answerCallbackQuery(ctx.t('errors-user-not-found'))
    }

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

    await ctx.answerCallbackQuery(ctx.t('confirmation-confirmed'))
    return showUserProfile(ctx, targetId)
  }

  if (action === 'role') {
    const newRole = extra as Role

    // 1. Prevent self-demotion/role change
    if (targetId.toString() === ctx.from?.id.toString()) {
      return ctx.answerCallbackQuery(ctx.t('errors-cannot-change-own-role'))
    }

    // 2. Prevent demoting the last Super Admin
    if (newRole !== Role.SUPER_ADMIN) {
      const userToDemote = await prisma.user.findUnique({ where: { telegramId: targetId } })
      if (userToDemote?.role === Role.SUPER_ADMIN) {
        const superAdminCount = await prisma.user.count({ where: { role: Role.SUPER_ADMIN, isActive: true } })
        if (superAdminCount <= 1) {
          return ctx.answerCallbackQuery(ctx.t('errors-cannot-demote-last-super-admin'))
        }
      }
    }

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
    return showUserProfile(ctx, targetId)
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

/**
 * Displays comprehensive unmasked user profile.
 * Principle VI: PII masking only for AuditLogs. User-facing admin views must display complete original data.
 */
async function showUserProfile(ctx: BotContext, telegramId: bigint) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
  })

  if (!user)
    return ctx.reply(ctx.t('errors-user-not-found'))

  const keyboard = new InlineKeyboard()

  // Toggle Active (now requires confirmation) - Only if not viewing own profile
  if (telegramId.toString() !== ctx.from?.id.toString()) {
    keyboard.text(
      user.isActive ? ctx.t('button-deactivate-short') : ctx.t('button-activate-short'),
      `user:toggle_confirm:${telegramId}`,
    )
    keyboard.row()
  }

  // Change Role (Only if not viewing own profile)
  if (telegramId.toString() !== ctx.from?.id.toString()) {
    const roles: Role[] = ['ADMIN', 'EMPLOYEE', 'VISITOR']

    // Add SUPER_ADMIN to available roles if the executor is a SUPER_ADMIN
    // (We know the executor is a SUPER_ADMIN if they can see this menu, but let's be explicit and safe)
    if (ctx.session?.role === Role.SUPER_ADMIN) {
      roles.unshift('SUPER_ADMIN')
    }

    for (const role of roles) {
      if (user.role !== role) {
        keyboard.text(ctx.t(`role-${role.toLowerCase()}`), `user:role:${telegramId}:${role}`)
      }
    }
    keyboard.row()
  }

  // Admin Scopes (Only for ADMIN role)
  if (user.role === Role.ADMIN) {
    keyboard.text(ctx.t('button-manage-scopes'), `user:scopes:${telegramId}`)
    keyboard.row()
  }

  keyboard.text(ctx.t('button-back-short'), 'users:list')

  const text = ctx.t('profile-display', {
    fullName: user.fullName,
    nickname: user.nickname || ctx.t('profile-nickname-not-set'),
    phone: user.phone || ctx.t('value-unknown'),
    nationalId: user.nationalId || ctx.t('value-unknown'),
    role: ctx.t(`role-${user.role.toLowerCase()}`),
    language: user.language,
    status: user.isActive ? ctx.t('profile-status-active') : ctx.t('profile-status-inactive'),
    joinDate: formatArabicDate(user.createdAt),
    lastActive: user.lastActiveAt ? formatArabicDateTime(user.lastActiveAt) : ctx.t('value-unknown'),
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
    keyboard.text(`❌ ${truncateText(scope.section.name, 18)}`, `user:scope_revoke:${telegramId}:${scope.sectionId}`)
    keyboard.row()
  }

  // List available sections to assign
  const existingSectionIds = new Set(currentScopes.map(s => s.sectionId))
  for (const section of allSections) {
    if (!existingSectionIds.has(section.id)) {
      keyboard.text(`➕ ${truncateText(section.name, 18)}`, `user:scope_assign:${telegramId}:${section.id}`)
      keyboard.row()
    }
  }

  keyboard.text(ctx.t('button-back-short'), `user:view:${telegramId}`)

  return ctx.editMessageText(ctx.t('user-scopes-title', { name: user.nickname || user.fullName }), {
    reply_markup: keyboard,
  })
}
