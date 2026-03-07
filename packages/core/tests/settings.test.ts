import { beforeEach, describe, expect, it, vi } from 'vitest'
import { settingsService } from '../src/services/settings'
import { settingsActionsHandler, settingsHandler } from '../src/bot/handlers/settings'
import { redis } from '../src/cache/redis'
import { prisma } from '../src/database/prisma'

// Mock dependencies
vi.mock('../src/cache/redis', () => ({
  redis: {
    get: vi.fn(),
    set: vi.fn(),
    smembers: vi.fn(),
    sismember: vi.fn(),
    sadd: vi.fn(),
    srem: vi.fn(),
    del: vi.fn(),
    ping: vi.fn(),
  },
}))

vi.mock('../src/database/prisma', () => ({
  prisma: {
    $queryRaw: vi.fn(),
  },
}))

vi.mock('../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('settings service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('default language', () => {
    it('should get default language (default to ar)', async () => {
      vi.mocked(redis.get).mockResolvedValue(null)
      const lang = await settingsService.getDefaultLanguage()
      expect(lang).toBe('ar')
    })

    it('should set default language', async () => {
      await settingsService.setDefaultLanguage('en')
      expect(redis.set).toHaveBeenCalledWith('system:defaultLanguage', 'en')
    })
  })

  describe('notification types', () => {
    it('should get active notification types with defaults when empty', async () => {
      vi.mocked(redis.smembers).mockResolvedValue([])

      const types = await settingsService.getActiveNotificationTypes()
      expect(types).toContain('JOIN_REQUEST_NEW')
      expect(types).toContain('JOIN_REQUEST_APPROVED')
      expect(types).toContain('JOIN_REQUEST_REJECTED')
      expect(types).toContain('USER_DEACTIVATED')
      expect(types).toContain('MAINTENANCE_ON')
      expect(types).toContain('MAINTENANCE_OFF')
    })

    it('should get active notification types from redis', async () => {
      vi.mocked(redis.smembers).mockResolvedValue(['JOIN_REQUEST_NEW', 'USER_DEACTIVATED'])

      const types = await settingsService.getActiveNotificationTypes()
      expect(types).toEqual(['JOIN_REQUEST_NEW', 'USER_DEACTIVATED'])
    })

    it('should toggle notification type from inactive to active', async () => {
      vi.mocked(redis.sismember).mockResolvedValue(0)
      vi.mocked(redis.sadd).mockResolvedValue(1)

      const isActive = await settingsService.toggleNotificationType('JOIN_REQUEST_NEW')
      expect(isActive).toBe(true)
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_NEW')
    })

    it('should toggle notification type from active to inactive', async () => {
      vi.mocked(redis.sismember).mockResolvedValue(1)
      vi.mocked(redis.srem).mockResolvedValue(1)

      const isActive = await settingsService.toggleNotificationType('USER_DEACTIVATED')
      expect(isActive).toBe(false)
      expect(redis.srem).toHaveBeenCalledWith('system:activeNotificationTypes', 'USER_DEACTIVATED')
    })
  })

  describe('system info', () => {
    it('should get system info with all services up', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([1])
      vi.mocked(redis.ping).mockResolvedValue('PONG')

      const info = await settingsService.getSystemInfo()
      expect(info.dbStatus).toBe('UP')
      expect(info.redisStatus).toBe('UP')
      expect(info.env).toBeDefined()
      expect(info.version).toBe('0.1.0')
      expect(info.uptime).toBeDefined()
    })

    it('should get system info with db down', async () => {
      vi.mocked(prisma.$queryRaw).mockRejectedValue(new Error('Connection failed'))
      vi.mocked(redis.ping).mockResolvedValue('PONG')

      const info = await settingsService.getSystemInfo()
      expect(info.dbStatus).toBe('DOWN')
      expect(info.redisStatus).toBe('UP')
    })

    it('should get system info with redis down', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([1])
      vi.mocked(redis.ping).mockRejectedValue(new Error('Connection failed'))

      const info = await settingsService.getSystemInfo()
      expect(info.dbStatus).toBe('UP')
      expect(info.redisStatus).toBe('DOWN')
    })
  })
})

