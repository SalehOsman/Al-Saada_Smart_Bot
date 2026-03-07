import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@prisma/client'
import { rbacService } from '../../../../src/services/rbac'
import { rbacMiddleware } from '../../../../src/bot/middlewares/rbac'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockAdminScopeService, mockLogger, mockRedis } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn() },
  },
  mockAdminScopeService: {
    getScopes: vi.fn(),
  },
  mockLogger: { warn: vi.fn(), info: vi.fn(), error: vi.fn() },
  mockRedis: { get: vi.fn().mockResolvedValue(null), setex: vi.fn() },
}))

vi.mock('../../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../../src/services/admin-scope', () => ({
  adminScopeService: mockAdminScopeService,
}))
vi.mock('../../../../src/utils/logger', () => ({ default: mockLogger }))
vi.mock('../../../../src/cache/redis', () => ({ redis: mockRedis }))
vi.mock('../../../../src/services/sections', () => ({
  sectionService: { getAncestors: vi.fn().mockResolvedValue([]) },
}))
vi.mock('grammy', () => ({ session: vi.fn() }))
vi.mock('../../../../src/bot/middlewares/session', () => ({
  defaultSession: vi.fn(() => ({ role: 'VISITOR', userId: undefined, currentMenu: [] })),
  sessionMiddleware: vi.fn(),
  ResilientRedisStorage: vi.fn(),
}))
vi.mock('../../../../src/services/audit-logs', () => ({ auditService: { log: vi.fn() } }))

describe('rBAC Service & Middleware (T034)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rbacService.canAccess', () => {
    it('should allow SUPER_ADMIN everything', async () => {
      const result = await rbacService.canAccess(1n, Role.SUPER_ADMIN, { sectionId: 'any' })
      expect(result).toBe(true)
    })

    it('should deny VISITOR access to sections', async () => {
      const result = await rbacService.canAccess(1n, Role.VISITOR, { sectionId: 'any' })
      expect(result).toBe(false)
    })

    it('should allow ADMIN if scope exists', async () => {
      mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 's1', moduleId: null }])
      const result = await rbacService.canAccess(1n, Role.ADMIN, { sectionId: 's1' })
      expect(result).toBe(true)
    })

    it('should deny ADMIN if scope does not exist', async () => {
      mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 's2', moduleId: null }])
      const result = await rbacService.canAccess(1n, Role.ADMIN, { sectionId: 's1' })
      expect(result).toBe(false)
    })

    it('should allow ADMIN for specific module if section-wide scope exists', async () => {
      mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 's1', moduleId: null }])
      const result = await rbacService.canAccess(1n, Role.ADMIN, {
        sectionId: 's1',
        moduleId: 'm1',
      })
      expect(result).toBe(true)
    })

    it('should allow ADMIN for specific module if module-specific scope exists', async () => {
      mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 's1', moduleId: 'm1' }])
      const result = await rbacService.canAccess(1n, Role.ADMIN, {
        sectionId: 's1',
        moduleId: 'm1',
      })
      expect(result).toBe(true)
    })
  })

  describe('rbacMiddleware', () => {
    const next = vi.fn()

    it('should block inactive users', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        telegramId: 123n,
        isActive: false,
        role: Role.EMPLOYEE,
      })

      const ctx = {
        from: { id: 123 },
        session: { role: Role.EMPLOYEE },
        reply: vi.fn(),
        t: vi.fn(k => k),
      } as any

      await (rbacMiddleware as any)(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith('errors-account-deactivated')
      expect(next).not.toHaveBeenCalled()
    })

    it('should block unauthorized command access', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        telegramId: 123n,
        isActive: true,
        role: Role.EMPLOYEE,
      })

      const ctx = {
        from: { id: 123 },
        message: { text: '/users' },
        session: { role: Role.EMPLOYEE },
        reply: vi.fn(),
        t: vi.fn(k => k),
      } as any

      await (rbacMiddleware as any)(ctx, next)

      expect(ctx.reply).toHaveBeenCalledWith('errors-unauthorized')
      expect(next).not.toHaveBeenCalled()
    })

    it('should allow authorized command access', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        telegramId: 123n,
        isActive: true,
        role: Role.SUPER_ADMIN,
      })

      const ctx = {
        from: { id: 123 },
        message: { text: '/users' },
        session: { role: Role.SUPER_ADMIN },
        reply: vi.fn(),
        t: vi.fn(k => k),
      } as any

      await (rbacMiddleware as any)(ctx, next)

      expect(next).toHaveBeenCalled()
      expect(ctx.reply).not.toHaveBeenCalled()
    })
  })
})
