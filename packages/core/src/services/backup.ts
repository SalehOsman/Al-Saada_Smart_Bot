import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { AuditAction } from '@prisma/client'
import { env } from '../config/env'
import logger from '../utils/logger'
import { auditService } from './audit-logs'

const execPromise = promisify(exec)
const BACKUP_DIR = env.NODE_ENV === 'production'
  ? '/app/backups'
  : path.join(process.cwd(), 'backups')

/**
 * Service for database backups and restores.
 * Implements FR-036.
 */
export const backupService = {
  /**
   * Initialize the backup directory.
   */
  async init(): Promise<void> {
    try {
      await fs.mkdir(BACKUP_DIR, { recursive: true })
    }
    catch (error) {
      logger.error({ err: error }, 'Failed to create backup directory')
    }
  },

  /**
   * Create a new database backup.
   */
  async createBackup(userId: bigint): Promise<{ filename: string, size: string }> {
    await this.init()
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `backup-${timestamp}.sql`
    const filepath = path.join(BACKUP_DIR, filename)

    // Parse DATABASE_URL for pg_dump (simplified)
    // In a real environment, we'd need to handle different URL formats carefully
    try {
      // For Docker environments, postgresql-client must be installed
      await execPromise(`pg_dump "${env.DATABASE_URL}" -f "${filepath}"`)

      const stats = await fs.stat(filepath)
      const size = `${(stats.size / (1024 * 1024)).toFixed(2)} MB`

      await auditService.log({
        userId,
        action: AuditAction.BACKUP_TRIGGER,
        targetType: 'DATABASE',
        details: { filename, size },
      })

      return { filename, size }
    }
    catch (error) {
      logger.error({ err: error }, 'Backup creation failed')
      throw new Error('Backup creation failed')
    }
  },

  /**
   * Get backup history.
   */
  async getBackupHistory(): Promise<Array<{ filename: string, size: string, createdAt: Date }>> {
    await this.init()
    const files = await fs.readdir(BACKUP_DIR)
    const history = await Promise.all(
      files
        .filter(f => f.startsWith('backup-') && f.endsWith('.sql'))
        .map(async (f) => {
          const stats = await fs.stat(path.join(BACKUP_DIR, f))
          return {
            filename: f,
            size: `${(stats.size / (1024 * 1024)).toFixed(2)} MB`,
            createdAt: stats.birthtime,
          }
        }),
    )
    return history.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  },

  /**
   * Restore from a backup.
   */
  async restoreFromBackup(filename: string, userId: bigint): Promise<void> {
    const filepath = path.join(BACKUP_DIR, filename)

    try {
      // In a real environment, we'd need to kill other connections first
      await execPromise(`psql "${env.DATABASE_URL}" -f "${filepath}"`)

      await auditService.log({
        userId,
        action: AuditAction.BACKUP_RESTORE,
        targetType: 'DATABASE',
        details: { filename },
      })

      logger.info(`Database restored from ${filename} by user ${userId}`)
    }
    catch (error) {
      logger.error({ err: error }, 'Backup restore failed')
      throw new Error('Backup restore failed')
    }
  },
}
