import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Role } from '@prisma/client'
import { rbacService } from '../src/services/rbac'
import { adminScopeService } from '../src/services/admin-scope'

// Mock dependencies
const { mockPrisma, mockRedis } = vi.hoisted(() => ({
  mockPrisma: {
    section: { findUnique: vi.fn(), delete: vi.fn() },
    adminScope: { findMany: vi.fn() },
  },
  mockRedis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
  },
}))

vi.mock('../src/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('../src/cache/redis', () => ({ redis: mockRedis }))
vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('rBAC Scope Integration (FR-037)', () => {
  const userId = BigInt(12345)

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('admin with main section scope can access all descendant sub-sections and modules', async () => {
    const mainSectionId = 'main-1'
    const subSectionId = 'sub-1'
    const moduleId = 'mod-1'

    // Mock scopes: admin has scope for main-1
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([
      { sectionId: mainSectionId, moduleId: null } as any,
    ])

    // Hierarchy: sub-1 parent is main-1
    mockPrisma.section.findUnique.mockResolvedValue({ id: subSectionId, parentId: mainSectionId })

    // Test sub-section access
    expect(await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSectionId })).toBe(true)

    // Test module access within sub-section
    expect(await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSectionId, moduleId })).toBe(true)
  })

  it('admin with sub-section scope CANNOT access parent main section or sibling sub-sections', async () => {
    const mainSectionId = 'main-1'
    const subSection1Id = 'sub-1'
    const subSection2Id = 'sub-2'

    // Mock scopes: admin has scope for sub-1 only
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([
      { sectionId: subSection1Id, moduleId: null } as any,
    ])

    // Test parent access
    mockPrisma.section.findUnique.mockResolvedValue({ id: mainSectionId, parentId: null })
    expect(await rbacService.canAccess(userId, Role.ADMIN, { sectionId: mainSectionId })).toBe(false)

    // Test sibling access
    mockPrisma.section.findUnique.mockResolvedValue({ id: subSection2Id, parentId: mainSectionId })
    expect(await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSection2Id })).toBe(false)
  })

  it('after section delete (cascade), admin loses access to deleted section', async () => {
    const sectionId = 'deleted-sec'

    // When section is deleted, its scopes are removed (cascade)
    // So getScopes returns empty
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([])

    // Prisma lookup might still return null or the section if not yet synced,
    // but without scope, access is denied
    mockPrisma.section.findUnique.mockResolvedValue(null)

    const result = await rbacService.canAccess(userId, Role.ADMIN, { sectionId })
    expect(result).toBe(false)
  })
})
