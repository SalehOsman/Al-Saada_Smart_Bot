import { notificationsQueue } from './queue'
import { prisma } from '../database/prisma'
import { NotificationType, NotificationJobData } from '../types/notification'
import logger from '../utils/logger'

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
    items.map((item) => prisma.notification.create({
      data: {
        targetUserId: item.targetUserId,
        type: item.type,
        params: item.params || {},
      },
    }))
  )

  const ids = notifications.map((n) => n.id)

  // Add jobs to BullMQ in bulk
  await notificationsQueue.addBulk(
    items.map((item, index) => ({
      name: `notification-${item.type}`,
      data: item,
      opts: {
        jobId: ids[index],
      },
    }))
  )

  // Log summary
  logger.info({
    msg: 'Bulk notifications queued',
    count: items.length,
    types: [...new Set(items.map((i) => i.type))],
  })

  return ids
}
