import { beforeEach, describe, expect, it, vi } from 'vitest'

// Mock ALL transitive imports of session.ts BEFORE importing it
vi.mock('grammy', () => ({
  session: vi.fn((_opts: any) => async (_ctx: any, next: any) => next()),
}))
vi.mock('../../src/cache/redis', () => ({
  redis: {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    ping: vi.fn(),
  },
}))
vi.mock('../../src/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), fatal: vi.fn(), debug: vi.fn() },
}))
vi.mock('../../src/database/prisma', () => ({ prisma: {} }))
vi.mock('../../src/services/audit-logs', () => ({ auditService: { log: vi.fn() } }))

import { ResilientRedisStorage } from '../../src/bot/middlewares/session'
import { redis } from '../../src/cache/redis'

const mockRedis = redis as any

describe('t079: redis fallback behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  it('test 1 & 2: redis fails -> switches to InMemory -> read/write works', async () => {
    const storage = new ResilientRedisStorage()

    mockRedis.get.mockRejectedValue(new Error('Connection lost'))

    const value1 = await storage.read('user:1')
    expect(value1).toBeUndefined()
    expect(mockRedis.get).toHaveBeenCalledWith('session:user:1')

    mockRedis.setex.mockClear()
    await storage.write('user:1', { role: 'ADMIN' } as any)
    expect(mockRedis.setex).not.toHaveBeenCalled()

    const value2 = await storage.read('user:1')
    expect(value2).toEqual({ role: 'ADMIN' })
  })

  it('test 3: redis recovers -> switches back to redis', async () => {
    const storage = new ResilientRedisStorage()

    mockRedis.get.mockRejectedValue(new Error('Connection lost'))
    await storage.read('user:1')

    mockRedis.ping.mockResolvedValue('PONG')
    vi.advanceTimersByTime(1000)
    await vi.runAllTimersAsync()

    mockRedis.setex.mockResolvedValue('OK')
    await storage.write('user:2', { role: 'USER' } as any)

    expect(mockRedis.ping).toHaveBeenCalled()
    expect(mockRedis.setex).toHaveBeenCalledWith('session:user:2', 86400, expect.any(String))
  })
})
