import cron from 'node-cron'
import { prisma } from '../database/prisma'
import logger from '../utils/logger'

export function startNotificationCleanup() {
  // Runs daily at 02:00 AM Africa/Cairo timezone
  cron.schedule(
    '0 2 * * *',
    async () => {
      try {
        const ninetyDaysAgo = new Date()
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

        const result = await prisma.notification.deleteMany({
          where: {
            createdAt: {
              lt: ninetyDaysAgo,
            },
          },
        })

        logger.info({
          msg: 'Notification cleanup completed',
          deletedCount: result.count,
          timestamp: new Date().toISOString(),
        })
      }
      catch (error) {
        logger.error({ err: error }, 'Failed to run notification cleanup cron job')
      }
    },
    {
      timezone: 'Africa/Cairo',
    },
  )

  logger.info('Notification cleanup cron job registered (runs daily at 02:00 AM Africa/Cairo)')
}
