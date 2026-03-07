import { Queue } from 'bullmq'
import logger from '../utils/logger'
import { bullmqRedis } from '../cache/redis'

/**
 * BullMQ Queue for notifications.
 * Uses the Redis connection singleton for performance and reliability.
 */
export const notificationsQueue = new Queue('notifications', {
  connection: bullmqRedis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
})

// Listen to queue events for logging
notificationsQueue.on('error', (error) => {
  logger.error('Notifications queue error:', error)
})

/**
 * Gracefully shuts down the queue and its underlying Redis connection.
 * Used during application shutdown to prevent data loss or dangling connections.
 */
export async function closeQueue(): Promise<void> {
  try {
    await notificationsQueue.close()
    logger.info('Notifications queue closed successfully')
  }
  catch (error) {
    logger.error('Error closing notifications queue:', error)
  }
}
