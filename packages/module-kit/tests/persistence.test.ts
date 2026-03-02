import { describe, it, expect, vi, beforeEach } from 'vitest';
import { save } from '../src/persistence.js';
import { AuditAction } from '@prisma/client';

// Mock dependencies
const { mockPrisma, mockAuditService, mockQueueNotification, mockRedis } = vi.hoisted(() => ({
  mockPrisma: {
    section: { findUnique: vi.fn() },
    module: { findUnique: vi.fn() },
    adminScope: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn((cb) => cb(mockPrisma)),
  },
  mockAuditService: { log: vi.fn() },
  mockQueueNotification: vi.fn(),
  mockRedis: { del: vi.fn() },
}));

vi.mock('@core/database/prisma', () => ({ prisma: mockPrisma }));
vi.mock('@core/services/audit-logs', () => ({ auditService: mockAuditService }));
vi.mock('@core/services/notifications', () => ({ queueNotification: mockQueueNotification }));
vi.mock('@core/cache/redis', () => ({ redis: mockRedis }));
vi.mock('@core/bot/module-loader', () => ({
  moduleLoader: {
    getModule: vi.fn((slug) => ({
      config: { sectionSlug: 'operations' }
    }))
  }
}));

describe('save() helper', () => {
  const mockCtx = {
    from: { id: 12345678 },
    t: vi.fn((key: string) => key),
    reply: vi.fn(),
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('saves data, logs audit (masked), notifies admins (unmasked), and clears draft', async () => {
    const action = vi.fn().mockResolvedValue({ id: 'new-id' });
    
    // Mock resolution chain
    mockPrisma.section.findUnique.mockResolvedValue({ id: 'sec-1' });
    mockPrisma.module.findUnique.mockResolvedValue({ id: 'mod-1' });
    mockPrisma.adminScope.findMany.mockResolvedValue([
      { userId: 111n },
      { userId: 222n }
    ]);
    mockPrisma.user.findMany.mockResolvedValue([
      { telegramId: 333n } // Super admin
    ]);

    await save(mockCtx, {
      moduleSlug: 'fuel-entry',
      action,
      audit: {
        action: AuditAction.MODULE_CREATE,
        targetType: 'FuelEntry',
        details: { phone: '01012345678', amount: 100 }
      }
    });

    // 1. Verify action called
    expect(action).toHaveBeenCalled();

    // 2. Verify audit logged with MASKED data
    expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: AuditAction.MODULE_CREATE,
      details: expect.objectContaining({
        phone: expect.stringContaining('*******'),
        amount: 100
      })
    }));

    // 3. Verify notifications sent with UNMASKED data to all admins
    // (Total 3 admins: 2 from scope + 1 super admin)
    expect(mockQueueNotification).toHaveBeenCalledTimes(3);
    expect(mockQueueNotification).toHaveBeenCalledWith(expect.objectContaining({
      params: expect.objectContaining({
        phone: '01012345678' // UNMASKED
      })
    }));

    // 4. Verify draft cleared
    expect(mockRedis.del).toHaveBeenCalledWith(`draft:12345678:fuel-entry`);
  });

  it('preserves draft on failure and notifies user', async () => {
    const action = vi.fn().mockRejectedValue(new Error('DB Error'));

    await expect(save(mockCtx, {
      moduleSlug: 'fuel-entry',
      action,
      audit: {
        action: AuditAction.MODULE_CREATE,
        targetType: 'FuelEntry'
      }
    })).rejects.toThrow('DB Error');

    expect(mockRedis.del).not.toHaveBeenCalled();
    expect(mockCtx.reply).toHaveBeenCalledWith('module-kit-save-failed');
  });
});
