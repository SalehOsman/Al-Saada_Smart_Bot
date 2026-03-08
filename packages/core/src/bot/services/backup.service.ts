import { exec } from 'node:child_process'
import { createGzip } from 'node:zlib'
import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { pipeline } from 'node:stream/promises'
import fs from 'node:fs'
import fsp from 'node:fs/promises'
import path from 'node:path'
import { promisify } from 'node:util'
import { BackupStatus } from '@prisma/client'
import { prisma } from '../../database/prisma'
import { env } from '../../config/env'
import logger from '../../utils/logger'

const execPromise = promisify(exec)

export class BackupService {
  private readonly backupDir: string
  private readonly encryptionKey: Buffer

  constructor() {
    this.backupDir = env.BACKUP_DIR || path.join(process.cwd(), 'backups')
    // Key must be exactly 32 bytes for AES-256
    const key = env.BACKUP_ENCRYPTION_KEY || 'default-secret-key-must-be-32-bytes'
    this.encryptionKey = Buffer.alloc(32, key).slice(0, 32)
  }

  async init() {
    await fsp.mkdir(this.backupDir, { recursive: true })
  }

  /**
   * Create a new database backup.
   */
  async createBackup(trigger: 'manual' | 'scheduled' = 'manual', createdBy: string = 'SYSTEM') {
    await this.init()

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const fileName = `backup-${timestamp}.sql.gz.enc`
    const filePath = path.join(this.backupDir, fileName)

    const metadata = await prisma.backupMetadata.create({
      data: {
        fileName,
        filePath,
        fileSize: 0n,
        status: BackupStatus.PENDING,
        createdBy,
        startedAt: new Date(),
      },
    })

    try {
      await prisma.backupMetadata.update({
        where: { id: metadata.id },
        data: { status: BackupStatus.IN_PROGRESS },
      })

      // We'll use a temporary file for the raw dump + gzip, or just pipe it
      // For AES-256-GCM, we need to handle the AuthTag. 
      // Prepending IV (16 bytes) and AuthTag (16 bytes) to the file.
      
      const iv = randomBytes(16)
      const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv)

      // pg_dump directly to stdout, then pipe to gzip, then to cipher, then to file
      // Note: We need to write IV first
      const fileStream = fs.createWriteStream(filePath)
      fileStream.write(iv)

      // We use exec for pg_dump because it handles DATABASE_URL well
      // but we need to pipe its output. 
      // Better: use spawn for streaming
      const { spawn } = await import('node:child_process')
      const pgDump = spawn('pg_dump', [env.DATABASE_URL])
      const gzip = createGzip()

      await pipeline(
        pgDump.stdout,
        gzip,
        cipher,
        fileStream
      )

      // Get AuthTag and append it or write it at specific offset
      // Easier: Write IV (16) + AuthTag (16) + EncryptedData
      const authTag = cipher.getAuthTag()
      
      // We need to write the auth tag somewhere. Let's prepend it with IV.
      // Current file: [IV][EncryptedData]
      // We want: [IV][AuthTag][EncryptedData]
      // To do this simply with streams, we can't easily prepend AuthTag after encryption.
      // Alternative: [IV][EncryptedData][AuthTag]
      await fsp.appendFile(filePath, authTag)

      const stats = await fsp.stat(filePath)
      
      await prisma.backupMetadata.update({
        where: { id: metadata.id },
        data: {
          status: BackupStatus.COMPLETED,
          completedAt: new Date(),
          fileSize: BigInt(stats.size),
        },
      })

      logger.info({ backupId: metadata.id, fileName }, 'Backup completed successfully')
      return metadata
    }
    catch (error: any) {
      logger.error({ err: error, backupId: metadata.id }, 'Backup failed')
      await prisma.backupMetadata.update({
        where: { id: metadata.id },
        data: {
          status: BackupStatus.FAILED,
          errorMessage: error.message,
          completedAt: new Date(),
        },
      })
      throw error
    }
  }

  /**
   * Restore database from a backup file.
   */
  async restoreBackup(backupId: string, userId: string) {
    const metadata = await prisma.backupMetadata.findUnique({
      where: { id: backupId },
    })

    if (!metadata) throw new Error('Backup not found')
    if (metadata.status !== BackupStatus.COMPLETED) throw new Error('Backup is not in COMPLETED status')

    try {
      // 1. Decrypt and Decompress
      const fileBuffer = await fsp.readFile(metadata.filePath)
      const iv = fileBuffer.slice(0, 16)
      const authTag = fileBuffer.slice(fileBuffer.length - 16)
      const encryptedData = fileBuffer.slice(16, fileBuffer.length - 16)

      const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv)
      decipher.setAuthTag(authTag)

      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final(),
      ])

      // 2. Decompress
      const { gunzipSync } = await import('node:zlib')
      const sql = gunzipSync(decrypted)

      // 3. Apply SQL via psql
      // We'll write to a temp file first to avoid passing large strings to exec
      const tempSqlPath = path.join(this.backupDir, `temp-restore-${Date.now()}.sql`)
      await fsp.writeFile(tempSqlPath, sql)

      try {
        await execPromise(`psql "${env.DATABASE_URL}" -f "${tempSqlPath}"`)
      }
      finally {
        await fsp.unlink(tempSqlPath)
      }

      logger.info({ backupId, userId }, 'Database restored successfully')
    }
    catch (error: any) {
      logger.error({ err: error, backupId }, 'Restore failed')
      throw error
    }
  }

  async listBackups() {
    return prisma.backupMetadata.findMany({
      orderBy: { startedAt: 'desc' },
      take: 50,
    })
  }

  async getBackup(id: string) {
    return prisma.backupMetadata.findUnique({
      where: { id },
    })
  }

  async deleteBackup(id: string) {
    const metadata = await prisma.backupMetadata.findUnique({
      where: { id },
    })

    if (metadata) {
      try {
        await fsp.unlink(metadata.filePath)
      }
      catch (e) {
        logger.warn({ err: e, filePath: metadata.filePath }, 'Could not delete backup file')
      }
      await prisma.backupMetadata.delete({ where: { id } })
    }
  }

  /**
   * Clean up old backups based on retention policy.
   */
  async cleanupOldBackups() {
    const retentionDays = env.BACKUP_RETENTION_DAYS || 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const oldBackups = await prisma.backupMetadata.findMany({
      where: {
        startedAt: { lt: cutoffDate },
      },
    })

    for (const backup of oldBackups) {
      await this.deleteBackup(backup.id)
    }

    if (oldBackups.length > 0) {
      logger.info({ count: oldBackups.length }, 'Cleaned up old backups')
    }
  }
}

export const backupService = new BackupService()
