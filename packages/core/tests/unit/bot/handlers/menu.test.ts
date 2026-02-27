import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { menuHandler } from '../../../../src/bot/handlers/menu'
import type { BotContext } from '../../../../src/types/context'

// Prisma mock — factory uses vi.fn() directly (no top-level variable reference)
vi.mock('../../../../src/database/prisma', () => ({
  prisma: {
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
  },
}))
vi.mock('../../../../src/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

// Captured references after hoisting — safe to use in tests
import { prisma } from '../../../../src/database/prisma'
import logger from '../../../../src/utils/logger'
const mockPrisma = prisma as any
const mockLogger = logger as any

describe('@testing-patterns @typescript-expert Menu Handler Tests', () => {
  const mockCtx = {
    from: { id: 12345, first_name: 'Test User' },
    reply: vi.fn(),
    t: vi.fn((key: string, params?: any) => {
      const translations: Record<string, string> = {
        'user-inactive': 'User is inactive',
        'error-generic': 'An error occurred',
        'menu-super-admin': 'Welcome Super Admin {name}',
        'menu-admin': 'Welcome Admin {name}',
        'menu-employee': 'Welcome Employee {name}',
        'menu-visitor': 'Welcome Visitor {name}',
        'button-sections': 'Sections',
        'button-users': 'Users',
        'button-maintenance': 'Maintenance',
        'button-audit': 'Audit',
        'button-modules': 'Modules',
        'button-notifications': 'Notifications',
      }
      let msg = translations[key] || key
      if (params) {
        msg = msg.replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? `{${k}}`))
      }
      return msg
    }),
  } as unknown as BotContext

  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('T024 - Main Menu Router RBAC Tests', () => {
    it('should show Super Admin menu for SUPER_ADMIN role', async () => {
      const mockUser = {
        id: 'user-1',
        telegramId: 12345n,
        fullName: 'Super Admin',
        role: 'SUPER_ADMIN' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      expect(call[0]).toContain('Super Admin')
      expect(call[1]?.reply_markup?.inline_keyboard).toHaveLength(3)
      expect(call[1]?.reply_markup?.inline_keyboard[0]).toContainEqual(
        expect.objectContaining({ text: 'Sections', callback_data: 'menu-sections' })
      )
      expect(call[1]?.reply_markup?.inline_keyboard[0]).toContainEqual(
        expect.objectContaining({ text: 'Users', callback_data: 'menu-users' })
      )
    })

    it('should show Admin menu for ADMIN role with restricted options', async () => {
      const mockUser = {
        id: 'user-2',
        telegramId: 12345n,
        fullName: 'Admin User',
        role: 'ADMIN' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      expect(call[0]).toContain('Admin User')
      expect(call[1]?.reply_markup?.inline_keyboard).toHaveLength(2)
      // Admin should NOT see modules or notifications buttons
      expect(call[1]?.reply_markup?.inline_keyboard).not.toEqual(
        expect.arrayContaining([
          expect.arrayContaining([
            expect.objectContaining({ text: 'Modules', callback_data: 'menu-modules' })
          ])
        ])
      )
    })

    it('should show Employee menu for EMPLOYEE role with minimal options', async () => {
      const mockUser = {
        id: 'user-3',
        telegramId: 12345n,
        fullName: 'Employee User',
        role: 'EMPLOYEE' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      expect(call[0]).toContain('Employee User')
      expect(call[1]?.reply_markup?.inline_keyboard).toHaveLength(1)
      // Employee should only see sections button
      expect(call[1]?.reply_markup?.inline_keyboard[0]).toEqual([
        expect.objectContaining({ text: 'Sections', callback_data: 'menu-sections' })
      ])
    })

    it('should show Visitor menu for VISITOR role with basic access', async () => {
      const mockUser = {
        id: 'user-4',
        telegramId: 12345n,
        fullName: 'Visitor User',
        role: 'VISITOR' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      expect(call[0]).toContain('Visitor User')
      expect(call[1]?.reply_markup?.inline_keyboard).toHaveLength(1)
      // Visitor should only see sections button
      expect(call[1]?.reply_markup?.inline_keyboard[0]).toEqual([
        expect.objectContaining({ text: 'Sections', callback_data: 'menu-sections' })
      ])
    })

    it('should handle unknown role by falling back to VISITOR menu', async () => {
      const mockUser = {
        id: 'user-5',
        telegramId: 12345n,
        fullName: 'Unknown Role User',
        role: 'UNKNOWN_ROLE' as any,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      expect(call[0]).toContain('Unknown Role User')
      // Should fall back to visitor menu
      expect(call[1]?.reply_markup?.inline_keyboard[0]).toEqual([
        expect.objectContaining({ text: 'Sections', callback_data: 'menu-sections' })
      ])
    })

    it('should return early for invalid telegram ID (0)', async () => {
      const invalidCtx = {
        ...mockCtx,
        from: { id: 0 },
      }

      await menuHandler(invalidCtx as any)

      expect(mockCtx.reply).not.toHaveBeenCalled()
    })

    it('should show inactive user message for inactive user', async () => {
      const mockUser = {
        id: 'user-6',
        telegramId: 12345n,
        fullName: 'Inactive User',
        role: 'VISITOR' as const,
        isActive: false,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalledWith('User is inactive')
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled()
    })

    it('should log audit trail for menu access', async () => {
      const mockUser = {
        id: 'user-7',
        telegramId: 12345n,
        fullName: 'Audit Test User',
        role: 'EMPLOYEE' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          userId: 12345n,
          action: 'MENU_ACCESS',
          targetType: 'User',
          targetId: 'user-7',
          details: { role: 'EMPLOYEE' },
        },
      })
    })

    it('should handle database errors gracefully', async () => {
      mockPrisma.user.findUnique.mockRejectedValue(new Error('Database connection failed'))

      await menuHandler(mockCtx)

      expect(mockLogger.error).toHaveBeenCalledWith('Error in menu handler:', expect.any(Error))
      expect(mockCtx.reply).toHaveBeenCalledWith('An error occurred')
    })

    it('should Super Admin sees all management options', async () => {
      const mockUser = {
        id: 'user-8',
        telegramId: 12345n,
        fullName: 'Full Admin',
        role: 'SUPER_ADMIN' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      const keyboard = call[1]?.reply_markup?.inline_keyboard

      // Super Admin should see all 6 buttons across 3 rows
      expect(keyboard).toHaveLength(3)
      expect(keyboard[0]).toHaveLength(2) // Sections, Users
      expect(keyboard[1]).toHaveLength(2) // Maintenance, Audit
      expect(keyboard[2]).toHaveLength(2) // Modules, Notifications
    })

    it('should Admin cannot access Super Admin specific features', async () => {
      const mockUser = {
        id: 'user-9',
        telegramId: 12345n,
        fullName: 'Regular Admin',
        role: 'ADMIN' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      const keyboard = call[1]?.reply_markup?.inline_keyboard

      // Admin should NOT see modules and notifications (Super Admin only)
      expect(keyboard).toHaveLength(2)
      expect(keyboard[0]).toEqual([
        expect.objectContaining({ text: 'Sections', callback_data: 'menu-sections' }),
        expect.objectContaining({ text: 'Users', callback_data: 'menu-users' }),
      ])
      expect(keyboard[1]).toEqual([
        expect.objectContaining({ text: 'Maintenance', callback_data: 'menu-maintenance' }),
        expect.objectContaining({ text: 'Audit', callback_data: 'menu-audit' }),
      ])
    })

    it('should Employee only sees sections access', async () => {
      const mockUser = {
        id: 'user-10',
        telegramId: 12345n,
        fullName: 'Staff Member',
        role: 'EMPLOYEE' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      const keyboard = call[1]?.reply_markup?.inline_keyboard

      // Employee should only see sections
      expect(keyboard).toHaveLength(1)
      expect(keyboard[0]).toEqual([
        expect.objectContaining({ text: 'Sections', callback_data: 'menu-sections' }),
      ])
    })

    it('should Visitor has minimal access same as Employee', async () => {
      const mockUser = {
        id: 'user-11',
        telegramId: 12345n,
        fullName: 'Guest User',
        role: 'VISITOR' as const,
        isActive: true,
        adminScopes: [],
      }

      mockPrisma.user.findUnique.mockResolvedValue(mockUser)
      mockPrisma.auditLog.create.mockResolvedValue({})

      await menuHandler(mockCtx)

      expect(mockCtx.reply).toHaveBeenCalled()
      const call = mockCtx.reply.mock.calls[0]
      const keyboard = call[1]?.reply_markup?.inline_keyboard

      // Visitor should see same as Employee (only sections)
      expect(keyboard).toHaveLength(1)
      expect(keyboard[0]).toEqual([
        expect.objectContaining({ text: 'Sections', callback_data: 'menu-sections' }),
      ])
    })
  })
})