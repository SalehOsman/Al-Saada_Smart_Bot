import { describe, it, expect, vi, beforeEach } from 'vitest'
import { settingsService } from '../src/services/settings'
import { settingsHandler } from '../src/bot/handlers/settings'
import { redis } from '../src/cache/redis'
import { prisma } from '../src/database/prisma'

// Mock dependencies
vi.mock('../src/cache/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    smembers: vi.fn(),
    sismember: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
    ping: vi.fn()
  }
}))

vi.mock('../src/database/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn()
  }
}))

vi.mock('../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn()
  }
}))

describe('Settings Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should get default language (default to ar)', async () => {
    vi.mocked(redis.get).mockResolvedValue(null)
    const lang = await settingsService.getDefaultLanguage()
    expect(lang).toBe('ar')
  })

  it('should set default language', async () => {
    await settingsService.setDefaultLanguage('en')
    expect(redis.set).toHaveBeenCalledWith('system:defaultLanguage', 'en')
  })

  it('should get system info', async () => {
    vi.mocked(prisma.$queryRaw).mockResolvedValue([1])
    vi.mocked(redis.ping).mockResolvedValue('PONG')
    
    const info = await settingsService.getSystemInfo()
    expect(info.dbStatus).toBe('UP')
    expect(info.redisStatus).toBe('UP')
    expect(info.env).toBeDefined()
  })
})

describe('Settings Handler', () => {
  const mockCtx = {
    session: { role: 'SUPER_ADMIN' },
    t: vi.fn(key => key),
    reply: vi.fn()
  } as any

  it('should show settings menu for Super Admin', async () => {
    await settingsHandler(mockCtx)
    expect(mockCtx.reply).toHaveBeenCalledWith('settings-menu-welcome', expect.any(Object))
  })

  it('should deny access for non-Super Admin', async () => {
    mockCtx.session.role = 'EMPLOYEE'
    await settingsHandler(mockCtx)
    expect(mockCtx.reply).toHaveBeenCalledWith('errors-unauthorized')
  })
})
