import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { rbacService } from '../../../src/services/rbac'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockRedis, mockSectionService, mockAdminScopeService, mockModuleLoader, mockPrisma } = vi.hoisted(() => ({
  mockRedis: { get: vi.fn(), setex: vi.fn() },
  mockSectionService: { getAncestors: vi.fn() },
  mockAdminScopeService: { getScopes: vi.fn() },
  mockModuleLoader: { getModule: vi.fn() },
  mockPrisma: { section: { findUnique: vi.fn() } },
}))

vi.mock('../../../src/cache/redis', () => ({ redis: mockRedis }))
vi.mock('../../../src/services/sections', () => ({ sectionService: mockSectionService }))
vi.mock('../../../src/services/admin-scope', () => ({ adminScopeService: mockAdminScopeService }))
vi.mock('../../../src/bot/module-loader', () => ({ moduleLoader: mockModuleLoader }))
vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))

describe('rbacService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getSectionAncestry', () => {
    it('should return cached ancestors if available', async () => {
      mockRedis.get.mockResolvedValue(JSON.stringify(['a1', 'a2']))
      const result = await rbacService.getSectionAncestry('s1')
      expect(result).toEqual(['a1', 'a2'])
      expect(mockSectionService.getAncestors).not.toHaveBeenCalled()
    })

    it('should fetch and cache ancestors if not in redis', async () => {
      mockRedis.get.mockResolvedValue(null)
      mockSectionService.getAncestors.mockResolvedValue(['a1'])
      
      const result = await rbacService.getSectionAncestry('s1')
      
      expect(result).toEqual(['a1'])
      expect(mockRedis.setex).toHaveBeenCalledWith('section:ancestry:s1', 86400, JSON.stringify(['a1']))
    })
  })

  describe('canAccess', () => {
    it('should allow SUPER_ADMIN full access', async () => {
      const result = await rbacService.canAccess(1n, 'SUPER_ADMIN')
      expect(result).toBe(true)
    })

    it('should deny VISITOR basic access', async () => {
      const result = await rbacService.canAccess(1n, 'VISITOR')
      expect(result).toBe(false)
    })

    it('should allow ADMIN/EMPLOYEE basic access (no specific resource)', async () => {
      expect(await rbacService.canAccess(1n, 'ADMIN')).toBe(true)
      expect(await rbacService.canAccess(1n, 'EMPLOYEE')).toBe(true)
    })

    describe('ADMIN scoped access', () => {
      it('should allow access if user has direct section scope', async () => {
        mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 'sect1', moduleId: null }])
        mockRedis.get.mockResolvedValue(JSON.stringify([])) // no ancestors

        const result = await rbacService.canAccess(1n, 'ADMIN', { sectionId: 'sect1' })
        expect(result).toBe(true)
      })

      it('should allow access if user has ancestor section scope', async () => {
        mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 'root', moduleId: null }])
        mockRedis.get.mockResolvedValue(JSON.stringify(['root'])) // root is ancestor of sect1

        const result = await rbacService.canAccess(1n, 'ADMIN', { sectionId: 'sect1' })
        expect(result).toBe(true)
      })

      it('should allow module access if user has section-wide scope', async () => {
        mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 'sect1', moduleId: null }])
        mockRedis.get.mockResolvedValue(JSON.stringify([]))

        const result = await rbacService.canAccess(1n, 'ADMIN', { sectionId: 'sect1', moduleId: 'mod1' })
        expect(result).toBe(true)
      })

      it('should deny access if user has scope for different section', async () => {
        mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 'other', moduleId: null }])
        mockRedis.get.mockResolvedValue(JSON.stringify(['root']))

        const result = await rbacService.canAccess(1n, 'ADMIN', { sectionId: 'sect1' })
        expect(result).toBe(false)
      })
    })
  })

  describe('canPerformAction', () => {
    it('should allow if role is in allowed roles', async () => {
      mockModuleLoader.getModule.mockReturnValue({
        config: { permissions: { view: ['EMPLOYEE'] } }
      })
      const result = await rbacService.canPerformAction(1n, 'EMPLOYEE', 'mod1', 'view')
      expect(result).toBe(true)
    })

    it('should deny if role is not in allowed roles', async () => {
      mockModuleLoader.getModule.mockReturnValue({
        config: { permissions: { delete: ['SUPER_ADMIN'] } }
      })
      const result = await rbacService.canPerformAction(1n, 'ADMIN', 'mod1', 'delete')
      expect(result).toBe(false)
    })

    it('should check ADMIN scope for allowed actions', async () => {
      mockModuleLoader.getModule.mockReturnValue({
        config: { sectionSlug: 'sect-slug', permissions: { view: ['ADMIN'] } }
      })
      mockPrisma.section.findUnique.mockResolvedValue({ id: 's1' })
      mockRedis.get.mockResolvedValue(JSON.stringify([]))
      mockAdminScopeService.getScopes.mockResolvedValue([{ sectionId: 's1', moduleId: null }])

      const result = await rbacService.canPerformAction(1n, 'ADMIN', 'mod1', 'view')
      expect(result).toBe(true)
    })
  })
})
