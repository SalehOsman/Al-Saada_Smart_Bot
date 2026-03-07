import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  formatArabicDate,
  formatArabicDateTime,
  formatGender,
  notifyAdmins,
  truncateText,
} from '../../../../src/bot/utils/formatters'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockQueueBulkNotifications } = vi.hoisted(() => ({
  mockPrisma: {
    user: {
      findMany: vi.fn(),
    },
  },
  mockQueueBulkNotifications: vi.fn(),
}))

vi.mock('../../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../../src/services/notifications', () => ({
  queueBulkNotifications: mockQueueBulkNotifications,
}))
vi.mock('../../../../src/utils/logger', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

describe('formatters', () => {
  describe('formatArabicDate', () => {
    it('should format valid date as DD/MM/YYYY', () => {
      const date = new Date('2026-03-06T10:00:00')
      expect(formatArabicDate(date)).toBe('06/03/2026')
    })

    it('should return value-unknown for undefined/null', () => {
      expect(formatArabicDate(undefined)).toBe('value-unknown')
      expect(formatArabicDate(null)).toBe('value-unknown')
    })
  })

  describe('formatArabicDateTime', () => {
    it('should format valid date as DD/MM/YYYY HH:MM', () => {
      const date = new Date('2026-03-06T14:30:00')
      expect(formatArabicDateTime(date)).toBe('06/03/2026 14:30')
    })

    it('should return value-unknown for undefined/null', () => {
      expect(formatArabicDateTime(undefined)).toBe('value-unknown')
    })
  })

  describe('formatGender', () => {
    it('should return correct keys', () => {
      expect(formatGender('MALE')).toBe('gender-male')
      expect(formatGender('FEMALE')).toBe('gender-female')
      expect(formatGender(undefined)).toBe('gender-unknown')
    })
  })

  describe('truncateText', () => {
    it('should truncate long text', () => {
      expect(truncateText('Hello World', 5)).toBe('He...')
    })

    it('should not truncate short text', () => {
      expect(truncateText('Hello', 10)).toBe('Hello')
    })

    it('should return empty string for null', () => {
      expect(truncateText(null)).toBe('')
    })
  })

  describe('notifyAdmins', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should queue notifications for all active admins', async () => {
      mockPrisma.user.findMany.mockResolvedValue([
        { telegramId: 111n },
        { telegramId: 222n },
      ])

      await notifyAdmins({
        type: 'JOIN_REQUEST_NEW' as any,
        params: { name: 'Test' },
      })

      expect(mockQueueBulkNotifications).toHaveBeenCalledWith([
        { targetUserId: 111n, type: 'JOIN_REQUEST_NEW', params: { name: 'Test' } },
        { targetUserId: 222n, type: 'JOIN_REQUEST_NEW', params: { name: 'Test' } },
      ])
    })

    it('should skip if no admins found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([])
      await notifyAdmins({ type: 'JOIN_REQUEST_NEW' as any })
      expect(mockQueueBulkNotifications).not.toHaveBeenCalled()
    })
  })
})
