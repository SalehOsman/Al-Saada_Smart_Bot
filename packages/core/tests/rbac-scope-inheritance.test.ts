import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Role } from '@prisma/client';
import { rbacService } from '../src/services/rbac';
import { adminScopeService } from '../src/services/admin-scope';

// Mock dependencies
const { mockPrisma, mockRedis } = vi.hoisted(() => ({
  mockPrisma: {
    section: { findUnique: vi.fn() },
    adminScope: { findMany: vi.fn() },
  },
  mockRedis: {
    get: vi.fn().mockResolvedValue(null),
    setex: vi.fn().mockResolvedValue('OK'),
  },
}));

vi.mock('../src/database/prisma', () => ({ prisma: mockPrisma }));
vi.mock('../src/cache/redis', () => ({ redis: mockRedis }));
vi.mock('../src/utils/logger', () => ({
  default: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

describe('RBAC Scope Inheritance (FR-037)', () => {
  const userId = BigInt(12345);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('T084-D-1: admin with main section scope → canAccess(userId, subSectionId) returns true', async () => {
    const mainSectionId = 'main-1';
    const subSectionId = 'sub-1';

    // Mock scopes: admin has scope for main-1
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([
      { sectionId: mainSectionId, moduleId: null } as any
    ]);

    // Mock prisma for hierarchy: sub-1 parent is main-1
    mockPrisma.section.findUnique.mockResolvedValue({
      id: subSectionId,
      parentId: mainSectionId
    });

    const result = await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSectionId });
    expect(result).toBe(true);
  });

  it('T084-D-2: admin with sub-section scope → canAccess(userId, subSectionId) returns true', async () => {
    const subSectionId = 'sub-1';

    // Mock scopes: admin has scope for sub-1
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([
      { sectionId: subSectionId, moduleId: null } as any
    ]);

    // Mock prisma for hierarchy (not strictly needed here but good practice)
    mockPrisma.section.findUnique.mockResolvedValue({
      id: subSectionId,
      parentId: 'main-1'
    });

    const result = await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSectionId });
    expect(result).toBe(true);
  });

  it('T084-D-3: admin with sub-section scope → canAccess(userId, mainSectionId) returns false', async () => {
    const mainSectionId = 'main-1';
    const subSectionId = 'sub-1';

    // Mock scopes: admin has scope for sub-1
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([
      { sectionId: subSectionId, moduleId: null } as any
    ]);

    // Mock prisma for hierarchy: main-1 has no parent
    mockPrisma.section.findUnique.mockResolvedValue({
      id: mainSectionId,
      parentId: null
    });

    const result = await rbacService.canAccess(userId, Role.ADMIN, { sectionId: mainSectionId });
    expect(result).toBe(false);
  });

  it('T084-D-4: admin with sub-section scope → canAccess(userId, otherSubSectionId) returns false', async () => {
    const subSection1Id = 'sub-1';
    const subSection2Id = 'sub-2';

    // Mock scopes: admin has scope for sub-1
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([
      { sectionId: subSection1Id, moduleId: null } as any
    ]);

    // Mock prisma for hierarchy: sub-2 parent is main-1
    mockPrisma.section.findUnique.mockResolvedValue({
      id: subSection2Id,
      parentId: 'main-1'
    });

    const result = await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSection2Id });
    expect(result).toBe(false);
  });

  it('T084-D-5: scopes are additive — main + sub = union (no conflicts)', async () => {
    const mainSectionId = 'main-1';
    const subSection1Id = 'sub-1';
    const subSection2Id = 'sub-2';

    // Mock scopes: admin has scope for main-1 AND sub-2
    vi.spyOn(adminScopeService, 'getScopes').mockResolvedValue([
      { sectionId: mainSectionId, moduleId: null },
      { sectionId: subSection2Id, moduleId: null }
    ] as any);

    // Test access to sub-1 (inherited from main-1)
    mockPrisma.section.findUnique.mockResolvedValue({ id: subSection1Id, parentId: mainSectionId });
    expect(await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSection1Id })).toBe(true);

    // Test access to sub-2 (direct scope)
    mockPrisma.section.findUnique.mockResolvedValue({ id: subSection2Id, parentId: mainSectionId });
    expect(await rbacService.canAccess(userId, Role.ADMIN, { sectionId: subSection2Id })).toBe(true);
  });

  it('T084-D-6: SUPER_ADMIN bypasses all scope checks', async () => {
    const result = await rbacService.canAccess(userId, Role.SUPER_ADMIN, { sectionId: 'any' });
    expect(result).toBe(true);
  });
});
