import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@prisma/client'
import { menuHandler } from '../src/bot/handlers/menu.js'

// Mock dependencies
const { mockPrisma, mockModuleLoader } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn() },
    auditLog: { create: vi.fn() },
    section: { findMany: vi.fn() },
  },
  mockModuleLoader: {
    getLoadedModules: vi.fn(),
  },
}))

vi.mock('../src/database/prisma.js', () => ({ prisma: mockPrisma }))
vi.mock('../src/bot/module-loader.js', () => ({ moduleLoader: mockModuleLoader }))
vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}))

vi.mock('../src/cache/redis', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    publish: vi.fn(),
    on: vi.fn(),
    quit: vi.fn(),
  },
}))

vi.mock('../src/services/maintenance', () => ({
  maintenanceService: {
    isMaintenanceMode: vi.fn().mockResolvedValue(false),
  },
}))

describe('menu Visibility (US5)', () => {
  const mockCtx = {
    from: { id: 12345 },
    t: vi.fn((key: string) => key),
    reply: vi.fn(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
    mockPrisma.section.findMany.mockResolvedValue([
      { id: 'sec-ops', slug: 'operations', name: 'Operations', icon: '⚙️', children: [] },
      { id: 'sec-hr', slug: 'hr', name: 'HR', icon: '👥', children: [] },
    ])
    // Default mock modules
    mockModuleLoader.getLoadedModules.mockReturnValue([
      {
        slug: 'fuel-entry',
        config: {
          sectionSlug: 'operations',
          permissions: { view: [Role.ADMIN, Role.EMPLOYEE, Role.SUPER_ADMIN] },
          name: 'fuel-entry-name',
          icon: '⛽',
        },
      },
      {
        slug: 'admin-only-module',
        config: {
          sectionSlug: 'hr',
          permissions: { view: [Role.ADMIN, Role.SUPER_ADMIN] },
          name: 'admin-module-name',
          icon: '🔒',
        },
      },
    ])
  })

  it('sUPER_ADMIN sees all modules', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u1',
      role: Role.SUPER_ADMIN,
      isActive: true,
      adminScopes: [],
    })

    await menuHandler(mockCtx)

    const call = mockCtx.reply.mock.calls.find((c: any) => c[1]?.reply_markup?.inline_keyboard)
    const keyboard = call[1].reply_markup.inline_keyboard

    // Flatten keyboard to check for buttons
    const buttons = keyboard.flat()
    expect(buttons.some((b: any) => b.callback_data === 'section:view:sec-ops')).toBe(true)
    expect(buttons.some((b: any) => b.callback_data === 'section:view:sec-hr')).toBe(true)
  })

  it('eMPLOYEE only sees modules where role is in permissions.view', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u2',
      role: Role.EMPLOYEE,
      isActive: true,
      adminScopes: [],
    })
    mockPrisma.auditLog.create.mockResolvedValue({})

    await menuHandler(mockCtx)

    const call = mockCtx.reply.mock.calls.find((c: any) => c[1]?.reply_markup?.inline_keyboard)
    expect(call).toBeDefined()
    const buttons = call[1].reply_markup.inline_keyboard.flat()

    expect(buttons.some((b: any) => b.callback_data === 'section:view:sec-ops')).toBe(true)
    expect(buttons.some((b: any) => b.callback_data === 'section:view:sec-hr')).toBe(false)
  })

  it('aDMIN only sees modules with matching AdminScope', async () => {
    // Admin has scope for 'operations' only
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'u3',
      role: Role.ADMIN,
      isActive: true,
      adminScopes: [
        { sectionId: 'sec-ops', moduleId: null },
      ],
    })
    mockPrisma.auditLog.create.mockResolvedValue({})

    // Precise mock for section lookup used in getAuthorizedModules
    mockPrisma.section.findMany.mockImplementation(({ where }: any) => {
      // If querying for main menu rendering (parentId: null)
      if (where.parentId === null) {
        return Promise.resolve([
          { id: 'sec-ops', slug: 'operations', name: 'Operations', icon: '⚙️', children: [] },
          { id: 'sec-hr', slug: 'hr', name: 'HR', icon: '👥', children: [] },
        ])
      }

      // If querying for AdminScope resolution in getAuthorizedModules
      const all = [
        { id: 'sec-ops', slug: 'operations' },
        { id: 'sec-hr', slug: 'hr' },
      ]
      if (where.OR) {
        const ids = where.OR[0].id.in || []
        return Promise.resolve(all.filter(s => ids.includes(s.id)))
      }
      return Promise.resolve([])
    })

    await menuHandler(mockCtx)

    const call = mockCtx.reply.mock.calls.find((c: any) => c[1]?.reply_markup?.inline_keyboard)
    expect(call).toBeDefined()
    const buttons = call[1].reply_markup.inline_keyboard.flat()

    expect(buttons.some((b: any) => b.callback_data === 'section:view:sec-ops')).toBe(true)
    expect(buttons.some((b: any) => b.callback_data === 'section:view:sec-hr')).toBe(false)
  })
})