describe('settings handler', () => {
  const createMockCtx = () => ({
    session: { role: 'SUPER_ADMIN' },
    t: vi.fn((key: string) => key), // Return the key as-is for testing
    reply: vi.fn(),
    editMessageText: vi.fn(),
    answerCallbackQuery: vi.fn(),
    from: { id: 123456789 },
  } as any)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('main menu', () => {
    it('should show settings menu for Super Admin', async () => {
      const mockCtx = createMockCtx()
      // No callbackQuery means reply should be used
      await settingsHandler(mockCtx)
      expect(mockCtx.reply).toHaveBeenCalledWith('settings-menu-welcome', expect.any(Object))
    })

    it('should deny access for non-Super Admin', async () => {
      const mockCtx = createMockCtx()
      mockCtx.session.role = 'EMPLOYEE'
      await settingsHandler(mockCtx)
      expect(mockCtx.reply).toHaveBeenCalledWith('errors-unauthorized')
    })

    it('should deny access for ADMIN', async () => {
      const mockCtx = createMockCtx()
      mockCtx.session.role = 'ADMIN'
      await settingsHandler(mockCtx)
      expect(mockCtx.reply).toHaveBeenCalledWith('errors-unauthorized')
    })
  })

  describe('notifications menu', () => {
    it('should show notifications menu with statistics', async () => {
      vi.mocked(redis.smembers).mockResolvedValue([
        'JOIN_REQUEST_NEW',
        'JOIN_REQUEST_APPROVED',
        'USER_DEACTIVATED',
      ])

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notifications' } })
      await settingsActionsHandler(mockCtx)

      expect(mockCtx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('settings-notifications-title'),
        expect.objectContaining({
          reply_markup: expect.any(Object),
          parse_mode: 'HTML',
        }),
      )
    })

    it('should show notification summary with correct counts', async () => {
      vi.mocked(redis.smembers).mockResolvedValue([
        'JOIN_REQUEST_NEW',
        'JOIN_REQUEST_APPROVED',
      ])

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notifications' } })
      await settingsActionsHandler(mockCtx)

      const callArgs = vi.mocked(mockCtx.editMessageText).mock.calls[0]
      const message = callArgs[0] as string
      expect(message).toContain('notif-summary-total: 6')
      expect(message).toContain('notif-summary-active: 2')
      expect(message).toContain('notif-summary-inactive: 4')
      expect(message).toContain('notif-summary-percentage: 33%')
    })

    it('should include individual toggle buttons for each notification type', async () => {
      vi.mocked(redis.smembers).mockResolvedValue([
        'JOIN_REQUEST_NEW',
        'JOIN_REQUEST_APPROVED',
      ])

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notifications' } })
      await settingsActionsHandler(mockCtx)

      const callArgs = vi.mocked(mockCtx.editMessageText).mock.calls[0]
      const keyboard = callArgs[1].reply_markup

      expect(keyboard).toBeDefined()
      expect(JSON.stringify(keyboard)).toContain('settings:notif:toggle:join-request-new')
      expect(JSON.stringify(keyboard)).toContain('settings:notif:toggle:join-request-approved')
      expect(JSON.stringify(keyboard)).toContain('settings:notif:toggle:join-request-rejected')
      expect(JSON.stringify(keyboard)).toContain('settings:notif:toggle:user-deactivated')
      expect(JSON.stringify(keyboard)).toContain('settings:notif:toggle:maintenance-on')
      expect(JSON.stringify(keyboard)).toContain('settings:notif:toggle:maintenance-off')
    })
  })

  describe('notification actions', () => {
    beforeEach(() => {
      vi.clearAllMocks()
    })

    it('should enable all notifications', async () => {
      vi.mocked(redis.sadd).mockResolvedValue(1)

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notif:enable:all' } })
      await settingsActionsHandler(mockCtx)

      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_NEW')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_APPROVED')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_REJECTED')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'USER_DEACTIVATED')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'MAINTENANCE_ON')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'MAINTENANCE_OFF')
      expect(mockCtx.answerCallbackQuery).toHaveBeenCalledWith({
        text: 'notif-toggle-all',
        show_alert: true,
      })
    })

    it('should disable all notifications', async () => {
      vi.mocked(redis.srem).mockResolvedValue(1)

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notif:disable:all' } })
      await settingsActionsHandler(mockCtx)

      expect(redis.srem).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_NEW')
      expect(redis.srem).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_APPROVED')
      expect(redis.srem).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_REJECTED')
      expect(redis.srem).toHaveBeenCalledWith('system:activeNotificationTypes', 'USER_DEACTIVATED')
      expect(redis.srem).toHaveBeenCalledWith('system:activeNotificationTypes', 'MAINTENANCE_ON')
      expect(redis.srem).toHaveBeenCalledWith('system:activeNotificationTypes', 'MAINTENANCE_OFF')
      expect(mockCtx.answerCallbackQuery).toHaveBeenCalledWith({
        text: 'notif-disable-all',
        show_alert: true,
      })
    })

    it('should reset to default notification types', async () => {
      vi.mocked(redis.del).mockResolvedValue(1)
      vi.mocked(redis.sadd).mockResolvedValue(1)

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notif:reset:defaults' } })
      await settingsActionsHandler(mockCtx)

      expect(redis.del).toHaveBeenCalledWith('system:activeNotificationTypes')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_NEW')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_APPROVED')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_REJECTED')
      expect(redis.sadd).toHaveBeenCalledWith('system:activeNotificationTypes', 'USER_DEACTIVATED')

      // Maintenance notifications should NOT be added by default
      expect(redis.sadd).not.toHaveBeenCalledWith('system:activeNotificationTypes', 'MAINTENANCE_ON')
      expect(redis.sadd).not.toHaveBeenCalledWith('system:activeNotificationTypes', 'MAINTENANCE_OFF')
    })

    it('should toggle individual notification from inactive to active', async () => {
      vi.mocked(redis.sismember).mockResolvedValue(0)
      vi.mocked(redis.sadd).mockResolvedValue(1)
      vi.mocked(redis.srem).mockResolvedValue(1)
      vi.mocked(redis.smembers).mockResolvedValue(['JOIN_REQUEST_NEW'])

      // Mock the toggleNotificationType to return true
      const originalToggle = settingsService.toggleNotificationType
      vi.spyOn(settingsService, 'toggleNotificationType').mockResolvedValue(true)

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notif:toggle:join-request-new' } })
      await settingsActionsHandler(mockCtx)

      expect(redis.sismember).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_NEW')
      expect(settingsService.toggleNotificationType).toHaveBeenCalledWith('JOIN_REQUEST_NEW')
      expect(mockCtx.answerCallbackQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('notif-status-toggle-enabled'),
        show_alert: false,
        cache_time: 3,
      })

      // Restore original
      if (originalToggle) {
        vi.mocked(settingsService.toggleNotificationType).mockRestore()
      }
    })

    it('should toggle individual notification from active to inactive', async () => {
      vi.mocked(redis.sismember).mockResolvedValue(1)
      vi.mocked(redis.srem).mockResolvedValue(1)
      vi.mocked(redis.smembers).mockResolvedValue([])

      // Mock the toggleNotificationType to return false
      const originalToggle = settingsService.toggleNotificationType
      vi.spyOn(settingsService, 'toggleNotificationType').mockResolvedValue(false)

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notif:toggle:join-request-approved' } })
      await settingsActionsHandler(mockCtx)

      expect(redis.sismember).toHaveBeenCalledWith('system:activeNotificationTypes', 'JOIN_REQUEST_APPROVED')
      expect(settingsService.toggleNotificationType).toHaveBeenCalledWith('JOIN_REQUEST_APPROVED')
      expect(mockCtx.answerCallbackQuery).toHaveBeenCalledWith({
        text: expect.stringContaining('notif-status-toggle-disabled'),
        show_alert: false,
        cache_time: 3,
      })

      // Restore original
      if (originalToggle) {
        vi.mocked(settingsService.toggleNotificationType).mockRestore()
      }
    })

    it('should handle kebab-case to snake-case conversion for notification types', async () => {
      vi.mocked(redis.sismember).mockResolvedValue(0)
      vi.mocked(redis.sadd).mockResolvedValue(1)
      vi.mocked(redis.smembers).mockResolvedValue(['MAINTENANCE_ON'])

      // Mock the toggleNotificationType to return true
      const originalToggle = settingsService.toggleNotificationType
      vi.spyOn(settingsService, 'toggleNotificationType').mockResolvedValue(true)

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notif:toggle:maintenance-on' } })
      await settingsActionsHandler(mockCtx)

      expect(settingsService.toggleNotificationType).toHaveBeenCalledWith('MAINTENANCE_ON')

      // Restore original
      if (originalToggle) {
        vi.mocked(settingsService.toggleNotificationType).mockRestore()
      }
    })

    it('should refresh the notifications menu after any action', async () => {
      vi.mocked(redis.srem).mockResolvedValue(1)
      vi.mocked(redis.smembers).mockResolvedValue(['JOIN_REQUEST_NEW'])

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:notif:disable:all' } })
      await settingsActionsHandler(mockCtx)

      // Menu should be refreshed
      expect(mockCtx.editMessageText).toHaveBeenCalled()
    })
  })

  describe('language settings', () => {
    it('should show language selection', async () => {
      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:language' } })
      await settingsActionsHandler(mockCtx)

      expect(mockCtx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('settings-language-title'),
        expect.objectContaining({
          reply_markup: expect.any(Object),
        }),
      )
    })

    it('should change language to Arabic', async () => {
      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:lang:ar' } })
      await settingsActionsHandler(mockCtx)

      expect(redis.set).toHaveBeenCalledWith('system:defaultLanguage', 'ar')
      expect(mockCtx.answerCallbackQuery).toHaveBeenCalledWith({
        text: 'settings-language-updated',
        show_alert: true,
      })
    })

    it('should change language to English', async () => {
      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:lang:en' } })
      await settingsActionsHandler(mockCtx)

      expect(redis.set).toHaveBeenCalledWith('system:defaultLanguage', 'en')
      expect(mockCtx.answerCallbackQuery).toHaveBeenCalledWith({
        text: 'settings-language-updated',
        show_alert: true,
      })
    })
  })

  describe('system info', () => {
    it('should show system information', async () => {
      vi.mocked(prisma.$queryRaw).mockResolvedValue([1])
      vi.mocked(redis.ping).mockResolvedValue('PONG')

      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:info' } })
      await settingsActionsHandler(mockCtx)

      expect(mockCtx.editMessageText).toHaveBeenCalledWith(
        expect.stringContaining('settings-system-info-title'),
        expect.any(Object),
      )
    })
  })

  describe('navigation', () => {
    it('should navigate back to main menu', async () => {
      const mockCtx = createMockCtx()
      Object.assign(mockCtx, { callbackQuery: { data: 'settings:main' } })
      await settingsActionsHandler(mockCtx)
      expect(mockCtx.editMessageText).toHaveBeenCalledWith('settings-menu-welcome', expect.objectContaining({
        reply_markup: expect.any(Object),
        parse_mode: 'HTML',
      }))
    })
  })
})
