import cron from 'node-cron'
import { backupService } from '../bot/services/backup.service'
import { env } from '../config/env'
import logger from '../utils/logger'

/**
 * Start automated daily database backups.
 * Schedule is configurable via BACKUP_SCHEDULE env var, defaults to daily at 2 AM.
 */
export function startBackupSchedule() {
  const schedule = env.BACKUP_SCHEDULE || '0 2 * * *'

  cron.schedule(schedule, async () => {
    logger.info('Starting scheduled database backup...')
    try {
      await backupService.createBackup('scheduled', 'SYSTEM')
      // Also cleanup old backups
      await backupService.cleanupOldBackups()
    }
    catch (error) {
      logger.error({ err: error }, 'Scheduled backup failed')
    }
  })

  logger.info({ schedule }, 'Automated backup schedule initialized')
}
