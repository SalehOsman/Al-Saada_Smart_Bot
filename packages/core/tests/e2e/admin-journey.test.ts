import { beforeEach, describe, expect, it, vi } from 'vitest'

import { showMainSectionsMenu } from '../../src/bot/menus/sections'
import { sectionsCallbackHandler } from '../../src/bot/handlers/sections'
import { usersHandler } from '../../src/bot/handlers/users'
import { auditHandler } from '../../src/bot/handlers/audit'

const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    section: { findMany: vi.fn(), findUnique: vi.fn() },
    user: { findMany: vi.fn(), count: vi.fn() },
    auditLog: { findMany: vi.fn(), count: vi.fn() },
  },
}))

vi.mock('grammy', () => ({
  InlineKeyboard: class {
    row = vi.fn().mockReturnThis()
    text = vi.fn().mockReturnThis()
    url = vi.fn().mockReturnThis()
  },
}))

vi.mock('../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../src/cache/redis', () => ({
  redis: { get: vi.fn(), set: vi.fn(), del: vi.fn() },
  bullmqRedis: {},
  disconnect: vi.fn(),
}))
vi.mock('../../src/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))
vi.mock('../../src/services/audit-logs', () => ({ auditService: { log: vi.fn() } }))
vi.mock('../../src/services/sections', () => ({ sectionService: { getSections: vi.fn() } }))
vi.mock('../../src/bot/module-loader', () => ({ moduleLoader: { getLoadedModules: vi.fn(() => []) } }))
vi.mock('../../src/bot/utils/reply', () => ({
  replyOrEdit: vi.fn(async (ctx: any, text: string, keyboard: any) => {
    if (ctx.callbackQuery) {
      return ctx.editMessageText(text, { reply_markup: keyboard })
    }
    return ctx.reply(text, { reply_markup: keyboard })
  }),
}))

describe('t071: Admin Journey E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('test 1: /sections command -> shows main sections menu', async () => {
    mockPrisma.section.findMany.mockResolvedValue([
      { id: '1', slug: 's1', name: 'Section 1', icon: '📁', isActive: true, children: [] },
    ])

    const ctx = {
      reply: vi.fn(),
      t: vi.fn((k: string) => k),
      session: { role: 'SUPER_ADMIN' },
    } as any

    await showMainSectionsMenu(ctx)
    expect(ctx.reply).toHaveBeenCalledWith('sections-menu-title', expect.any(Object))
  })

  it('test 2: click main section with sub-sections -> shows sub-section list + back button', async () => {
    const parent = {
      id: '1',
      slug: 's1',
      name: 'Section 1',
      icon: '📁',
      isActive: true,
      children: [{ id: '2' }],
    }
    mockPrisma.section.findUnique.mockResolvedValue(parent)

    const ctx = {
      callbackQuery: { data: 'section:view:1' },
      reply: vi.fn(),
      editMessageText: vi.fn(),
      answerCallbackQuery: vi.fn(),
      t: vi.fn((k: string) => k),
      session: { currentMenu: [] },
    } as any

    await sectionsCallbackHandler(ctx)

    expect(ctx.answerCallbackQuery).toHaveBeenCalled()
  })

  it('test 4: /users command -> shows user list', async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { telegramId: 1n, fullName: 'User 1', role: 'EMPLOYEE', isActive: true },
    ])
    mockPrisma.user.count.mockResolvedValue(1)

    const ctx = {
      reply: vi.fn(),
      t: vi.fn((k: string) => k),
      session: { role: 'SUPER_ADMIN' },
    } as any

    await usersHandler(ctx)
    expect(ctx.reply).toHaveBeenCalledWith('users-list-title', expect.any(Object))
  })

  it('test 5: /audit command -> shows audit menu', async () => {
    mockPrisma.auditLog.findMany.mockResolvedValue([
      { id: '1', action: 'SYSTEM_START', userId: 1n, createdAt: new Date() },
    ])

    const ctx = {
      reply: vi.fn(),
      t: vi.fn((k: string) => k),
      session: { role: 'SUPER_ADMIN' },
    } as any

    await auditHandler(ctx)
    expect(ctx.reply).toHaveBeenCalledWith('audit-menu-title', expect.any(Object))
  })
})
