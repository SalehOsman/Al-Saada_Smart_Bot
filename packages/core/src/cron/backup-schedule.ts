/**
 * @file backup-schedule.ts
 * @module cron/backup-schedule
 *
 * Automated database backup scheduler.
 * Runs periodic backups of the Prisma database and handles old backup cleanup.
 */

import cron from 'node-cron'
import { backupService } from '../bot/services/backup.service'
import { env } from '../config/env'
import logger from '../utils/logger'

/**
 * Starts the automated daily database backup schedule.
 * The schedule is configurable via the `BACKUP_SCHEDULE` environment variable.
 * Defaults to daily at 2:00 AM.
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
