import { beforeEach, describe, expect, it, vi } from 'vitest'
import { maintenanceService } from '../src/services/maintenance'
import { maintenanceMiddleware } from '../src/bot/middlewares/maintenance'
import { redis } from '../src/cache/redis'
import { auditService } from '../src/services/audit-logs'

// Mock dependencies
vi.mock('../src/cache/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    publish: vi.fn(),
    duplicate: vi.fn(() => ({
      subscribe: vi.fn(),
      on: vi.fn(),
    })),
  },
}))

vi.mock('../src/services/audit-logs', () => ({
  auditService: {
    log: vi.fn(),
  },
}))

vi.mock('../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
  },
}))

describe('maintenance Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when maintenance is on', async () => {
    vi.mocked(redis.get).mockResolvedValue('on')
    const result = await maintenanceService.isMaintenanceMode()
    expect(result).toBe(true)
    expect(redis.get).toHaveBeenCalledWith('system:maintenance:status')
  })

  it('should return false when maintenance is off', async () => {
    vi.mocked(redis.get).mockResolvedValue('off')
    const result = await maintenanceService.isMaintenanceMode()
    expect(result).toBe(false)
  })

  it('should set maintenance mode and publish update', async () => {
    const userId = BigInt(123)
    await maintenanceService.setMaintenanceMode(true, userId)

    expect(redis.set).toHaveBeenCalledWith('system:maintenance:status', 'on')
    expect(redis.publish).toHaveBeenCalledWith('system:maintenance:updates', 'on')
    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      userId,
      action: 'MAINTENANCE_ON',
    }))
  })

  it('should toggle maintenance mode', async () => {
    const userId = BigInt(123)
    vi.mocked(redis.get).mockResolvedValue('off')

    const result = await maintenanceService.toggleMaintenance(userId)

    expect(result).toBe(true)
    expect(redis.set).toHaveBeenCalledWith('system:maintenance:status', 'on')
  })
})

describe('maintenance Middleware', () => {
  const mockNext = vi.fn()
  const mockCtx = {
    session: {},
    from: { id: 123 },
    t: vi.fn(key => key),
    reply: vi.fn(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockCtx.session = {}
  })

  it('should allow Super Admins even if maintenance is on', async () => {
    mockCtx.session.role = 'SUPER_ADMIN'
    vi.mocked(redis.get).mockResolvedValue('on')

    await maintenanceMiddleware(mockCtx, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(mockCtx.reply).not.toHaveBeenCalled()
  })

  it('should block regular users when maintenance is on', async () => {
    mockCtx.session.role = 'EMPLOYEE'
    vi.mocked(redis.get).mockResolvedValue('on')

    await maintenanceMiddleware(mockCtx, mockNext)

    expect(mockNext).not.toHaveBeenCalled()
    expect(mockCtx.reply).toHaveBeenCalledWith('maintenance-active-message')
  })

  it('should allow regular users when maintenance is off', async () => {
    mockCtx.session.role = 'EMPLOYEE'
    vi.mocked(redis.get).mockResolvedValue('off')

    await maintenanceMiddleware(mockCtx, mockNext)

    expect(mockNext).toHaveBeenCalled()
    expect(mockCtx.reply).not.toHaveBeenCalled()
  })
})
