import { describe, expect, it, vi } from 'vitest'
import { sectionService } from '../../../src/services/sections'
import { prisma } from '../../../src/database/prisma'

vi.mock('../../../src/database/prisma', () => ({
  prisma: {
    section: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  },
}))

describe('sectionService Navigation', () => {
  it('getMainSections should fetch sections with parentId: null', async () => {
    const mockSections = [{ id: '1', name: 'Main', parentId: null }]
    vi.mocked(prisma.section.findMany).mockResolvedValue(mockSections as any)

    const result = await sectionService.getMainSections()

    expect(prisma.section.findMany).toHaveBeenCalledWith({
      where: { parentId: null, isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: { children: true },
    })
    expect(result).toEqual(mockSections)
  })

  it('getSubSections should fetch sections with given parentId', async () => {
    const parentId = 'main-id'
    const mockSubSections = [{ id: '2', name: 'Sub', parentId }]
    vi.mocked(prisma.section.findMany).mockResolvedValue(mockSubSections as any)

    const result = await sectionService.getSubSections(parentId)

    expect(prisma.section.findMany).toHaveBeenCalledWith({
      where: { parentId, isActive: true },
      orderBy: [{ orderIndex: 'asc' }, { name: 'asc' }],
      include: {
        modules: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' },
        },
      },
    })
    expect(result).toEqual(mockSubSections)
  })
})
