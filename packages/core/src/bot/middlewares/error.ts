import type { BotError, Context } from 'grammy'
import logger from '../../utils/logger'

// Error handling middleware for grammY
export function errorHandler(err: BotError<Context>) {
  const ctx = err.ctx
  const e = err.error

  // Log the error with context
  logger.error({
    err: e,
    userId: ctx.from?.id,
    chatId: ctx.chat?.id,
    update: ctx.update.update_id,
  }, 'Bot error occurred')

  // Send user-friendly Arabic message
  try {
    ctx.reply('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.')
  }
  catch {
    // If we can't even reply, just log it
    logger.error('Failed to send error message to user')
  }
}
