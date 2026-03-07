import { beforeEach, describe, expect, it, vi } from 'vitest'
import { queueBulkNotifications, queueNotification } from '../../src/services/notifications'

const { mockPrisma, mockBullMQ } = vi.hoisted(() => ({
  mockPrisma: {
    notification: { create: vi.fn() },
    $transaction: vi.fn(),
  },
  mockBullMQ: {
    add: vi.fn(),
    addBulk: vi.fn(),
  },
}))

vi.mock('../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../src/services/queue', () => ({ notificationsQueue: mockBullMQ }))
vi.mock('../../src/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))
vi.mock('../../src/cache/redis', () => ({ redis: {} }))

describe('t099: notification delivery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('queues notification: creates DB record + adds BullMQ job', async () => {
    mockPrisma.notification.create.mockResolvedValue({ id: 'n1' })

    await queueNotification({
      targetUserId: 1234n,
      type: 'JOIN_REQUEST_NEW' as any,
    })

    expect(mockPrisma.notification.create).toHaveBeenCalledWith({
      data: { targetUserId: 1234n, type: 'JOIN_REQUEST_NEW', params: {} },
    })
    expect(mockBullMQ.add).toHaveBeenCalledWith(
      'notification-JOIN_REQUEST_NEW',
      { targetUserId: 1234n, type: 'JOIN_REQUEST_NEW' },
      { jobId: 'n1' },
    )
  })

  it('queues bulk notifications: creates multiple DB records + adds bulk jobs', async () => {
    mockPrisma.$transaction.mockResolvedValue([{ id: 'n1' }, { id: 'n2' }])

    await queueBulkNotifications([
      { targetUserId: 111n, type: 'JOIN_REQUEST_NEW' as any },
      { targetUserId: 222n, type: 'JOIN_REQUEST_NEW' as any },
    ])

    expect(mockBullMQ.addBulk).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'notification-JOIN_REQUEST_NEW', opts: { jobId: 'n1' } }),
      expect.objectContaining({ name: 'notification-JOIN_REQUEST_NEW', opts: { jobId: 'n2' } }),
    ])
  })

  it.skip('notification worker processes job and calls sendMessage', async () => {
    // TODO: enable when worker processor binding is stable in test environment
  })
})
