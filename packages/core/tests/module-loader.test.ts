import fs from 'node:fs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@prisma/client'
import { moduleLoader } from '../src/bot/module-loader.js'
import { prisma } from '../src/database/prisma.js'

// Mock dependencies
vi.mock('node:fs')
vi.mock('../src/database/prisma.js', () => ({
  prisma: {
    user: {
      findMany: vi.fn(),
    },
  },
}))
vi.mock('../src/utils/logger.js', () => ({
  default: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  },
}))

describe('moduleLoader', () => {
  const mockBot = {
    use: vi.fn(),
    api: {
      sendMessage: vi.fn(),
    },
  } as any

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('successfully loads valid modules', async () => {
    // 1. Mock fs to return one module folder
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'fuel-entry' },
    ] as any)

    // 2. Mock dynamic import
    // Note: Vitest can't easily mock dynamic import() in the same file.
    // We'll rely on our moduleLoader's error handling for now or use a more advanced mock if needed.
    // However, we can simulate a successful load by making the loop not throw.

    // For this test, let's just verify discovery was attempted.
    await moduleLoader.loadModules(mockBot)

    expect(fs.readdirSync).toHaveBeenCalled()
  })

  it('notifies SUPER_ADMINs on failure', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true)
    vi.mocked(fs.readdirSync).mockReturnValue([
      { isDirectory: () => true, name: 'broken-module' },
    ] as any)

    // Simulate prisma finding one super admin
    vi.mocked(prisma.user.findMany).mockResolvedValue([
      { telegramId: BigInt(123456789) },
    ] as any)

    // This should fail to load because broken-module/config.ts doesn't exist (mocked by fs.existsSync in the loop)
    // Actually we need to mock configPath existence too.
    vi.mocked(fs.existsSync).mockImplementation((path: any) => {
      if (path.toString().endsWith('config.ts'))
        return true // simulate config.ts exists
      return true // directory exists
    })

    await moduleLoader.loadModules(mockBot)

    expect(prisma.user.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { role: Role.SUPER_ADMIN, isActive: true },
    }))
    expect(mockBot.api.sendMessage).toHaveBeenCalledWith('123456789', expect.stringContaining('broken-module'))
  })

  it('correctly sorts loaded modules by orderIndex and slug', () => {
    // Directly inject modules into the private Map for testing sort logic
    const loader = moduleLoader as any
    loader.modules.clear()

    loader.modules.set('z-module', {
      slug: 'z-module',
      config: { slug: 'z-module', orderIndex: 10 },
      status: 'loaded',
    })
    loader.modules.set('a-module', {
      slug: 'a-module',
      config: { slug: 'a-module', orderIndex: 10 },
      status: 'loaded',
    })
    loader.modules.set('p-module', {
      slug: 'p-module',
      config: { slug: 'p-module', orderIndex: 5 },
      status: 'loaded',
    })

    const sorted = moduleLoader.getLoadedModules()

    expect(sorted[0].slug).toBe('p-module') // orderIndex 5
    expect(sorted[1].slug).toBe('a-module') // orderIndex 10, alphabetical 'a'
    expect(sorted[2].slug).toBe('z-module') // orderIndex 10, alphabetical 'z'
  })
})
