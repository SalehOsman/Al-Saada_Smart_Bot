/**
 * @file notification.ts
 * @module workers/notification
 *
 * Background worker for bulk notification delivery.
 * Uses BullMQ to manage asynchronous delivery and ensure reliability.
 */

import type { Job } from 'bullmq'
import { Worker } from 'bullmq'
import logger from '../utils/logger'
import { bot } from '../bot/index'
import { i18n } from '../bot/i18n'
import { bullmqRedis } from '../cache/redis'
import type { NotificationJobData } from '../types/notification'

/**
 * Worker instance for processing and delivering notifications via Telegram.
 * Implements rate limiting to comply with Telegram API flood control (FR-024).
 * Jobs are triggered by services queuing data to the 'notifications' queue.
 */
export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    const { targetUserId, params = {} } = job.data

    try {
      const messageKey = formatNotificationMessage(job.data)
      const message = i18n.t('ar', messageKey, params)

      // Send message via Telegram Bot API
      await bot.api.sendMessage(String(targetUserId), message)

      logger.debug({
        msg: 'Notification delivered',
        jobId: job.id,
        targetUserId: String(targetUserId),
        type: job.data.type,
      })
    }
    catch (error: any) {
      logger.error({
        msg: 'Failed to deliver notification',
        jobId: job.id,
        targetUserId: String(targetUserId),
        error: error.message,
      })

      // BullMQ handles retries based on queue configuration
      throw error
    }
  },
  {
    connection: bullmqRedis,
    // FR-024: Max 30 messages per 1000ms
    limiter: {
      max: 30,
      duration: 1000,
    },
  },
)

/**
 * Maps notification types to i18n keys.
 */
function formatNotificationMessage(data: NotificationJobData): string {
  const { type } = data

  switch (type) {
    case 'JOIN_REQUEST_NEW':
      return 'notifications.join_request_new'
    case 'JOIN_REQUEST_APPROVED':
      return 'notifications.join_request_approved'
    case 'JOIN_REQUEST_REJECTED':
      return 'notifications.join_request_rejected'
    case 'USER_DEACTIVATED':
      return 'notifications.user_deactivated'
    case 'MAINTENANCE_ON':
      return 'notifications.maintenance_on'
    case 'MAINTENANCE_OFF':
      return 'notifications.maintenance_off'
    default:
      return 'notification-generic'
  }
}

// Listen to worker events
notificationWorker.on('completed', (job) => {
  logger.debug(`Job ${job.id} completed successfully`)
})

notificationWorker.on('failed', (job, err) => {
  logger.error(`Job ${job?.id} failed with error: ${err.message}`)
})

/**
 * Gracefully shuts down the notification worker.
 */
export async function closeWorker(): Promise<void> {
  try {
    await notificationWorker.close()
    logger.info('Notification worker closed successfully')
  }
  catch (error) {
    logger.error('Error closing notification worker:', error)
  }
}
