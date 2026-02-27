import type { BotError } from 'grammy'
import type { BotContext } from '../../types/context'
import logger from '../../utils/logger'

// Error handling middleware for grammY
export function errorHandler(err: BotError<BotContext>) {
  const ctx = err.ctx
  const e = err.error

  // Log the error with context
  logger.error({
    err: e,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    update: ctx.update.update_id,
  }, 'Bot error occurred')

  // Send user-friendly message via i18n
  try {
    ctx.reply(ctx.t('error-generic'))
  }
  catch {
    // If we can't even reply, just log it
    logger.error('Failed to send error message to user')
  }
}
