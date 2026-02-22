import { describe, it, expect, vi, beforeEach } from 'vitest'
import { Bot, Context } from 'grammy'
import { startHandler } from '../../../src/bot/handlers/start'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn(), create: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() }
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/utils/logger', () => ({ default: mockLogger }))
vi.mock('../../../src/config/env', () => ({
  env: { INITIAL_SUPER_ADMIN_ID: '99999' }
}))

describe('Start to Join Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should successfully route a new user to the join conversation upon /start', async () => {
    // 1. Arrange: Setup DB Mock for a completely new user
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.user.count.mockResolvedValue(1) // Super admin already exists, preventing bootstrap

    // 2. Arrange: Setup a mock Bot Context
    // We mock the t() function and conversation.enter() which are required
    const mockEnter = vi.fn()
    const ctx = {
      from: { id: 12345678, first_name: 'Test', language_code: 'ar' },
      reply: vi.fn(),
      t: vi.fn((key: string) => key),
      conversation: { enter: mockEnter }
    } as unknown as Context

    // 3. Act: Trigger the start handler directly
    await startHandler(ctx as any)

    // 4. Assert: Verify the flow execution
    // - Should check if user exists
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { telegramId: 12345678n },
    })

    // - Should NOT create a user directly (handled by JOIN flow later)
    expect(mockPrisma.user.create).not.toHaveBeenCalled()

    // - Most importantly: Should route the user to the 'join' conversation
    expect(mockEnter).toHaveBeenCalledTimes(1)
    expect(mockEnter).toHaveBeenCalledWith('join')
  })
})