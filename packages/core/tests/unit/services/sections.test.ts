import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { sectionService } from '../../../src/services/sections'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma, mockLogger } = vi.hoisted(() => ({
  mockPrisma: {
    section: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
  mockLogger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

vi.mock('../../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../../src/utils/logger', () => ({ default: mockLogger }))

describe('sectionService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('getMainSections', () => {
    it('should return main sections', async () => {
      mockPrisma.section.findMany.mockResolvedValue([{ id: 's1', parentId: null }])
      const result = await sectionService.getMainSections()
      expect(result).toHaveLength(1)
      expect(mockPrisma.section.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { parentId: null, isActive: true },
      }))
    })
  })

  describe('create', () => {
    const baseParams = {
      slug: 'test-section',
      name: 'Test Section',
      nameEn: 'Test Section EN',
      icon: '📁',
      createdBy: 12345n,
    }

    it('should create a main section', async () => {
      mockPrisma.section.create.mockResolvedValue({ id: 's1', ...baseParams, parentId: null })
      const result = await sectionService.create(baseParams)
      expect(result.id).toBe('s1')
      expect(mockPrisma.section.create).toHaveBeenCalled()
    })

    it('should create a sub-section if parent is a main section', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ id: 'parent1', parentId: null })
      mockPrisma.section.create.mockResolvedValue({ id: 'sub1', ...baseParams, parentId: 'parent1' })
      
      const result = await sectionService.create({ ...baseParams, parentId: 'parent1' })
      
      expect(result.parentId).toBe('parent1')
      expect(mockPrisma.section.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent1' },
        select: { parentId: true },
      })
    })

    it('should throw if parent section not found', async () => {
      mockPrisma.section.findUnique.mockResolvedValue(null)
      await expect(sectionService.create({ ...baseParams, parentId: 'invalid' }))
        .rejects.toThrow('Parent section not found')
    })

    it('should throw if parent is already a sub-section (max 2 levels)', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ id: 'sub1', parentId: 'root' })
      await expect(sectionService.create({ ...baseParams, parentId: 'sub1' }))
        .rejects.toThrow('Cannot create 3rd level section')
    })
  })

  describe('update', () => {
    it('should throw if setting itself as parent', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ id: 's1', parentId: null })
      await expect(sectionService.update({ id: 's1', parentId: 's1' }))
        .rejects.toThrow('Cannot set section as its own parent')
    })

    it('should throw if parent is a sub-section', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ id: 'sub1', parentId: 'root' })
      await expect(sectionService.update({ id: 's1', parentId: 'sub1' }))
        .rejects.toThrow('Cannot reparent to sub-section (max 2 levels)')
    })

    it('should throw if setting a descendant as parent', async () => {
      mockPrisma.section.findUnique.mockResolvedValueOnce({ id: 'p1', parentId: null }) // parent check
      // mock isDescendant return true
      vi.spyOn(sectionService, 'isDescendant').mockResolvedValue(true)
      
      await expect(sectionService.update({ id: 's1', parentId: 'p1' }))
        .rejects.toThrow('Cannot set descendant as parent')
    })
  })

  describe('delete', () => {
    it('should throw if section not found', async () => {
      mockPrisma.section.findUnique.mockResolvedValue(null)
      await expect(sectionService.delete('invalid')).rejects.toThrow('Section not found')
    })

    it('should throw if section has active modules', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 's1',
        modules: [{ id: 'm1' }],
        children: [],
      })
      await expect(sectionService.delete('s1')).rejects.toThrow('Cannot delete section with active modules')
    })

    it('should throw if a sub-section has active modules', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 's1',
        modules: [],
        children: [{ id: 'sub1', modules: [{ id: 'm2' }] }],
      })
      await expect(sectionService.delete('s1')).rejects.toThrow('Cannot delete main section with sub-sections that have active modules')
    })

    it('should delete if no active modules', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 's1',
        modules: [],
        children: [{ id: 'sub1', modules: [] }],
      })
      await sectionService.delete('s1')
      expect(mockPrisma.section.delete).toHaveBeenCalledWith({ where: { id: 's1' } })
    })
  })

  describe('isDescendant', () => {
    it('should return true if section is a direct child', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ parentId: 'ancestor' })
      const result = await sectionService.isDescendant('ancestor', 'child')
      expect(result).toBe(true)
    })

    it('should return true if section is a nested child', async () => {
      mockPrisma.section.findUnique
        .mockResolvedValueOnce({ parentId: 'mid' })
        .mockResolvedValueOnce({ parentId: 'ancestor' })
      
      const result = await sectionService.isDescendant('ancestor', 'child')
      expect(result).toBe(true)
    })

    it('should return false if no relation', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({ parentId: null })
      const result = await sectionService.isDescendant('other', 'child')
      expect(result).toBe(false)
    })
  })

  describe('getActiveModules', () => {
    it('should collect modules from sub-sections for main sections', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 'main1',
        parentId: null,
        modules: [{ id: 'm1', orderIndex: 10 }],
        children: [
          {
            isActive: true,
            modules: [{ id: 'm2', orderIndex: 5 }],
          }
        ],
      })

      const result = await sectionService.getActiveModules('main1')
      expect(result).toHaveLength(2)
      expect(result[0].id).toBe('m2') // orderIndex 5 before 10
      expect(result[1].id).toBe('m1')
    })

    it('should only collect direct modules for sub-sections', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 'sub1',
        parentId: 'main1',
        modules: [{ id: 'm1' }],
        children: [],
      })

      const result = await sectionService.getActiveModules('sub1')
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('m1')
    })
  })
})
