import { session } from 'grammy'
import type { Middleware, StorageAdapter } from 'grammy'

import { AuditAction } from '@prisma/client'
import { redis } from '../../cache/redis'
import type { BotContext, SessionData } from '../../types/context'
import logger from '../../utils/logger'
import { prisma } from '../../database/prisma'
import { auditService } from '../../services/audit-logs'

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

/**
 * In-memory storage adapter for grammY sessions (fallback for Redis).
 */
export class InMemoryStorage implements StorageAdapter<SessionData> {
  private storage = new Map<string, string>()

  async read(key: string): Promise<SessionData | undefined> {
    const value = this.storage.get(key)
    return value ? JSON.parse(value) : undefined
  }

  async write(key: string, value: SessionData): Promise<void> {
    this.storage.set(key, JSON.stringify(value))
  }

  async delete(key: string): Promise<void> {
    this.storage.delete(key)
  }
}

/**
 * Resilient Redis storage adapter with in-memory fallback and auto-reconnection.
 */
export class ResilientRedisStorage implements StorageAdapter<SessionData> {
  private inMemoryStorage = new InMemoryStorage()
  private isRedisAvailable = true
  private reconnectAttempts = 0
  private maxBackoff = 30000
  private reconnectTimeout: NodeJS.Timeout | null = null

  async read(key: string): Promise<SessionData | undefined> {
    if (this.isRedisAvailable) {
      try {
        const value = await redis.get(`session:${key}`)
        return value ? JSON.parse(value) : undefined
      }
      catch (error) {
        this.handleRedisError(error, 'read', key)
      }
    }
    return this.inMemoryStorage.read(key)
  }

  async write(key: string, value: SessionData): Promise<void> {
    if (this.isRedisAvailable) {
      try {
        await redis.setex(`session:${key}`, 86400, JSON.stringify(value)) // 24h TTL
        return
      }
      catch (error) {
        this.handleRedisError(error, 'write', key)
      }
    }
    await this.inMemoryStorage.write(key, value)
  }

  async delete(key: string): Promise<void> {
    if (this.isRedisAvailable) {
      try {
        await redis.del(`session:${key}`)
        return
      }
      catch (error) {
        this.handleRedisError(error, 'delete', key)
      }
    }
    await this.inMemoryStorage.delete(key)
  }

  private handleRedisError(error: any, operation: string, key: string): void {
    if (this.isRedisAvailable) {
      this.isRedisAvailable = false
      logger.fatal({ err: error, operation, key }, 'CRITICAL: Redis connection lost. Falling back to in-memory sessions.')
      this.scheduleReconnect()
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout)
      return

    const backoff = Math.min(1000 * 2 ** this.reconnectAttempts, this.maxBackoff)
    this.reconnectTimeout = setTimeout(async () => {
      this.reconnectTimeout = null
      try {
        await redis.ping()
        this.isRedisAvailable = true
        this.reconnectAttempts = 0
        logger.info('Redis connection restored. Resuming Redis sessions.')
      }
      catch {
        this.reconnectAttempts++
        this.scheduleReconnect()
      }
    }, backoff)
  }
}

// Create session middleware using resilient storage
export const sessionMiddleware = session({
  initial: defaultSession,
  storage: new ResilientRedisStorage(),
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

  // Always update lastActiveAt for known users upon interaction
  if (ctx.from?.id && ctx.session.userId) {
    // Fire-and-forget update (non-blocking) with error logging
    prisma.user.update({
      where: { telegramId: BigInt(ctx.from.id) },
      data: { lastActiveAt: new Date() },
      select: { telegramId: true }, // Minimal select for performance
    }).catch((e) => {
      // Ignore errors if the user doesn't actually exist in the DB yet (e.g., during join flow)
      logger.debug({ err: e }, 'Failed to update lastActiveAt')
    })
    
    // TODO: Implement per-user debouncing to avoid excessive writes in high-scale scenarios
    // Consider checking/updating a Redis timestamp key for ctx.from.id to skip updates more than once per minute
  }

  await next()
}
