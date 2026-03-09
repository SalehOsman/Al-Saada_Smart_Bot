import { limit } from '@grammyjs/ratelimiter'
import type { NextFunction } from 'grammy'
import { Role } from '@prisma/client'
import { env } from '../../config/env'
import type { BotContext } from '../../types/context'

/**
 * Rate limiting middleware to prevent bot abuse.
 * Configurable via environment variables.
 * Bypasses for SUPER_ADMIN users.
 */
export function rateLimitMiddleware() {
  if (!env.RATE_LIMIT_ENABLED) {
    return async (_ctx: BotContext, next: NextFunction) => {
      await next()
    }
  }

  const limiter = limit<BotContext, any>({
    timeFrame: env.RATE_LIMIT_WINDOW_MINUTES * 60 * 1000,
    limit: env.RATE_LIMIT_REQUESTS_PER_MINUTE,
    onLimitExceeded: async (ctx) => {
      // Use existing i18n key with seconds param
      // Full duration of the window where user is blocked
      const seconds = env.RATE_LIMIT_WINDOW_MINUTES * 60
      await ctx.reply(ctx.t('error-rate-limit', { seconds }))
    },
    keyGenerator: (ctx) => {
      return ctx.from?.id.toString()
    },
  })

  return async (ctx: BotContext, next: NextFunction) => {
    // SUPER_ADMIN bypass (FR-016)
    if (ctx.session?.role === Role.SUPER_ADMIN) {
      await next()
      return
    }

    await limiter(ctx, next)
  }
}
