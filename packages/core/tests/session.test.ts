import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { Role, AuditAction } from '@prisma/client'
import { defaultSession, lazySessionMiddleware, sessionMiddleware, ResilientRedisStorage } from '../src/bot/middlewares/session'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockRedis, mockPrisma, mockAuditService, mockLogger } = vi.hoisted(() => ({
  mockRedis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    ping: vi.fn(),
  },
  mockPrisma: {
    user: { findUnique: vi.fn() },
  },
  mockAuditService: {
    log: vi.fn(),
  },
  mockLogger: {
    error: vi.fn(),
    fatal: vi.fn(),
    info: vi.fn(),
  },
}))

vi.mock('../src/cache/redis', () => ({ redis: mockRedis }))
vi.mock('../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../src/services/audit-logs', () => ({ auditService: mockAuditService }))
vi.mock('../src/utils/logger', () => ({ default: mockLogger }))

describe('Session Management (T087/T069)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('defaultSession', () => {
    it('should return correct defaults', () => {
      const session = defaultSession()
      expect(session).toMatchObject({
        role: 'VISITOR',
        language: 'ar',
        __language_code: 'ar',
        currentSection: null,
        currentModule: null,
      })
      expect(session.userId).toBeUndefined()
      expect(typeof session.lastActivity).toBe('number')
    })
  })

  describe('ResilientRedisStorage', () => {
    let storage: ResilientRedisStorage

    beforeEach(() => {
      storage = new ResilientRedisStorage()
    })

    it('read() returns parsed session from Redis', async () => {
      const mockData = { role: 'ADMIN', language: 'en' }
      mockRedis.get.mockResolvedValue(JSON.stringify(mockData))

      const result = await storage.read('user123')

      expect(mockRedis.get).toHaveBeenCalledWith('session:user123')
      expect(result).toEqual(mockData)
    })

    it('write() calls redis.setex with TTL 86400', async () => {
      const mockData = { role: 'ADMIN' }
      await storage.write('user123', mockData)

      expect(mockRedis.setex).toHaveBeenCalledWith('session:user123', 86400, JSON.stringify(mockData))
    })

    it('delete() calls redis.del', async () => {
      await storage.delete('user123')
      expect(mockRedis.del).toHaveBeenCalledWith('session:user123')
    })

    it('falls back to InMemoryStorage when Redis throws', async () => {
      mockRedis.setex.mockRejectedValue(new Error('Redis down'))

      // First call triggers fallback
      const mockData = { role: 'TEMP' }
      await storage.write('key1', mockData)

      expect(mockLogger.fatal).toHaveBeenCalledWith(
        expect.objectContaining({ operation: 'write' }),
        expect.stringContaining('CRITICAL: Redis connection lost')
      )

      // Subsequent calls should use in-memory without calling redis
      mockRedis.setex.mockClear()
      await storage.write('key2', { role: 'IN_MEM' })
      expect(mockRedis.setex).not.toHaveBeenCalled()

      const result = await storage.read('key2')
      expect(result).toEqual({ role: 'IN_MEM' })
    })

    it('reconnects to Redis automatically', async () => {
      // Trigger failure
      mockRedis.get.mockRejectedValue(new Error('Redis down'))
      await storage.read('key')
      expect((storage as any).isRedisAvailable).toBe(false)

      // Advance time for first reconnect attempt (1s)
      mockRedis.ping.mockResolvedValue('PONG')
      await vi.advanceTimersByTimeAsync(1000)

      expect(mockRedis.ping).toHaveBeenCalled()
      expect((storage as any).isRedisAvailable).toBe(true)
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Redis connection restored'))
    })
  })

  describe('lazySessionMiddleware', () => {
    const next = vi.fn()

    it('logs USER_LOGIN + USER_LOGOUT for known users without session', async () => {
      const ctx = {
        from: { id: 12345 },
        session: {},
      } as any

      mockPrisma.user.findUnique.mockResolvedValue({ telegramId: 12345n })

      await lazySessionMiddleware(ctx, next)

      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        userId: 12345n,
        action: AuditAction.USER_LOGOUT,
        details: { reason: 'session_expired_lazy' }
      }))

      expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
        userId: 12345n,
        action: AuditAction.USER_LOGIN
      }))

      expect(ctx.session.userId).toBe(12345)
      expect(next).toHaveBeenCalled()
    })

    it('does NOT log for unknown users (no DB record)', async () => {
      const ctx = {
        from: { id: 999 },
        session: {},
      } as any

      mockPrisma.user.findUnique.mockResolvedValue(null)

      await lazySessionMiddleware(ctx, next)

      expect(mockAuditService.log).not.toHaveBeenCalled()
      expect(ctx.session.userId).toBeUndefined()
      expect(next).toHaveBeenCalled()
    })

    it('skips if session already has userId', async () => {
      const ctx = {
        from: { id: 12345 },
        session: { userId: 12345 },
      } as any

      await lazySessionMiddleware(ctx, next)

      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })
})
