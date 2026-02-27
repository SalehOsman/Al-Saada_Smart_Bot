import { type StorageAdapter, session, Middleware } from 'grammy'
import { redis } from '../../cache/redis'
import type { SessionData, BotContext } from '../../types/context'
import logger from '../../utils/logger'
import { prisma } from '../../database/prisma'
import { auditService } from '../../services/audit-logs'
import { AuditAction } from '@prisma/client'

// Default session data
export function defaultSession(): SessionData {
  return {
    userId: undefined,
    role: 'VISITOR',
    language: 'ar',
    __language_code: 'ar',
    currentSection: null,
    currentModule: null,
    lastActivity: Date.now(),
  }
}

// Redis-backed storage adapter for grammY sessions
const redisStorage: StorageAdapter<SessionData> = {
  async read(key: string): Promise<SessionData | undefined> {
    try {
      const value = await redis.get(`session:${key}`)
      return value ? JSON.parse(value) : undefined
    }
    catch (error) {
      logger.error({ err: error, key }, 'Error reading session')
      return undefined
    }
  },

  async write(key: string, value: SessionData): Promise<void> {
    try {
      await redis.setex(`session:${key}`, 86400, JSON.stringify(value)) // 24h TTL
    }
    catch (error) {
      logger.error({ err: error, key }, 'Error writing session')
    }
  },

  async delete(key: string): Promise<void> {
    try {
      await redis.del(`session:${key}`)
    }
    catch (error) {
      logger.error({ err: error, key }, 'Error deleting session')
    }
  },
}

// Create session middleware
export const sessionMiddleware = session({
  initial: defaultSession,
  storage: redisStorage,
})

/**
 * Lazy session tracking middleware (FR-026 + T066-B).
 * Detects USER_LOGIN events when a session is missing but the user exists in DB.
 */
export const lazySessionMiddleware: Middleware<BotContext> = async (ctx, next) => {
  // Only process if it's a message/callback from a user and they don't have a userId in session
  if (ctx.from?.id && !ctx.session.userId) {
    const telegramId = BigInt(ctx.from.id)

    // Check if this is a known user in the database
    const user = await prisma.user.findUnique({
      where: { telegramId },
      select: { telegramId: true },
    })

    if (user) {
      // Known user re-interacting after session expiry
      // Both events are inferred from session absence (T066-B)
      await auditService.log({
        userId: telegramId,
        action: AuditAction.USER_LOGOUT,
        details: { reason: 'session_expired_lazy' },
      })

      await auditService.log({
        userId: telegramId,
        action: AuditAction.USER_LOGIN,
      })

      // Update session with known userId
      ctx.session.userId = ctx.from.id
    }
  }

  await next()
}
