import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleBackNavigation, showMainSectionsMenu, showSectionModules } from '../../../src/bot/menus/sections'
import { moduleLoader } from '../../../src/bot/module-loader'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    section: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
  },
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/bot/module-loader', () => ({
  moduleLoader: {
    getLoadedModules: vi.fn(() => []),
  },
}))
vi.mock('../../../src/services/maintenance', () => ({
  maintenanceService: {
    isMaintenanceMode: vi.fn().mockResolvedValue(false),
  },
}))

describe('hierarchical navigation integration (T040-A)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramId: 1n,
      role: 'SUPER_ADMIN',
      adminScopes: [],
    })
  })

  it('(1) main menu shows only main sections', async () => {
    mockPrisma.section.findMany.mockResolvedValue([
      { id: 's1', name: 'S1', icon: '📁', children: [], _count: { modules: 1 } },
      { id: 's2', name: 'S2', icon: '📁', children: [{ id: 'sub1' }], _count: { modules: 0 } },
    ])

    const ctx = {
      t: vi.fn(k => k),
      reply: vi.fn(),
      from: { id: 1 },
    } as any

    await showMainSectionsMenu(ctx)

    expect(mockPrisma.section.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { parentId: null, isActive: true },
    }))

    const replyMarkup = ctx.reply.mock.calls[0][1].reply_markup
    // S1, S2, Add, Back
    expect(replyMarkup.inline_keyboard.length).toBe(4)
    expect(replyMarkup.inline_keyboard[0][0].callback_data).toBe('section:view:s1')
    expect(replyMarkup.inline_keyboard[1][0].callback_data).toBe('section:view:s2')
  })

  it('(2) clicking main section with sub-sections shows sub-section list', async () => {
    // When showSectionModules is called for a section with children, it should call showSubSectionsMenu
    const mockSection = {
      id: 'main1',
      name: 'Main 1',
      icon: '📁',
      children: [{ id: 'sub1', name: 'Sub 1', icon: '📄', isActive: true }],
      modules: [],
    }

    mockPrisma.section.findUnique.mockResolvedValue(mockSection)

    const ctx = {
      t: vi.fn(k => k),
      editMessageText: vi.fn(),
      reply: vi.fn(),
      answerCallbackQuery: vi.fn(),
      callbackQuery: { data: 'section:view:main1' },
      from: { id: 1 },
    } as any

    await showSectionModules(ctx, 'main1')

    expect(ctx.editMessageText).toHaveBeenCalled()
    const editMarkup = ctx.editMessageText.mock.calls[0][1].reply_markup
    expect(editMarkup.inline_keyboard[0][0].text).toContain('Sub 1')
    expect(editMarkup.inline_keyboard[0][0].text).toContain('📁')
    expect(editMarkup.inline_keyboard[0][0].callback_data).toBe('section:view:sub1')
  })

  it('(3) clicking main section without sub-sections shows modules directly', async () => {
    mockPrisma.section.findUnique.mockResolvedValue({
      id: 'main2',
      name: 'Main 2',
      slug: 'main2-slug',
      children: [],
      modules: [{ id: 'm1', isActive: true }],
    })

    vi.mocked(moduleLoader.getLoadedModules).mockReturnValue([
      {
        slug: 'module1',
        config: { name: 'Module 1', icon: '⚙️', sectionSlug: 'main2-slug', orderIndex: 1 },
        status: 'loaded',
      } as any,
    ])

    const ctx = {
      t: vi.fn(k => k),
      editMessageText: vi.fn(),
      reply: vi.fn(),
      answerCallbackQuery: vi.fn(),
      callbackQuery: { data: 'section:view:main2' },
      from: { id: 1 },
    } as any

    await showSectionModules(ctx, 'main2')

    const editMarkup = ctx.editMessageText.mock.calls[0][1].reply_markup
    expect(editMarkup.inline_keyboard[0][0].text).toContain('Module 1')
    expect(editMarkup.inline_keyboard[0][0].callback_data).toBe('mod:module1')
  })

  it('(4) clicking sub-section shows its modules + back button', async () => {
    mockPrisma.section.findUnique.mockResolvedValue({
      id: 'sub1',
      name: 'Sub Section 1',
      slug: 'sub1-slug',
      parentId: 'main1',
      children: [],
      modules: [{ id: 'm1', isActive: true }, { id: 'm2', isActive: true }],
    })

    vi.mocked(moduleLoader.getLoadedModules).mockReturnValue([
      {
        slug: 'mod-a',
        config: { name: 'Module A', icon: '📊', sectionSlug: 'sub1-slug', orderIndex: 1 },
        status: 'loaded',
      } as any,
      {
        slug: 'mod-b',
        config: { name: 'Module B', icon: '📋', sectionSlug: 'sub1-slug', orderIndex: 2 },
        status: 'loaded',
      } as any,
    ])

    const ctx = {
      t: vi.fn(k => k),
      editMessageText: vi.fn(),
      reply: vi.fn(),
      answerCallbackQuery: vi.fn(),
      callbackQuery: { data: 'section:view:sub1' },
      from: { id: 1 },
    } as any

    await showSectionModules(ctx, 'sub1')

    expect(ctx.answerCallbackQuery).toHaveBeenCalled()
    expect(ctx.editMessageText).toHaveBeenCalled()

    const editMarkup = ctx.editMessageText.mock.calls[0][1].reply_markup
    expect(editMarkup.inline_keyboard.length).toBe(3)
    expect(editMarkup.inline_keyboard[0][0].callback_data).toBe('mod:mod-a')
    expect(editMarkup.inline_keyboard[1][0].callback_data).toBe('mod:mod-b')
    // Last row = back button to parent
    expect(editMarkup.inline_keyboard[2][0].callback_data).toBe('section:view:main1')
  })

  it('(5) static back button navigation works', async () => {
    // Simulate back button which now delegates to menuHandler
    const ctx = {
      t: vi.fn(k => k),
      reply: vi.fn(),
      editMessageText: vi.fn(),
      from: { id: 1 },
    } as any

    mockPrisma.user.findUnique.mockResolvedValue({
      telegramId: 1n,
      role: 'SUPER_ADMIN',
      adminScopes: [],
      isActive: true,
    })

    await handleBackNavigation(ctx)

    // Wait for dynamic import resolution in handleBackNavigation
    await new Promise(resolve => setTimeout(resolve, 10))

    // Should call menuHandler, which fetches the user
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { telegramId: 1n },
    }))
  })
})
