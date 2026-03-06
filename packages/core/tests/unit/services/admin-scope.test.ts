import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { adminScopeService } from '../../../src/services/admin-scope'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger } = vi.hoisted(() => ({
  mockPrisma: {
    adminScope: {
      findMany: vi.fn(),
      upsert: vi.fn(),
      delete: vi.fn(),
    },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/utils/logger', () => ({ default: mockLogger }))

describe('adminScopeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getScopes', () => {
    it('should return all scopes for a user', async () => {
      const mockScopes = [
        { id: 's1', userId: 12345n, sectionId: 'sect1', moduleId: 'mod1' },
        { id: 's2', userId: 12345n, sectionId: 'sect2', moduleId: 'none' },
      ]
      mockPrisma.adminScope.findMany.mockResolvedValue(mockScopes)

      const result = await adminScopeService.getScopes(12345n)

      expect(result).toEqual(mockScopes)
      expect(mockPrisma.adminScope.findMany).toHaveBeenCalledWith({
        where: { userId: 12345n },
        include: {
          section: true,
          module: true,
        },
      })
    })
  })

  describe('assignScope', () => {
    it('should assign a scope using upsert', async () => {
      const params = {
        userId: 12345n,
        sectionId: 'sect1',
        moduleId: 'mod1',
        createdBy: 99999n,
      }
      mockPrisma.adminScope.upsert.mockResolvedValue({ id: 's1', ...params })

      const result = await adminScopeService.assignScope(params)

      expect(result.id).toBe('s1')
      expect(mockPrisma.adminScope.upsert).toHaveBeenCalledWith({
        where: {
          userId_sectionId_moduleId: {
            userId: params.userId,
            sectionId: params.sectionId,
            moduleId: 'mod1',
          },
        },
        update: {},
        create: {
          userId: params.userId,
          sectionId: params.sectionId,
          moduleId: 'mod1',
          createdBy: params.createdBy,
        },
      })
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should use "none" as default moduleId in upsert where clause', async () => {
      const params = {
        userId: 12345n,
        sectionId: 'sect1',
        createdBy: 99999n,
      }
      mockPrisma.adminScope.upsert.mockResolvedValue({ id: 's1', ...params, moduleId: 'none' })

      await adminScopeService.assignScope(params)

      expect(mockPrisma.adminScope.upsert).toHaveBeenCalledWith(expect.objectContaining({
        where: {
          userId_sectionId_moduleId: {
            userId: params.userId,
            sectionId: params.sectionId,
            moduleId: 'none',
          },
        },
      }))
    })
  })

  describe('revokeScope', () => {
    it('should delete a scope', async () => {
      const params = {
        userId: 12345n,
        sectionId: 'sect1',
        moduleId: 'mod1',
      }
      mockPrisma.adminScope.delete.mockResolvedValue({})

      await adminScopeService.revokeScope(params)

      expect(mockPrisma.adminScope.delete).toHaveBeenCalledWith({
        where: {
          userId_sectionId_moduleId: {
            userId: params.userId,
            sectionId: params.sectionId,
            moduleId: 'mod1',
          },
        },
      })
      expect(mockLogger.info).toHaveBeenCalled()
    })

    it('should use "none" as default moduleId in delete where clause', async () => {
      const params = {
        userId: 12345n,
        sectionId: 'sect1',
      }
      mockPrisma.adminScope.delete.mockResolvedValue({})

      await adminScopeService.revokeScope(params)

      expect(mockPrisma.adminScope.delete).toHaveBeenCalledWith({
        where: {
          userId_sectionId_moduleId: {
            userId: params.userId,
            sectionId: params.sectionId,
            moduleId: 'none',
          },
        },
      })
    })
  })
})
