import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ErrorAlertService } from '../../src/bot/monitoring/error-alert.service'
import { prisma } from '../../src/database/prisma'
import { bot } from '../../src/bot/index'
import { Role } from '@prisma/client'

vi.mock('../../src/database/prisma', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('../../src/bot/index', () => ({
  bot: {
    api: {
      sendMessage: vi.fn(),
    },
  },
}))

vi.mock('../../src/config/env', () => ({
  env: {
    NODE_ENV: 'test',
    LOG_LEVEL: 'info',
  }
}))

describe('ErrorAlertService', () => {
  let errorAlertService: ErrorAlertService

  beforeEach(() => {
    vi.clearAllMocks()
    errorAlertService = new ErrorAlertService()
    errorAlertService.setBotApi(bot.api as any)
  })

  it('should send alert to all SUPER_ADMINs', async () => {
    const mockAdmins = [
      { telegramId: 123n, language: 'ar' },
      { telegramId: 456n, language: 'en' },
    ]
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockAdmins as any)

    const error = new Error('Critical test error')
    await errorAlertService.sendAlert(error, 'TestLocation')

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { role: Role.SUPER_ADMIN, isActive: true },
    }))
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(2)
    expect(bot.api.sendMessage).toHaveBeenCalledWith('123', expect.stringContaining('Critical test error'), expect.any(Object))
    expect(bot.api.sendMessage).toHaveBeenCalledWith('456', expect.stringContaining('Critical test error'), expect.any(Object))
  })

  it('should throttle repeated alerts for the same error', async () => {
    const mockAdmins = [{ telegramId: 123n, language: 'ar' }]
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockAdmins as any)

    const error = new Error('Repeated error')
    
    // First call
    await errorAlertService.sendAlert(error)
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(1)

    // Second call immediately after
    await errorAlertService.sendAlert(error)
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(1) // Should still be 1 due to throttling
  })

  it('should send alert again after throttle period', async () => {
    vi.useFakeTimers()
    const mockAdmins = [{ telegramId: 123n, language: 'ar' }]
    vi.mocked(prisma.user.findMany).mockResolvedValue(mockAdmins as any)

    const error = new Error('Delayed error')
    
    await errorAlertService.sendAlert(error)
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(1)

    // Advance time by 6 minutes (throttle is usually 5m)
    vi.advanceTimersByTime(6 * 60 * 1000)
    
    await errorAlertService.sendAlert(error)
    expect(bot.api.sendMessage).toHaveBeenCalledTimes(2)
    
    vi.useRealTimers()
  })
})
