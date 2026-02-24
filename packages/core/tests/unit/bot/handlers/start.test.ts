import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { startHandler } from '../../../../src/bot/handlers/start'
import type { BotContext } from '../../../../src/types/context'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger, mockMenuHandler } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn() },
    joinRequest: { findFirst: vi.fn() },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  mockMenuHandler: vi.fn(),
}))

vi.mock('../../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../../src/utils/logger', () => ({ default: mockLogger }))
vi.mock('../../../../src/bot/handlers/menu', () => ({ menuHandler: mockMenuHandler }))

// ─── Context factory ─────────────────────────────────────────────────────
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
      const date = String(params?.date ?? '')
      const map: Record<string, string> = {
        join_request_already_pending: `Your request is pending since ${date}`,
        error_generic: 'An error occurred',
      }
      return map[key] ?? key
    }),
  } as unknown as BotContext
}

describe('Start Handler Tests (Unified Flow)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.user.findUnique = vi.fn()
    mockPrisma.joinRequest.findFirst = vi.fn()
    mockLogger.info = vi.fn()
    mockLogger.error = vi.fn()
    mockLogger.warn = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Case 1: Existing User', () => {
    it('should call menuHandler for existing user', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        telegramId: 12345n,
        fullName: 'Test User',
        role: 'VISITOR',
        isActive: true,
      })

      await startHandler(ctx)

      expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
        where: { telegramId: 12345n },
      })
      expect(mockMenuHandler).toHaveBeenCalledWith(ctx)
      expect((ctx.conversation as any).enter).not.toHaveBeenCalled()
    })

    it('should call menuHandler for existing SUPER_ADMIN user', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        telegramId: 12345n,
        fullName: 'Admin User',
        role: 'SUPER_ADMIN',
        isActive: true,
      })

      await startHandler(ctx)

      expect(mockMenuHandler).toHaveBeenCalledWith(ctx)
    })
  })

  describe('Case 2: Pending Join Request', () => {
    it('should show pending message when user has pending join request', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.joinRequest.findFirst.mockResolvedValue({
        id: 'jr1',
        telegramId: 12345n,
        fullName: 'Test User',
        status: 'PENDING',
        createdAt: new Date('2026-02-23'),
      })

      await startHandler(ctx)

      expect(mockPrisma.joinRequest.findFirst).toHaveBeenCalledWith({
        where: {
          telegramId: 12345n,
          status: 'PENDING',
        },
      })
      expect(ctx.reply).toHaveBeenCalled()
      expect((ctx.conversation as any).enter).not.toHaveBeenCalled()
    })
  })

  describe('Case 3: New User - Enter Join Conversation', () => {
    it('should enter join conversation for new user without pending request', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockResolvedValue(null)
      mockPrisma.joinRequest.findFirst.mockResolvedValue(null)

      await startHandler(ctx)

      expect((ctx.conversation as any).enter).toHaveBeenCalledWith('join')
      expect(mockMenuHandler).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should return early for invalid telegram ID (0)', async () => {
      const ctx = makeCtx({ id: 0 })
      await startHandler(ctx)
      expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      expect(ctx.reply).not.toHaveBeenCalled()
    })

    it('should handle database error gracefully', async () => {
      const ctx = makeCtx()
      mockPrisma.user.findUnique.mockRejectedValue(new Error('DB down'))

      await startHandler(ctx)

      expect(mockLogger.error).toHaveBeenCalledWith(
        { err: expect.any(Error) },
        expect.stringContaining('Error in /start handler:'),
      )
      expect(ctx.reply).toHaveBeenCalledWith('An error occurred')
    })
  })
})
