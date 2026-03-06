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
  },
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/bot/module-loader', () => ({
  moduleLoader: {
    getLoadedModules: vi.fn(),
  },
}))

describe('hierarchical navigation integration (T040-A)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('(1) main menu shows only main sections', async () => {
    mockPrisma.section.findMany.mockResolvedValue([
      { id: 's1', name: 'S1', icon: '📁', children: [], _count: { modules: 1 } },
      { id: 's2', name: 'S2', icon: '📁', children: [{ id: 'sub1' }], _count: { modules: 0 } },
    ])

    const ctx = {
      t: vi.fn(k => k),
      reply: vi.fn(),
    } as any

    await showMainSectionsMenu(ctx)

    expect(mockPrisma.section.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { parentId: null, isActive: true },
    }))

    const replyMarkup = ctx.reply.mock.calls[0][1].reply_markup
    expect(replyMarkup.inline_keyboard.length).toBe(4) // S1, S2, Add, Back
    expect(replyMarkup.inline_keyboard[0][0].callback_data).toBe('section:view:s1')
    expect(replyMarkup.inline_keyboard[1][0].callback_data).toBe('section:view:s2')
  })

  it('(2) clicking main section with sub-sections shows sub-section list', async () => {
    // When showSectionModules is called for a section with children, it should call showSubSectionsMenu
    const mockSection = {
      id: 'main1',
      name: 'Main 1',
      icon: '📁',
      children: [{ id: 'sub1', name: 'Sub 1', icon: '📄', _count: { modules: 1 } }],
      modules: [],
    }

    // Ensure both findUnique calls return the same mock section
    mockPrisma.section.findUnique.mockResolvedValue(mockSection)

    const ctx = {
      t: vi.fn(k => k),
      editMessageText: vi.fn(),
      answerCallbackQuery: vi.fn(),
    } as any

    await showSectionModules(ctx, 'main1')

    // It should fetch children for the menu
    expect(mockPrisma.section.findUnique).toHaveBeenCalled()

    // Ensure editMessageText was called
    expect(ctx.editMessageText).toHaveBeenCalled()

    const firstCall = ctx.editMessageText.mock.calls[0]
    expect(firstCall).toBeDefined()
    expect(firstCall[1]).toBeDefined()

    const editMarkup = firstCall[1].reply_markup
    expect(editMarkup.inline_keyboard[0][0].text).toContain('Sub 1')
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
      answerCallbackQuery: vi.fn(),
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
      answerCallbackQuery: vi.fn(),
    } as any

    await showSectionModules(ctx, 'sub1')

    expect(ctx.answerCallbackQuery).toHaveBeenCalled()
    expect(ctx.editMessageText).toHaveBeenCalled()

    const editMarkup = ctx.editMessageText.mock.calls[0][1].reply_markup
    // 2 modules + back button = 3 rows
    expect(editMarkup.inline_keyboard.length).toBe(3)
    expect(editMarkup.inline_keyboard[0][0].callback_data).toBe('mod:mod-a')
    expect(editMarkup.inline_keyboard[1][0].callback_data).toBe('mod:mod-b')
    // Last row = back button
    expect(editMarkup.inline_keyboard[2][0].callback_data).toBe('menu:sections')
  })

  it('(5) breadcrumb tracking and back button works', async () => {
    // Simulate being in a sub-section
    const ctx = {
      session: {
        currentMenu: [
          { level: 'main', id: 'menu:main' },
          { level: 'sections', id: 'menu:sections' },
          { level: 'section', id: 'main1' },
          { level: 'section', id: 'sub1' },
        ],
      },
      t: vi.fn(k => k),
      editMessageText: vi.fn(),
      answerCallbackQuery: vi.fn(),
    } as any

    // Mock parent section for showSectionModules (when going back to main1)
    mockPrisma.section.findUnique.mockResolvedValue({
      id: 'main1',
      name: 'Main 1',
      children: [],
      modules: [{ id: 'm1', isActive: true }],
    })
    vi.mocked(moduleLoader.getLoadedModules).mockReturnValue([])

    await handleBackNavigation(ctx)

    // Should pop 'sub1' and be at 'main1'
    expect(ctx.session.currentMenu.length).toBe(3)
    expect(ctx.session.currentMenu[2].id).toBe('main1')

    // Should show modules/subsections for main1
    expect(mockPrisma.section.findUnique).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'main1' },
    }))
  })
})
