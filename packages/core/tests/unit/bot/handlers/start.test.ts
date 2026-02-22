import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startHandler } from '../../../../src/bot/handlers/start'
import type { BotContext } from '../../../../src/types/context'

// ─── Mutable env — getter so per-test mutations reach start.ts ───────────────
const mockEnvData = {
  INITIAL_SUPER_ADMIN_ID: undefined as number | undefined,
  NODE_ENV: 'test' as string,
}
vi.mock('../../../../src/config/env', () => ({
  get env() { return mockEnvData },
}))

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}))

vi.mock('../../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../../src/utils/logger', () => ({ default: mockLogger }))

// ─── Context factory — t() interpolates {name} correctly ─────────────────────
function makeCtx(opts: { id?: number; firstName?: string; username?: string; languageCode?: string } = {}): BotContext {
  const id = opts.id ?? 12345
  const firstName = opts.firstName ?? 'Test User'
  const username = opts.username ?? 'testuser'
  const languageCode = opts.languageCode ?? 'ar'
  return {
    from: { id, first_name: firstName, username, language_code: languageCode },
    reply: vi.fn(),
    conversation: { enter: vi.fn() },
    t: vi.fn((key: string, params?: Record<string, unknown>) => {
      const name = String(params?.name ?? '')
      const map: Record<string, string> = {
        welcome_back: `Welcome back, ${name}!`,
        welcome_super_admin: `Welcome Super Admin ${name}!`,
        error_generic: 'An error occurred',
      }
      return map[key] ?? key
    }),
  } as unknown as BotContext
}

describe('@testing-patterns @typescript-expert Start Handler Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnvData.INITIAL_SUPER_ADMIN_ID = undefined
    mockPrisma.user.findUnique = vi.fn()
    mockPrisma.user.create = vi.fn()
    mockPrisma.user.count = vi.fn()
    mockPrisma.auditLog.create = vi.fn()
    mockLogger.info = vi.fn()
    mockLogger.error = vi.fn()
    mockLogger.warn = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('T022/T023 - Secure Bootstrap Logic Tests', () => {

    it('should return early for invalid telegram ID (0)', async () => {
      const ctx = makeCtx({ id: 0 })
      await startHandler(ctx)
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(ctx.reply).not.toHaveBeenCalled()
    })

    it('should show welcome back message for existing user', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1', telegramId: 12345n, fullName: 'Test User', role: 'VISITOR', isActive: true,
      })
      await startHandler(ctx)
      expect(ctx.reply).toHaveBeenCalledWith('Welcome back, Test User!')
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect((ctx.conversation as any).enter).not.toHaveBeenCalled()
    })

    it('should show welcome back for existing user even when bootstrap ID matches', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u2', telegramId: 12345n, fullName: 'Regular User', role: 'VISITOR', isActive: true,
      })
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 12345
      await startHandler(ctx)
      expect(ctx.reply).toHaveBeenCalledWith('Welcome back, Regular User!')
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
    })

    it('should bootstrap Super Admin when 0 admins exist and ID matches exactly', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.count.mockResolvedValue(0)
      mockPrisma.user.create.mockResolvedValue({
        id: 'sa-1', telegramId: 12345n, fullName: 'Test User', role: 'SUPER_ADMIN',
      })
      mockPrisma.auditLog.create.mockResolvedValue({})
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 12345

      await startHandler(ctx)

      expect(mockPrisma.user.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          telegramId: 12345n,
          fullName: 'Test User',
          role: 'SUPER_ADMIN',
          nickname: expect.stringMatching(/^Test User-[a-z0-9]{4}$/),
          isActive: true,
          language: 'ar',
        }),
      })
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 12345n,
          action: 'USER_BOOTSTRAP',
          targetType: 'User',
          details: { role: 'SUPER_ADMIN' },
        }),
      })
      expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('Super Admin bootstrapped'))
      expect(ctx.reply).toHaveBeenCalledWith('Welcome Super Admin Test User!')
    })

    it('should NOT bootstrap when ID does not match env', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.count.mockResolvedValue(0)
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 99999
      await startHandler(ctx)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect((ctx.conversation as any).enter).toHaveBeenCalledWith('join')
    })

    it('should NOT bootstrap when INITIAL_SUPER_ADMIN_ID is not set', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.count.mockResolvedValue(0)
      mockEnvData.INITIAL_SUPER_ADMIN_ID = undefined
      await startHandler(ctx)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect((ctx.conversation as any).enter).toHaveBeenCalledWith('join')
    })

    it('should NOT bootstrap when a SUPER_ADMIN already exists in DB', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.count.mockResolvedValue(1)
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 12345
      await startHandler(ctx)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect((ctx.conversation as any).enter).toHaveBeenCalledWith('join')
    })

    it('should NOT bootstrap when INITIAL_SUPER_ADMIN_ID is 0', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.user.count.mockResolvedValue(0)
      mockEnvData.INITIAL_SUPER_ADMIN_ID = 0
      await startHandler(ctx)
      expect(mockPrisma.user.create).not.toHaveBeenCalled()
      expect((ctx.conversation as any).enter).toHaveBeenCalledWith('join')
    })

    it('should handle database error gracefully', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB down'))
      await startHandler(ctx)
      expect(mockLogger.error).toHaveBeenCalledWith('Error in /start handler:', expect.any(Error))
      expect(ctx.reply).toHaveBeenCalledWith('An error occurred')
    })

    it('should be strict — all mismatch scenarios redirect to join', async () => {
      const scenarios: any[] = [12346, '99999', null, undefined, 0]
      for (const envId of scenarios) {
        const ctx = makeCtx()
        mockPrisma.user.findUnique = vi.fn().mockResolvedValue(null)
        mockPrisma.user.count = vi.fn().mockResolvedValue(0)
        mockPrisma.user.create = vi.fn()
        mockPrisma.auditLog.create = vi.fn()
        mockEnvData.INITIAL_SUPER_ADMIN_ID = envId
        await startHandler(ctx)
        expect(mockPrisma.user.create).not.toHaveBeenCalled()
        expect((ctx.conversation as any).enter).toHaveBeenCalledWith('join')
      }
    })

  })
})