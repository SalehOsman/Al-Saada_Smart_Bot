import logger from '../utils/logger'
import { prisma } from '../database/prisma'
import { notificationsQueue } from './queue'
import type { NotificationJobData, NotificationType } from '../types/notification'

/**
 * Queues a single notification to be sent to a user.
 * Saves the notification to the database and adds a job to BullMQ.
 * 
 * @param data The notification data including target user, type, and optional parameters.
 * @returns The ID of the created notification record.
 */
export async function queueNotification(data: NotificationJobData): Promise<string> {
  // 1. Save record to Notification table in DB
  const notification = await prisma.notification.create({
    data: {
      targetUserId: data.targetUserId,
      type: data.type,
      params: data.params || {},
    },
  })

  // 2. Add job to BullMQ queue
  await notificationsQueue.add(`notification-${data.type}`, data, {
    jobId: notification.id, // Use DB ID as Job ID for traceability
  })

  // 3. Log the action (Never log params content for privacy)
  logger.info({
    msg: 'Notification queued',
    notificationId: notification.id,
    type: data.type,
    targetUserId: String(data.targetUserId),
  })

  return notification.id
}

/**
 * Queues multiple notifications in bulk for better efficiency.
 * Saves all records to the database and adds them to the BullMQ queue in one batch.
 * 
 * @param items Array of notification data objects.
 * @returns Array of IDs for the created notification records.
 */
export async function queueBulkNotifications(items: NotificationJobData[]): Promise<string[]> {
  // For bulk creation with IDs, we use a transaction with multiple creates
  // or generate IDs ourselves. Here we'll use a transaction for safety.

  const notifications = await prisma.$transaction(
    items.map(item => prisma.notification.create({
      data: {
        targetUserId: item.targetUserId,
        type: item.type,
        params: item.params || {},
      },
    })),
  )

  const ids = notifications.map(n => n.id)

  // Add jobs to BullMQ in bulk
  await notificationsQueue.addBulk(
    items.map((item, index) => ({
      name: `notification-${item.type}`,
      data: item,
      opts: {
        jobId: ids[index],
      },
    })),
  )

  // Log summary
  logger.info({
    msg: 'Bulk notifications queued',
    count: items.length,
    types: [...new Set(items.map(i => i.type))],
  })

  return ids
}

/**
 * Retrieves paginated notification history for a user.
 */
export async function getNotificationHistory(
  userId: bigint,
  options?: { page?: number; limit?: number; type?: NotificationType }
) {
  const page = options?.page || 1
  const limit = options?.limit || 20
  const skip = (page - 1) * limit

  const where = {
    targetUserId: userId,
    ...(options?.type ? { type: options.type } : {}),
  }

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ])

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  }
}

/**
 * Marks a specific notification as read.
 */
export async function markAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { readAt: new Date() },
  })
}

/**
 * Gets the count of unread notifications for a user.
 */
export async function getUnreadCount(userId: bigint) {
  return prisma.notification.count({
    where: {
      targetUserId: userId,
      readAt: null,
    },
  })
}
