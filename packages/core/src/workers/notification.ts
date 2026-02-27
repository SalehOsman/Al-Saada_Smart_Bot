import { Worker, Job } from 'bullmq'
import { env } from '../config/env'
import logger from '../utils/logger'
import { bot } from '../bot/index'
import { redis } from '../cache/redis'
import { NotificationJobData } from '../types/notification'

/**
 * Worker for processing and delivering notifications via Telegram.
 * Implements rate limiting to comply with Telegram API flood control (FR-024).
 */
export const notificationWorker = new Worker<NotificationJobData>(
  'notifications',
  async (job: Job<NotificationJobData>) => {
    const { targetUserId } = job.data

    try {
      const message = formatNotificationMessage(job.data)
      
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
      
      // If it's a Telegram flood error, we might want to rethrow to let BullMQ retry
      // but for now we follow the instruction: "do NOT crash the worker"
      throw error // BullMQ handles retries based on queue configuration
    }
  },
  {
    connection: redis,
    // FR-024: Max 30 messages per 1000ms
    limiter: {
      max: 30,
      duration: 1000,
    },
  }
)

/**
 * Maps notification types to user-friendly Arabic messages.
 * This is a simplified implementation for workers where BotContext is unavailable.
 * 
 * @param data The notification job data
 * @returns Formatted message string
 */
function formatNotificationMessage(data: NotificationJobData): string {
  const { type, params = {} } = data
  
  // Mapping based on i18n key pattern: notifications-{type}
  // For now using hardcoded Arabic strings to ensure immediate functionality
  switch (type) {
    case 'JOIN_REQUEST_NEW':
      return `📨 طلب انضمام جديد
الاسم: ${params.userName || 'غير معروف'}
رقم الطلب: #${params.requestCode || '---'}`
    
    case 'JOIN_REQUEST_APPROVED':
      return `✅ تهانينا! تمت الموافقة على طلب انضمامك.
يمكنك الآن البدء باستخدام البوت.`
    
    case 'JOIN_REQUEST_REJECTED':
      return `❌ نأسف، لم تتم الموافقة على طلب انضمامك.
للمزيد من التفاصيل يرجى التواصل مع الإدارة.`
    
    case 'USER_DEACTIVATED':
      return `🚫 تم تعطيل حسابك من قِبَل المسؤول.
يرجى التواصل مع الإدارة للاستفسار.`
    
    case 'MAINTENANCE_ON':
      return `🛠️ سيبدأ النظام في وضع الصيانة الآن.
قد تتوقف بعض الخدمات مؤقتاً.`
    
    case 'MAINTENANCE_OFF':
      return `✅ انتهت أعمال الصيانة. النظام متاح الآن للاستخدام بشكل كامل.`
    
    default:
      return `🔔 إشعار جديد: ${type}`
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
