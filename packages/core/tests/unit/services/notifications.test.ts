import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { 
  queueNotification, 
  queueBulkNotifications, 
  getNotificationHistory,
  getUnreadCount
} from '../../../src/services/notifications'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockQueue } = vi.hoisted(() => ({
  mockPrisma: {
    notification: {
      create: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(),
  },
  mockQueue: { add: vi.fn(), addBulk: vi.fn() },
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/services/queue', () => ({ notificationsQueue: mockQueue }))
vi.mock('../../../src/utils/logger', () => ({ 
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() } 
}))

describe('notificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('queueNotification', () => {
    it('should create a notification and add to queue', async () => {
      const data = { targetUserId: 111n, type: 'TEST' as any, params: { key: 'val' } }
      mockPrisma.notification.create.mockResolvedValue({ id: 'n1' })

      const id = await queueNotification(data)

      expect(id).toBe('n1')
      expect(mockPrisma.notification.create).toHaveBeenCalledWith({
        data: expect.objectContaining({ targetUserId: 111n, type: 'TEST' })
      })
      expect(mockQueue.add).toHaveBeenCalledWith('notification-TEST', data, { jobId: 'n1' })
    })
  })

  describe('queueBulkNotifications', () => {
    it('should create notifications in transaction and add bulk to queue', async () => {
      const items = [
        { targetUserId: 111n, type: 'T1' as any },
        { targetUserId: 222n, type: 'T2' as any }
      ]
      mockPrisma.$transaction.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }])

      const ids = await queueBulkNotifications(items)

      expect(ids).toEqual(['n1', 'n2'])
      expect(mockQueue.addBulk).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'notification-T1', data: items[0], opts: { jobId: 'n1' } }),
        expect.objectContaining({ name: 'notification-T2', data: items[1], opts: { jobId: 'n2' } })
      ])
    })
  })

  describe('getNotificationHistory', () => {
    it('should return paginated history', async () => {
      mockPrisma.notification.findMany.mockResolvedValue([{ id: 'n1' }])
      mockPrisma.notification.count.mockResolvedValue(10)

      const result = await getNotificationHistory(111n, { page: 2, limit: 5 })

      expect(result.notifications).toHaveLength(1)
      expect(result.total).toBe(10)
      expect(result.totalPages).toBe(2)
      expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 5,
        take: 5
      }))
    })
  })

  describe('getUnreadCount', () => {
    it('should return unread count for user', async () => {
      mockPrisma.notification.count.mockResolvedValue(5)
      const count = await getUnreadCount(111n)
      expect(count).toBe(5)
      expect(mockPrisma.notification.count).toHaveBeenCalledWith({
        where: { targetUserId: 111n, isRead: false }
      })
    })
  })
})
