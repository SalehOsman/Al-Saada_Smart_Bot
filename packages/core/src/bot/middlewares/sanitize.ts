import type { NextFunction } from 'grammy'
import { sanitizeHtml } from '@al-saada/validators'
import type { BotContext } from '../../types/context'

/**
 * Middleware that sanitizes all incoming text messages to prevent XSS.
 * Removes/escapes HTML tags from ctx.message.text (FR-033).
 */
export async function sanitizeMiddleware(ctx: BotContext, next: NextFunction) {
  if (ctx.message?.text) {
    ctx.message.text = sanitizeHtml(ctx.message.text)
  }

  await next()
}
