import type { NextFunction } from 'grammy'
import * as Sentry from '@sentry/node'
import type { BotContext } from '../../types/context'

/**
 * Middleware to enrich Sentry scope with user and context information
 */
export async function sentryMiddleware(ctx: BotContext, next: NextFunction) {
  // Set user context
  if (ctx.from) {
    Sentry.setUser({
      id: ctx.from.id.toString(),
      username: ctx.from.username,
    })
  }

  // Set additional tags
  if (ctx.chat) {
    Sentry.setTag('chat_id', ctx.chat.id.toString())
  }
  
  Sentry.setTag('update_type', (ctx as any).updateType || 'unknown')
  
  if (ctx.session?.role) {
    Sentry.setTag('user_role', ctx.session.role)
  }

  // Set extra context
  Sentry.setContext('telegram_update', {
    update_id: ctx.update.update_id,
  })

  await next()
}
