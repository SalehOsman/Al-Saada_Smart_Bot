import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startHandler } from '../../../src/bot/handlers/start'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger, mockMenuHandler } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn() },
    joinRequest: { findFirst: vi.fn() },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  mockMenuHandler: vi.fn(),
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/utils/logger', () => ({ default: mockLogger }))
vi.mock('../../../src/bot/handlers/menu', () => ({ menuHandler: mockMenuHandler }))

describe('start to join flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should route new user to join conversation', async () => {
    // Arrange: New user - no existing user, no pending request
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.joinRequest.findFirst.mockResolvedValue(null)

    // Arrange: Setup mock context
    const mockEnter = vi.fn()
    const ctx = {
      from: { id: 12345678, first_name: 'Test', language_code: 'ar' },
      reply: vi.fn(),
      t: vi.fn((key: string) => key),
      conversation: { enter: mockEnter },
    } as any

    // Act: Trigger start handler
    await startHandler(ctx)

    // Assert: Should check for existing user
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { telegramId: 12345678n },
    })

    // Assert: Should check for pending join request
    expect(mockPrisma.joinRequest.findFirst).toHaveBeenCalledWith({
      where: {
        telegramId: 12345678n,
        status: 'PENDING',
      },
    })

    // Assert: Should route to join conversation
    expect(mockEnter).toHaveBeenCalledTimes(1)
    expect(mockEnter).toHaveBeenCalledWith('join')
    expect(mockMenuHandler).not.toHaveBeenCalled()
  })

  it('should route existing user to menu handler', async () => {
    // Arrange: Existing user
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      telegramId: 12345678n,
      fullName: 'Existing User',
      role: 'EMPLOYEE',
      isActive: true,
    })

    // Arrange: Setup mock context
    const mockEnter = vi.fn()
    const ctx = {
      from: { id: 12345678, first_name: 'Test', language_code: 'ar' },
      reply: vi.fn(),
      t: vi.fn((key: string) => key),
      conversation: { enter: mockEnter },
    } as any

    // Act: Trigger start handler
    await startHandler(ctx)

    // Assert: Should call menu handler
    expect(mockMenuHandler).toHaveBeenCalledWith(ctx)
    expect(mockEnter).not.toHaveBeenCalled()
  })

  it('should show pending message for user with pending request', async () => {
    // Arrange: No user but pending request exists
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.joinRequest.findFirst.mockResolvedValue({
      id: 'jr1',
      telegramId: 12345678n,
      fullName: 'Pending User',
      status: 'PENDING',
      createdAt: new Date(),
    })

    // Arrange: Setup mock context
    const mockEnter = vi.fn()
    const ctx = {
      from: { id: 12345678, first_name: 'Test', language_code: 'ar' },
      reply: vi.fn(),
      t: vi.fn((key: string, params?: any) => `translated:${key}`),
      conversation: { enter: mockEnter },
    } as any

    // Act: Trigger start handler
    await startHandler(ctx)

    // Assert: Should show pending message
    expect(ctx.reply).toHaveBeenCalled()
    expect(mockEnter).not.toHaveBeenCalled()
    expect(mockMenuHandler).not.toHaveBeenCalled()
  })
})
