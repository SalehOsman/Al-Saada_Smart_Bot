import { InlineKeyboard } from 'grammy'
import { AuditAction } from '@prisma/client'
import type { BotContext } from '../../types/context'
import { auditService } from '../../services/audit-logs'

/**
 * Shows the main audit menu.
 * Restricted to SUPER_ADMIN.
 */
export async function auditHandler(ctx: BotContext) {
  if (ctx.session.role !== 'SUPER_ADMIN') {
    return ctx.reply(ctx.t('errors-unauthorized'))
  }

  const keyboard = new InlineKeyboard()
    .text(ctx.t('audit-button-recent'), 'audit:recent')
    .row()
    .text(ctx.t('audit-button-filter-action'), 'audit:filter_action')
    .text(ctx.t('audit-button-filter-user'), 'audit:filter_user')
    .row()
    .text(ctx.t('audit-button-stats'), 'audit:stats')

  await ctx.reply(ctx.t('audit-menu-title'), { reply_markup: keyboard })
}

/**
 * Handles audit-related callback queries.
 */
export async function auditActionsHandler(ctx: BotContext) {
  if (ctx.session.role !== 'SUPER_ADMIN') {
    await ctx.answerCallbackQuery({ text: ctx.t('errors-unauthorized'), show_alert: true })
    return
  }

  const query = ctx.callbackQuery?.data
  if (!query)
    return

  if (query === 'audit:main') {
    const keyboard = new InlineKeyboard()
      .text(ctx.t('audit-button-recent'), 'audit:recent')
      .row()
      .text(ctx.t('audit-button-filter-action'), 'audit:filter_action')
      .text(ctx.t('audit-button-filter-user'), 'audit:filter_user')
      .row()
      .text(ctx.t('audit-button-stats'), 'audit:stats')

    await ctx.editMessageText(ctx.t('audit-menu-title'), { reply_markup: keyboard })
  }
  else if (query === 'audit:recent') {
    await showAuditLogs(ctx, 1)
  }
  else if (query.startsWith('audit:page:')) {
    const page = Number.parseInt(query.split(':')[2])
    await showAuditLogs(ctx, page)
  }
  else if (query === 'audit:filter_action') {
    await showActionFilter(ctx)
  }
  else if (query.startsWith('audit:action:')) {
    const action = query.split(':')[2] as AuditAction
    await showAuditLogs(ctx, 1, { action })
  }
  else if (query.startsWith('audit:user:')) {
    const userId = BigInt(query.split(':')[2])
    await showAuditLogs(ctx, 1, { userId })
  }
  else if (query === 'audit:stats') {
    await showAuditStats(ctx)
  }

  await ctx.answerCallbackQuery()
}

/**
 * Helper to display paginated audit logs.
 */
async function showAuditLogs(ctx: BotContext, page: number, filters: { action?: AuditAction, userId?: bigint } = {}) {
  const limit = 10
  const { logs, totalPages } = await auditService.getAuditLogs({ page, limit, ...filters })

  if (logs.length === 0) {
    await ctx.editMessageText(ctx.t('audit-no-logs'), {
      reply_markup: new InlineKeyboard().text(ctx.t('button-back'), 'audit:main'),
    })
    return
  }

  let message = `${ctx.t('audit-menu-title')}\n\n`
  for (const log of logs) {
    const date = log.createdAt.toLocaleString(ctx.session.language === 'ar' ? 'ar-EG' : 'en-US')
    message += `${ctx.t('audit-log-entry', {
      date,
      action: log.action,
      userId: log.userId.toString(),
    })}\n`
    if (log.targetType || log.targetId) {
      message += `└ target: ${log.targetType || '?'}/${log.targetId || '?'}\n`
    }
    message += '\n'
  }

  message += ctx.t('audit-page-info', { page, totalPages })

  const keyboard = new InlineKeyboard()

  if (page > 1) {
    keyboard.text(ctx.t('button-prev-page'), `audit:page:${page - 1}`)
  }
  if (page < totalPages) {
    keyboard.text(ctx.t('button-next-page'), `audit:page:${page + 1}`)
  }

  keyboard.row().text(ctx.t('button-back'), 'audit:main')

  await ctx.editMessageText(message, { reply_markup: keyboard })
}

/**
 * Shows list of actions to filter by.
 */
async function showActionFilter(ctx: BotContext) {
  const keyboard = new InlineKeyboard()
  const actions = Object.values(AuditAction)

  // Display actions in rows of 2
  for (let i = 0; i < actions.length; i += 2) {
    keyboard.text(actions[i], `audit:action:${actions[i]}`)
    if (actions[i + 1]) {
      keyboard.text(actions[i + 1], `audit:action:${actions[i + 1]}`)
    }
    keyboard.row()
  }

  keyboard.text(ctx.t('button-back'), 'audit:main')

  await ctx.editMessageText(ctx.t('audit-button-filter-action'), { reply_markup: keyboard })
}

/**
 * Shows audit statistics.
 */
async function showAuditStats(ctx: BotContext) {
  const count = await auditService.getAuditLogCount()
  const message = ctx.t('audit-stats-total', { count })

  const keyboard = new InlineKeyboard().text(ctx.t('button-back'), 'audit:main')
  await ctx.editMessageText(message, { reply_markup: keyboard })
}
