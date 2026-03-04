import { describe, it, expect, vi, beforeEach } from 'vitest'
import fs from 'node:fs/promises'
import { exec } from 'node:child_process'
import { backupService } from '../src/services/backup'
import { auditService } from '../src/services/audit-logs'
import { AuditAction } from '@prisma/client'

// Mock dependencies
vi.mock('node:fs/promises')
vi.mock('node:child_process', () => ({
  exec: vi.fn((cmd, cb) => cb(null, { stdout: '', stderr: '' }))
}))
vi.mock('../src/services/audit-logs', () => ({
  auditService: {
    log: vi.fn().mockResolvedValue({})
  }
}))
vi.mock('../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    DATABASE_URL: 'postgresql://user:pass@localhost:5432/db',
    LOG_LEVEL: 'info'
  }
}))

describe('backupService', () => {
  const userId = 123456789n

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('init() should create the backup directory', async () => {
    await backupService.init()
    expect(fs.mkdir).toHaveBeenCalledWith(expect.stringContaining('backups'), { recursive: true })
  })

  it('createBackup() should execute pg_dump and log audit action', async () => {
    vi.mocked(fs.stat).mockResolvedValue({ size: 1024 * 1024 } as any)
    
    const result = await backupService.createBackup(userId)
    
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('pg_dump "postgresql://user:pass@localhost:5432/db"'),
      expect.any(Function)
    )
    expect(auditService.log).toHaveBeenCalledWith({
      userId,
      action: AuditAction.BACKUP_TRIGGER,
      targetType: 'DATABASE',
      details: expect.objectContaining({ filename: expect.stringContaining('.sql'), size: '1.00 MB' })
    })
    expect(result.size).toBe('1.00 MB')
    expect(result.filename).toContain('.sql')
  })

  it('getBackupHistory() should return sorted list of backup files', async () => {
    vi.mocked(fs.readdir).mockResolvedValue(['backup-1.sql', 'backup-2.sql', 'not-a-backup.txt'] as any)
    vi.mocked(fs.stat).mockImplementation(async (path: any) => {
      if (path.toString().includes('backup-1.sql')) {
        return { size: 1024, birthtime: new Date('2026-01-01') } as any
      }
      return { size: 2048, birthtime: new Date('2026-01-02') } as any
    })

    const history = await backupService.getBackupHistory()
    
    expect(history).toHaveLength(2)
    expect(history[0].filename).toBe('backup-2.sql') // Newest first
    expect(history[1].filename).toBe('backup-1.sql')
  })

  it('restoreFromBackup() should execute psql and log audit action', async () => {
    const filename = 'backup-test.sql'
    
    await backupService.restoreFromBackup(filename, userId)
    
    expect(exec).toHaveBeenCalledWith(
      expect.stringContaining('psql "postgresql://user:pass@localhost:5432/db"'),
      expect.any(Function)
    )
    expect(auditService.log).toHaveBeenCalledWith({
      userId,
      action: AuditAction.BACKUP_RESTORE,
      targetType: 'DATABASE',
      details: { filename }
    })
  })

  it('should throw error if backup execution fails', async () => {
    vi.mocked(exec).mockImplementation((cmd: any, cb: any) => {
      cb(new Error('pg_dump failed'))
      return {} as any
    })

    await expect(backupService.createBackup(userId)).rejects.toThrow('Backup creation failed')
  })

  it('should throw error if restore execution fails', async () => {
    vi.mocked(exec).mockImplementation((cmd: any, cb: any) => {
      cb(new Error('psql failed'))
      return {} as any
    })

    await expect(backupService.restoreFromBackup('test.sql', userId)).rejects.toThrow('Backup restore failed')
  })
})
