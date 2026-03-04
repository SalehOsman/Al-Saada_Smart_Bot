import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sectionService } from '../../src/services/sections'
import logger from '../../src/utils/logger'

// ─── Mocks ──────────────────────────────────────────────────────────────
const { mockPrisma } = vi.hoisted(() => ({
  mockPrisma: {
    section: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

vi.mock('../../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../../src/utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
    debug: vi.fn(),
  },
}))

describe('Section Service Integration (T040)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('create section', () => {
    it('(1) should create a main section', async () => {
      const params = {
        slug: 'main-sec',
        name: 'قسم رئيسي',
        nameEn: 'Main Section',
        icon: '📁',
        createdBy: 12345678n,
      }

      mockPrisma.section.create.mockResolvedValue({ id: 's1', ...params, parentId: null })

      const result = await sectionService.create(params)

      expect(mockPrisma.section.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          slug: 'main-sec',
          parentId: undefined,
        }),
      })
      expect(result.id).toBe('s1')
    })

    it('(2) should create a sub-section under main section', async () => {
      // Mock parent section lookup (must be a main section)
      mockPrisma.section.findUnique.mockResolvedValue({ id: 'parent-id', parentId: null })
      
      const params = {
        slug: 'sub-sec',
        name: 'قسم فرعي',
        nameEn: 'Sub Section',
        icon: '📄',
        parentId: 'parent-id',
        createdBy: 12345678n,
      }

      mockPrisma.section.create.mockResolvedValue({ id: 's2', ...params })

      const result = await sectionService.create(params)

      expect(mockPrisma.section.findUnique).toHaveBeenCalledWith({
        where: { id: 'parent-id' },
        select: { parentId: true },
      })
      expect(mockPrisma.section.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          parentId: 'parent-id',
        }),
      })
      expect(result.parentId).toBe('parent-id')
    })

    it('(3) should reject 3rd level creation (sub-section as parent)', async () => {
      // Mock parent section lookup (already has a parent, so it's a sub-section)
      mockPrisma.section.findUnique.mockResolvedValue({ id: 'sub-id', parentId: 'grandparent-id' })

      const params = {
        slug: 'level3-sec',
        name: 'مستوى ثالث',
        nameEn: 'Level 3',
        icon: '❌',
        parentId: 'sub-id',
        createdBy: 12345678n,
      }

      await expect(sectionService.create(params)).rejects.toThrow('Cannot create 3rd level section')
      expect(mockPrisma.section.create).not.toHaveBeenCalled()
    })
  })

  describe('delete section', () => {
    it('(4) should delete standalone empty section (success)', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 's1',
        modules: [],
        children: [],
      })

      await sectionService.delete('s1')

      expect(mockPrisma.section.delete).toHaveBeenCalledWith({
        where: { id: 's1' },
      })
    })

    it('(5) should fail to delete section with active modules', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 's1',
        modules: [{ id: 'm1', isActive: true }],
        children: [],
      })

      await expect(sectionService.delete('s1')).rejects.toThrow('Cannot delete section with active modules')
      expect(mockPrisma.section.delete).not.toHaveBeenCalled()
    })

    it('(6) should delete main section (cascade handled by DB, but service checks modules first)', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 'main-id',
        modules: [],
        children: [
          { id: 'sub-id', modules: [] },
        ],
      })

      await sectionService.delete('main-id')

      expect(mockPrisma.section.delete).toHaveBeenCalledWith({
        where: { id: 'main-id' },
      })
    })

    it('(7) should block main section deletion if sub-section has active modules', async () => {
      mockPrisma.section.findUnique.mockResolvedValue({
        id: 'main-id',
        modules: [],
        children: [
          { 
            id: 'sub-id', 
            modules: [{ id: 'm1', isActive: true }] 
          },
        ],
      })

      await expect(sectionService.delete('main-id')).rejects.toThrow('Cannot delete main section with sub-sections that have active modules')
      expect(mockPrisma.section.delete).not.toHaveBeenCalled()
    })
  })
})
