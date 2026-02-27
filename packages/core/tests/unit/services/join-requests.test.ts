import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { joinRequestService } from '../../../src/services/join-requests'

// ─── Mutable env — getter so per-test mutations reach the service ───────────────
const mockEnvData = {
  INITIAL_SUPER_ADMIN_ID: undefined as number | undefined,
}

vi.mock('../../../src/config/env', () => ({
  get env() { return mockEnvData },
}))

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      count: vi.fn(),
      create: vi.fn(),
    },
    joinRequest: {
      count: vi.fn(),
      create: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/utils/logger', () => ({ default: mockLogger }))

describe('joinRequestService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnvData.INITIAL_SUPER_ADMIN_ID = undefined
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('createOrBootstrap', () => {
    const baseParams = {
      telegramId: 12345n,
      fullName: 'Test User',
      nickname: 'TestUser-abc1',
      phone: '01012345678',
      nationalId: '30001011234567',
      birthDate: new Date('2000-01-01'),
      gender: 'MALE' as const,
    }

    it('should bootstrap SUPER_ADMIN when 0 admins exist and ID matches', async () => {
      mockPrisma.user.count.mockResolvedValue(0)
      mockPrisma.user.create.mockResolvedValue({
        id: 'u1',
        telegramId: 12345n,
        fullName: 'Test User',
        role: 'SUPER_ADMIN',
      })
      mockPrisma.auditLog.create.mockResolvedValue({})
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 12345

      const result = await joinRequestService.createOrBootstrap({
        ...baseParams,
        telegramUsername: 'test_user',
      })

      expect(result).toEqual({ type: 'bootstrap' })
      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          telegramId: 12345n,
          telegramUsername: 'test_user',
          fullName: 'Test User',
          nickname: 'TestUser-abc1',
          phone: '01012345678',
          nationalId: '30001011234567',
          role: 'SUPER_ADMIN',
          isActive: true,
        }),
      })
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 12345n,
          action: 'USER_BOOTSTRAP',
          targetType: 'User',
          details: { role: 'SUPER_ADMIN' },
        }),
      })
    })

    it('should create join request when SUPER_ADMIN already exists', async () => {
      mockPrisma.user.count.mockResolvedValue(1)
      mockPrisma.joinRequest.create.mockResolvedValue({
        id: 'jr1',
        ...baseParams,
        status: 'PENDING',
      })
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 12345

      const result = await joinRequestService.createOrBootstrap(baseParams)

      expect(result).toEqual({ type: 'join-request', requestId: 'jr1' })
      expect(mockPrisma.joinRequest.create).toHaveBeenCalled()
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should create join request when ID does not match', async () => {
      mockPrisma.user.count.mockResolvedValue(0)
      mockPrisma.joinRequest.create.mockResolvedValue({
        id: 'jr2',
        ...baseParams,
        status: 'PENDING',
      })
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 99999

      const result = await joinRequestService.createOrBootstrap(baseParams)

      expect(result).toEqual({ type: 'join-request', requestId: 'jr2' })
      expect(mockPrisma.joinRequest.create).toHaveBeenCalled()
    })

    it('should create join request when INITIAL_SUPER_ADMIN_ID is undefined', async () => {
      mockPrisma.user.count.mockResolvedValue(0)
      mockPrisma.joinRequest.create.mockResolvedValue({
        id: 'jr3',
        ...baseParams,
        status: 'PENDING',
      })
      mockEnvData.INITIAL_SUPER_ADMIN_ID = undefined

      const result = await joinRequestService.createOrBootstrap(baseParams)

      expect(result).toEqual({ type: 'join-request', requestId: 'jr3' })
    })
  })

  describe('hasPendingRequest', () => {
    it('should return true when pending request exists', async () => {
      mockPrisma.joinRequest.count.mockResolvedValue(1)

      const result = await joinRequestService.hasPendingRequest(12345n)

      expect(result).toBe(true)
    })

    it('should return false when no pending request', async () => {
      mockPrisma.joinRequest.count.mockResolvedValue(0)

      const result = await joinRequestService.hasPendingRequest(12345n)

      expect(result).toBe(false)
    })
  })

  describe('create', () => {
    it('should create join request with PENDING status', async () => {
      mockPrisma.joinRequest.create.mockResolvedValue({
        id: 'jr1',
        telegramId: 12345n,
        fullName: 'Test User',
        nickname: 'TestUser-abc1',
        phone: '01012345678',
        nationalId: '30001011234567',
        status: 'PENDING',
      })

      const result = await joinRequestService.create({
        telegramId: 12345n,
        fullName: 'Test User',
        nickname: 'TestUser-abc1',
        phone: '01012345678',
        nationalId: '30001011234567',
      })

      expect(result.status).toBe('PENDING')
      expect(mockLogger.info).toHaveBeenCalled()
    })
  })
})
