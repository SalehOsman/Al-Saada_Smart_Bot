import { beforeEach, describe, expect, it, vi } from 'vitest'
import { handleBackNavigation, showMainSectionsMenu, showSectionModules, showSubSectionsMenu } from '../../../src/bot/menus/sections'
import { moduleService } from '../../../src/services/modules'

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
vi.mock('../../../src/services/modules', () => ({
  moduleService: {
    getModulesBySection: vi.fn(),
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
      children: [],
      modules: [{ id: 'm1', isActive: true }],
    })

    vi.mocked(moduleService.getModulesBySection).mockResolvedValue([
      { slug: 'module1', name: 'Module 1', icon: '⚙️' } as any,
    ])

    const ctx = {
      t: vi.fn(k => k),
      editMessageText: vi.fn(),
      answerCallbackQuery: vi.fn(),
    } as any

    await showSectionModules(ctx, 'main2')

    const editMarkup = ctx.editMessageText.mock.calls[0][1].reply_markup
    expect(editMarkup.inline_keyboard[0][0].text).toContain('Module 1')
    expect(editMarkup.inline_keyboard[0][0].callback_data).toBe('module:module1')
  })

  it('(4) clicking sub-section shows its modules + back button', async () => {
    // Sub-section (has parentId set) with modules, no children
    mockPrisma.section.findUnique.mockResolvedValue({
      id: 'sub1',
      name: 'Sub Section 1',
      parentId: 'main1',
      children: [],
      modules: [{ id: 'm1', isActive: true }, { id: 'm2', isActive: true }],
    })

    vi.mocked(moduleService.getModulesBySection).mockResolvedValue([
      { slug: 'mod-a', name: 'Module A', icon: '📊' } as any,
      { slug: 'mod-b', name: 'Module B', icon: '📋' } as any,
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
    // Should show 2 modules + back button
    expect(editMarkup.inline_keyboard.length).toBe(3)
    expect(editMarkup.inline_keyboard[0][0].callback_data).toBe('module:mod-a')
    expect(editMarkup.inline_keyboard[1][0].callback_data).toBe('module:mod-b')
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
    vi.mocked(moduleService.getModulesBySection).mockResolvedValue([])

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
