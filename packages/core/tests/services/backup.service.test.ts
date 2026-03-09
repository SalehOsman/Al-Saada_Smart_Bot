import fs from 'node:fs'
import fsp from 'node:fs/promises'
import { spawn } from 'node:child_process'
import crypto from 'node:crypto'
import { PassThrough } from 'node:stream'
import { Buffer } from 'node:buffer'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { backupService } from '../../src/bot/services/backup.service'
import { prisma } from '../../src/database/prisma'

vi.mock('@prisma/client', () => ({
  BackupStatus: {
    PENDING: 'PENDING',
    IN_PROGRESS: 'IN_PROGRESS',
    COMPLETED: 'COMPLETED',
    FAILED: 'FAILED',
  },
}))

const BackupStatus = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
}

vi.mock('node:fs')
vi.mock('node:fs/promises')
vi.mock('node:child_process', () => ({
  exec: vi.fn(),
  spawn: vi.fn(),
}))

vi.mock('node:crypto', async () => {
  const { Buffer } = await import('node:buffer')
  const m = {
    createCipheriv: vi.fn(),
    createDecipheriv: vi.fn(),
    randomBytes: vi.fn().mockReturnValue(Buffer.alloc(16)),
  }
  return {
    ...m,
    default: m,
  }
})

// Mock prisma
vi.mock('../../src/database/prisma', () => ({
  prisma: {
    backupMetadata: {
      create: vi.fn(),
      update: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

// Mock env
vi.mock('../../src/config/env', () => ({
  env: {
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    BACKUP_ENCRYPTION_KEY: 'test-key-32-chars-long-123456789012', // 32 bytes
    BACKUP_DIR: '/tmp/backups',
    BACKUP_RETENTION_DAYS: 30,
    LOG_LEVEL: 'info',
    BOT_TOKEN: 'test-token',
  },
}))

describe('backupService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(fsp.mkdir).mockResolvedValue(undefined)
    vi.mocked(fs.createWriteStream).mockReturnValue(new PassThrough() as any)
  })

  describe('createBackup', () => {
    it('should create an encrypted backup and save metadata', async () => {
      const mockBackup = {
        id: 'test-id',
        fileName: 'backup-20260308.sql.gz.enc',
        filePath: '/tmp/backups/backup-20260308.sql.gz.enc',
      }

      vi.mocked(prisma.backupMetadata.create).mockResolvedValue(mockBackup as any)
      vi.mocked(prisma.backupMetadata.update).mockResolvedValue(mockBackup as any)
      vi.mocked(fsp.stat).mockResolvedValue({ size: 1024 } as any)
      vi.mocked(fsp.appendFile).mockResolvedValue(undefined)

      // Mock cipher
      const mockCipher = new PassThrough() as any
      mockCipher.getAuthTag = vi.fn().mockReturnValue(Buffer.from('tag'))
      vi.mocked(crypto.createCipheriv).mockReturnValue(mockCipher)

      // Mock spawn
      const mockStdout = new PassThrough()
      vi.mocked(spawn).mockReturnValue({
        stdout: mockStdout,
        stderr: new PassThrough(),
        on: vi.fn((event, cb) => {
          if (event === 'close')
            setTimeout(() => cb(0), 10)
        }),
      } as any)

      // Need to push data to streams to satisfy pipeline
      setTimeout(() => {
        mockStdout.push(Buffer.from('data'))
        mockStdout.push(null)
      }, 0)

      const result = await backupService.createBackup('manual', 'admin-id')

      expect(prisma.backupMetadata.create).toHaveBeenCalled()
      expect(spawn).toHaveBeenCalledWith('pg_dump', [expect.any(String)])
      expect(prisma.backupMetadata.update).toHaveBeenCalledWith({
        where: { id: 'test-id' },
        data: expect.objectContaining({
          status: BackupStatus.COMPLETED,
        }),
      })

      expect(result.id).toBe('test-id')
    })

    it('should handle backup failures', async () => {
      vi.mocked(prisma.backupMetadata.create).mockResolvedValue({ id: 'fail-id' } as any)
      vi.mocked(spawn).mockImplementation(() => {
        const mockStdout = new PassThrough()
        setTimeout(() => {
          mockStdout.emit('error', new Error('spawn failed'))
        }, 0)

        return {
          stdout: mockStdout,
          stderr: new PassThrough(),
          on: vi.fn(),
        } as any
      })

      await expect(backupService.createBackup('manual', 'admin-id')).rejects.toThrow()

      expect(prisma.backupMetadata.update).toHaveBeenCalledWith({
        where: { id: 'fail-id' },
        data: expect.objectContaining({
          status: BackupStatus.FAILED,
          errorMessage: expect.any(String),
        }),
      })
    })
  })

  describe('listBackups', () => {
    it('should return all backups from database', async () => {
      const mockBackups = [{ id: '1' }, { id: '2' }]
      vi.mocked(prisma.backupMetadata.findMany).mockResolvedValue(mockBackups as any)

      const result = await backupService.listBackups()

      expect(result).toEqual(mockBackups)
      expect(prisma.backupMetadata.findMany).toHaveBeenCalledWith({
        orderBy: { startedAt: 'desc' },
        take: 50,
      })
    })
  })

  describe('deleteBackup', () => {
    it('should delete the file and metadata', async () => {
      vi.mocked(prisma.backupMetadata.findUnique).mockResolvedValue({
        id: 'del-id',
        filePath: '/tmp/backups/old.enc',
      } as any)

      await backupService.deleteBackup('del-id')

      expect(fsp.unlink).toHaveBeenCalledWith('/tmp/backups/old.enc')
      expect(prisma.backupMetadata.delete).toHaveBeenCalledWith({
        where: { id: 'del-id' },
      })
    })
  })
})
