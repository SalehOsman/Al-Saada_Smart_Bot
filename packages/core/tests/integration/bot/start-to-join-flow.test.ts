import { describe, it, expect, vi, beforeEach } from 'vitest'
import { startHandler } from '../../../src/bot/handlers/start'
import { joinConversation } from '../../../src/bot/conversations/join'
import { joinRequestService } from '../../../src/services/join-requests'
import * as formatters from '../../../src/bot/utils/formatters'
import * as userInputs from '../../../src/bot/utils/user-inputs'
import * as conversationUtils from '../../../src/bot/utils/conversation'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger, mockMenuHandler } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn(), count: vi.fn() },
    joinRequest: { findFirst: vi.fn(), create: vi.fn(), count: vi.fn() },
    auditLog: { create: vi.fn() },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
  mockMenuHandler: vi.fn(),
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/utils/logger', () => ({ default: mockLogger }))
vi.mock('../../../src/bot/handlers/menu', () => ({ menuHandler: mockMenuHandler }))

// Mock joinRequestService to avoid actual DB calls and allow spying
vi.mock('../../../src/services/join-requests', () => ({
  joinRequestService: {
    hasPendingRequest: vi.fn(),
    create: vi.fn(),
    createOrBootstrap: vi.fn(),
  },
}))

// Mock formatters
vi.mock('../../../src/bot/utils/formatters', () => ({
  formatArabicDate: vi.fn((d: Date) => d.toISOString()),
  formatGender: vi.fn((g: string) => g),
  notifyAdmins: vi.fn(),
}))

// Mock user inputs
vi.mock('../../../src/bot/utils/user-inputs', () => ({
  askForArabicName: vi.fn(),
  askForPhone: vi.fn(),
  askForNationalId: vi.fn(),
  generateNickname: vi.fn((name: string) => `${name}_nick`),
}))

// Mock conversation utils
vi.mock('../../../src/bot/utils/conversation', () => ({
  createMessageTracker: vi.fn(() => ({ ids: [] })),
  deleteTrackedMessages: vi.fn(),
  waitForTextOrCancel: vi.fn(),
  waitForSkippable: vi.fn(),
  waitForConfirm: vi.fn(),
  sendCancelled: vi.fn(),
}))

describe('start to join flow integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('startHandler', () => {
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

    it('should show pending message for user with pending request (T097)', async () => {
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
        t: vi.fn((key: string, params?: any) => key),
        conversation: { enter: mockEnter },
      } as any

      // Act: Trigger start handler
      await startHandler(ctx)

      // Assert: Should show pending message
      expect(ctx.reply).toHaveBeenCalledWith('join-request-already-pending')
      expect(mockEnter).not.toHaveBeenCalled()
      expect(mockMenuHandler).not.toHaveBeenCalled()

      // T097: Database should NOT create a duplicate join request
      expect(joinRequestService.createOrBootstrap).not.toHaveBeenCalled()
      expect(joinRequestService.create).not.toHaveBeenCalled()
    })
  })

  describe('joinConversation (T058)', () => {
    it('should complete full successful join flow and notify admins', async () => {
      // Arrange: Setup mocks for step-by-step inputs
      vi.mocked(userInputs.askForArabicName).mockResolvedValue('محمد علي')
      vi.mocked(conversationUtils.waitForSkippable).mockResolvedValue('__skip__') // nickname
      vi.mocked(userInputs.askForPhone).mockResolvedValue('01012345678')
      vi.mocked(userInputs.askForNationalId).mockResolvedValue({
        nationalId: '30001011234567',
        birthDate: new Date('2000-01-01'),
        gender: 'MALE',
      })
      vi.mocked(conversationUtils.waitForConfirm).mockResolvedValue(true)

      // Mock joinRequestService.createOrBootstrap for regular join
      vi.mocked(joinRequestService.createOrBootstrap).mockResolvedValue({
        type: 'join-request',
        requestId: 'test-request-id',
      })

      // Arrange: Setup mock context
      const ctx = {
        from: { id: 12345678, username: 'testuser' },
        reply: vi.fn().mockResolvedValue({ message_id: 1 }),
        t: vi.fn((key: string) => key),
      } as any

      const conversation = {} as any // Not needed for unit testing if inputs are mocked

      // Act: Run the join conversation
      await joinConversation(conversation, ctx)

      // Assert: Verify service call
      expect(joinRequestService.createOrBootstrap).toHaveBeenCalledWith(expect.objectContaining({
        telegramId: 12345678n,
        fullName: 'محمد علي',
        phone: '01012345678',
        nationalId: '30001011234567',
      }))

      // Assert: Verify success message
      expect(ctx.reply).toHaveBeenCalledWith(expect.stringContaining('join-request-received'))

      // T058: Verify notifyAdmins was triggered
      expect(formatters.notifyAdmins).toHaveBeenCalledWith({
        type: 'JOIN_REQUEST_NEW',
        params: {
          userName: 'محمد علي',
          requestCode: 'test-request-id',
        },
      })
    })
  })
})
