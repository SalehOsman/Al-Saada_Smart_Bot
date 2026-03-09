import type { BotError } from 'grammy'
import * as Sentry from '@sentry/node'
import type { BotContext } from '../../types/context'
import logger from '../../utils/logger'
import { sentryService } from '../monitoring/sentry.service'
import { errorAlertService } from '../monitoring/error-alert.service'

// Error handling middleware for grammY
export async function errorHandler(err: BotError<BotContext>) {
  const ctx = err.ctx
  const e = err.error instanceof Error ? err.error : new Error(String(err.error))

  // 1. Log the error with context
  logger.error({
    err: e,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    updateId: ctx.update.update_id,
  }, 'Bot error occurred')

  // 2. Capture exception to Sentry (FR-001)
  Sentry.setTag('user_role', ctx.session.role || 'unknown')
  sentryService.captureException(e, {
    update: ctx.update,
    session: ctx.session,
  })

  // 3. Send alert to SUPER_ADMIN via Telegram (FR-006)
  // We determine location based on the update type or command
  const location = ctx.callbackQuery?.data || ctx.message?.text || 'unknown update'
  await errorAlertService.sendAlert(e, location)

  // 4. Send user-friendly message via i18n
  try {
    await ctx.reply(ctx.t('error-generic'))
  }
  catch {
    // If we can't even reply, just log it
    logger.error('Failed to send error message to user')
  }
}
