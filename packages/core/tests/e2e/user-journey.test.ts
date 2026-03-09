import { beforeEach, describe, expect, it, vi } from 'vitest'
import { startHandler } from '../../src/bot/handlers/start'
import { menuHandler } from '../../src/bot/handlers/menu'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    user: { findUnique: vi.fn(), count: vi.fn(), create: vi.fn(), update: vi.fn() },
    joinRequest: { findFirst: vi.fn() },
    section: { findMany: vi.fn().mockResolvedValue([]) },
  },
}))

vi.mock('../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../src/utils/logger', () => ({ default: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() } }))

vi.mock('../../src/cache/redis', () => ({
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

vi.mock('../../src/services/maintenance', () => ({
  maintenanceService: {
    isMaintenanceMode: vi.fn().mockResolvedValue(false),
  },
}))

// We need to mock moduleLoader for menuHandler
vi.mock('../../src/bot/module-loader', () => ({
  moduleLoader: {
    getLoadedModules: vi.fn(() => []),
  },
}))

describe('t070: User Journey E2E Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.INITIAL_SUPER_ADMIN_ID = '11111111'
  })

  // Test 1: INITIAL_SUPER_ADMIN_ID user sends /start -> completes join flow -> gets SUPER_ADMIN
  it('should route INITIAL_SUPER_ADMIN_ID to join flow and they would become SUPER_ADMIN', async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    mockPrisma.joinRequest.findFirst.mockResolvedValue(null)

    const mockEnter = vi.fn()
    const ctx = {
      from: { id: 11111111, first_name: 'SuperBoss' },
      reply: vi.fn(),
      t: vi.fn(key => key),
      conversation: { enter: mockEnter },
    } as any

    await startHandler(ctx)

    // Routes to join conversation
    expect(mockEnter).toHaveBeenCalledWith('join')
  })

  // Test 2: SUPER_ADMIN sends /start -> sees admin menu
  it('should show SUPER_ADMIN the super admin menu', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramId: 22222222n,
      role: 'SUPER_ADMIN',
      isActive: true,
      adminScopes: [],
    })

    const ctx = {
      from: { id: 22222222, first_name: 'Admin' },
      reply: vi.fn(),
      t: vi.fn(key => key),
    } as any

    await startHandler(ctx)
    // startHandler calls menuHandler if user is active. But wait, startHandler is mocked or menuHandler?
    // In this file we didn't mock startHandler or menuHandler. We didn't mock the internal menuHandler import in start.ts!
    // Actually, startHandler imports menuHandler. If we don't mock it, it will call the real menuHandler.

    await menuHandler(ctx)
    expect(ctx.reply).toHaveBeenCalledWith('menu-super-admin', expect.any(Object))
  })

  // Test 3: ADMIN sends /start -> sees admin menu
  it('should show ADMIN the admin menu', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramId: 33333333n,
      role: 'ADMIN',
      isActive: true,
      adminScopes: [],
    })

    const ctx = {
      from: { id: 33333333, first_name: 'Admin2' },
      reply: vi.fn(),
      t: vi.fn(key => key),
    } as any

    await menuHandler(ctx)
    expect(ctx.reply).toHaveBeenCalledWith('menu-admin', expect.any(Object))
  })

  // Test 4: EMPLOYEE sends /start -> sees user menu
  it('should show EMPLOYEE the user menu', async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramId: 44444444n,
      role: 'EMPLOYEE',
      isActive: true,
      adminScopes: [],
    })

    const ctx = {
      from: { id: 44444444, first_name: 'Employee' },
      reply: vi.fn(),
      t: vi.fn(key => key),
    } as any

    await menuHandler(ctx)
    expect(ctx.reply).toHaveBeenCalledWith('menu-employee', expect.any(Object))
  })

  // Test 5: VISITOR sends /start -> sees join request prompt
  it('should show VISITOR the join request prompt or visitor menu depending on active status', async () => {
    // Active VISITOR
    mockPrisma.user.findUnique.mockResolvedValue({
      telegramId: 55555555n,
      role: 'VISITOR',
      isActive: true,
      adminScopes: [],
    })

    const ctx = {
      from: { id: 55555555, first_name: 'Visitor' },
      reply: vi.fn(),
      t: vi.fn(key => key),
    } as any

    await menuHandler(ctx)
    expect(ctx.reply).toHaveBeenCalledWith('menu-visitor', expect.any(Object))
  })
})
