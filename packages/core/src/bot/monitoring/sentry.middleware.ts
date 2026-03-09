/**
 * @file sentry.middleware.ts
 * @module bot/monitoring/sentry.middleware
 *
 * GrammY middleware for Sentry error tracking.
 */

import type { NextFunction } from 'grammy'
import * as Sentry from '@sentry/node'
import type { BotContext } from '../../types/context'

/**
 * Middleware to enrich Sentry scope with user and context information.
 * Captures Telegram user ID, chat ID, and update type for better error reporting.
 *
 * @param ctx - The bot context
 * @param next - The next middleware in the stack
 */
export async function sentryMiddleware(ctx: BotContext, next: NextFunction) {
  // Set user context
  if (ctx.from) {
    Sentry.setUser({
      id: ctx.from.id.toString(),
    })
  }

  // Set additional tags
  if (ctx.chat) {
    Sentry.setTag('chat_id', ctx.chat.id.toString())
  }

  Sentry.setTag('update_type', (ctx as any).updateType || 'unknown')

  // Set extra context
  Sentry.setContext('telegram_update', {
    update_id: ctx.update.update_id,
  })

  await next()
}
