import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { auditService } from '../src/services/audit-logs'
import { AuditAction } from '@prisma/client'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger } = vi.hoisted(() => ({
  mockPrisma: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  },
  mockLogger: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

vi.mock('../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../src/utils/logger', () => ({ default: mockLogger }))

describe('Audit Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('log', () => {
    it('should call prisma.auditLog.create with correct data', async () => {
      const data = {
        userId: BigInt(123),
        action: 'USER_LOGIN' as AuditAction,
        targetType: 'User',
        targetId: '123',
        details: { ip: '127.0.0.1' },
      }

      await auditService.log(data)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: data.userId,
          action: data.action,
          targetType: data.targetType,
          targetId: data.targetId,
          details: data.details,
        },
      })
    })

    it('should fail silently and log error on prisma error', async () => {
      const data = {
        userId: BigInt(123),
        action: 'USER_LOGIN' as AuditAction,
      }
      const error = new Error('Prisma error')
      mockPrisma.auditLog.create.mockRejectedValue(error)

      await expect(auditService.log(data)).resolves.not.toThrow()
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: error }),
        'Audit logging failed'
      )
    })

    describe('Redaction (T063)', () => {
      it('should redact nationalId and phone', async () => {
        const data = {
          userId: BigInt(123),
          action: 'JOIN_REQUEST_SUBMIT' as AuditAction,
          details: { nationalId: '12345', phone: '01234' },
        }

        await auditService.log(data)

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            details: {
              nationalId: '[REDACTED]',
              phone: '[REDACTED]',
            },
          }),
        })
      })

      it('should NOT redact fullName (allowed field)', async () => {
        const data = {
          userId: BigInt(123),
          action: 'JOIN_REQUEST_SUBMIT' as AuditAction,
          details: { fullName: 'Ahmed' },
        }

        await auditService.log(data)

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            details: {
              fullName: 'Ahmed',
            },
          }),
        })
      })

      it('should redact token and apiKey', async () => {
        const data = {
          userId: BigInt(123),
          action: 'JOIN_REQUEST_SUBMIT' as AuditAction,
          details: { token: 'abc', apiKey: 'xyz' },
        }

        await auditService.log(data)

        expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
          data: expect.objectContaining({
            details: {
              token: '[REDACTED]',
              apiKey: '[REDACTED]',
            },
          }),
        })
      })
    })
  })

  describe('getAuditLogs', () => {
    it('should return paginated results', async () => {
      const logs = [{ id: '1', action: 'USER_LOGIN' }]
      mockPrisma.auditLog.findMany.mockResolvedValue(logs)
      mockPrisma.auditLog.count.mockResolvedValue(10)

      const result = await auditService.getAuditLogs({ page: 2, limit: 5 })

      expect(result).toEqual({
        logs,
        total: 10,
        page: 2,
        totalPages: 2,
      })
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 5,
        take: 5,
        orderBy: { createdAt: 'desc' },
      }))
    })

    it('should filter by userId', async () => {
      const userId = BigInt(456)
      mockPrisma.auditLog.findMany.mockResolvedValue([])
      mockPrisma.auditLog.count.mockResolvedValue(0)

      await auditService.getAuditLogs({ userId })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ userId }),
      }))
    })

    it('should filter by action', async () => {
      const action = 'ROLE_CHANGE' as AuditAction
      mockPrisma.auditLog.findMany.mockResolvedValue([])
      mockPrisma.auditLog.count.mockResolvedValue(0)

      await auditService.getAuditLogs({ action })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({ action }),
      }))
    })

    it('should filter by date range', async () => {
      const fromDate = new Date('2026-01-01')
      const toDate = new Date('2026-01-31')
      mockPrisma.auditLog.findMany.mockResolvedValue([])
      mockPrisma.auditLog.count.mockResolvedValue(0)

      await auditService.getAuditLogs({ fromDate, toDate })

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: expect.objectContaining({
          createdAt: {
            gte: fromDate,
            lte: toDate,
          },
        }),
      }))
    })

    it('should use default pagination values', async () => {
      mockPrisma.auditLog.findMany.mockResolvedValue([])
      mockPrisma.auditLog.count.mockResolvedValue(0)

      await auditService.getAuditLogs({})

      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 20,
      }))
    })
  })

  describe('Convenience Wrappers', () => {
    it('should provide getAuditLogsByUser convenience wrapper', async () => {
      const userId = BigInt(123)
      const spy = vi.spyOn(auditService, 'getAuditLogs').mockResolvedValue({} as any)
      
      await auditService.getAuditLogsByUser(userId, 1, 10)
      
      expect(spy).toHaveBeenCalledWith({ userId, page: 1, limit: 10 })
    })

    it('should provide getAuditLogsByAction convenience wrapper', async () => {
      const action = 'USER_LOGIN' as AuditAction
      const spy = vi.spyOn(auditService, 'getAuditLogs').mockResolvedValue({} as any)
      
      await auditService.getAuditLogsByAction(action, 2, 50)
      
      expect(spy).toHaveBeenCalledWith({ action, page: 2, limit: 50 })
    })
  })

  describe('getAuditLogCount', () => {
    it('should return total count from prisma', async () => {
      mockPrisma.auditLog.count.mockResolvedValue(100)
      
      const result = await auditService.getAuditLogCount()
      
      expect(result).toBe(100)
      expect(mockPrisma.auditLog.count).toHaveBeenCalled()
    })
  })
})
