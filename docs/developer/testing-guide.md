# Testing Guide & Patterns

**Last Updated:** 2026-03-03

The Al-Saada Smart Bot relies on **Vitest** for all testing requirements. Tests are colocated within their respective feature workspaces under a corresponding `tests/` directory (e.g., `packages/module-kit/tests/`, `packages/validators/tests/`).

This guide details exactly how testing is implemented, focusing specifically on mocking strategies for the Telegram Bot API and Prisma databases.

---

## 1. Test Environment & Framework

- **Framework:** Vitest (`vitest`)
- **Execution:** Run globally via `npm test` from the root, or `pnpm --filter <workspace> test`.
- **Target Coverage:** System modules mandate 80%+ test coverage.

### Key Workspaces
- `packages/validators`: Validates standalone pure-logic schema bounds.
- `packages/module-kit`: Tests complex conversational routing, Database side-effects, Redis state caching, and context mutations.

---

## 2. Testing Validators (Pure Logic)
Validators like Egyptian National IDs, Phones, and string stripping are natively stateless and pure, mostly reliant on Zod. 

**Example: Zod Schema Tests (`schemas.test.ts`)**
```typescript
import { describe, expect, it } from 'vitest'
import { phoneSchema } from '../src/schemas'

describe('phoneSchema', () => {
  it('should validate Egyptian phone numbers', () => {
    expect(phoneSchema.parse('01012345678')).toBe('01012345678')
    // Zod strips and trims silently
    expect(phoneSchema.parse('  01112345678  ')).toBe('01112345678')
  })

  it('should reject invalid phone numbers', () => {
    expect(() => phoneSchema.parse('12345678901')).toThrow()
    expect(() => phoneSchema.parse('0121234567')).toThrow() // too short
  })
})
```

---

## 3. Mocking Telegram Context (Conversations)

When testing conversational logic inside `@grammyjs/conversations`, we do not instantiate a real bot. Instead, we mock the specific properties of the `Context` and `Conversation` objects that the feature consumes.

**Example: Testing Interactive UI Logic (`confirmation.test.ts`)**
In this example we mock `ctx.reply` to spy on rendering, and force `conversation.waitForCallbackQuery` to simulate user button clicks.

```typescript
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { confirm } from '../src/confirmation.js'

describe('confirm() helper', () => {
  const mockCtx = {
    t: vi.fn((key: string) => key),
    reply: vi.fn(),
  } as any

  const mockConversation = {
    waitForCallbackQuery: vi.fn(),
  } as any

  beforeEach(() => {
    vi.clearAllMocks() // Clear tracking before each test
  })

  it('returns false on cancel', async () => {
    // 1. Simulate the user clicking the "cancel" inline keyboard button
    mockConversation.waitForCallbackQuery.mockResolvedValue({
      data: 'cancel',
      match: 'cancel',
      answerCallbackQuery: vi.fn(),
    })

    // 2. Fire the execution
    const result = await confirm(mockConversation, mockCtx, {
      data: { amount: 100 },
      labels: { amount: 'label' },
      editableFields: ['amount'],
      reAsk: vi.fn(),
    })

    // 3. Verify the state returned exactly false
    expect(result).toBe(false)
  })
})
```

---

## 4. Mocking Deep Systems (Database/Audit/Redis)

When testing persistence logic (`packages/module-kit/src/persistence.ts`), we often execute transactional chains logging audits, dispatching Telegram notifications, modifying databases, and clearing draft caches.

**Golden Rule:** Vitest `vi.hoisted()` must be utilized to prepare mock objects **before** `vi.mock()` is evaluated, ensuring scope containment.

**Example: Testing Database/Logging Side-Effects (`persistence.test.ts`)**
```typescript
import { AuditAction } from '@prisma/client'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { save } from '../src/persistence.js'

// 1. Hoist Mock Definitions structurally
const { mockPrisma, mockAuditService, mockQueueNotification, mockRedis } = vi.hoisted(() => ({
  mockPrisma: {
    section: { findUnique: vi.fn() },
    module: { findUnique: vi.fn() },
    adminScope: { findMany: vi.fn() },
    user: { findMany: vi.fn() },
    $transaction: vi.fn(cb => cb(mockPrisma)),
  },
  mockAuditService: { log: vi.fn() },
  mockQueueNotification: vi.fn(),
  mockRedis: { del: vi.fn() },
}))

// 2. Override alias imports structurally
vi.mock('@core/database/prisma', () => ({ prisma: mockPrisma }))
vi.mock('@core/services/audit-logs', () => ({ auditService: mockAuditService }))
vi.mock('@core/services/notifications', () => ({ queueNotification: mockQueueNotification }))
vi.mock('@core/cache/redis', () => ({ redis: mockRedis }))

describe('save() helper', () => {
  it('saves data, logs masked audit, and clears draft', async () => {
    const action = vi.fn().mockResolvedValue({ id: 'new-id' })
    
    // Arrange: Resolve internal data lookups
    mockPrisma.section.findUnique.mockResolvedValue({ id: 'sec-1' })
    mockPrisma.adminScope.findMany.mockResolvedValue([{ userId: 111n }])
    mockPrisma.user.findMany.mockResolvedValue([{ telegramId: 333n }])

    // Act
    await save({ from: { id: 12345678 }, reply: vi.fn(), t: vi.fn() } as any, {
      moduleSlug: 'fuel-entry',
      action,
      audit: { action: AuditAction.MODULE_CREATE, targetType: 'FuelEntry', details: { phone: '01012345678' } }
    })

    // Assert: Execution triggered successfully
    expect(action).toHaveBeenCalled()
    // Assert: Sensitives were masked prior to DB Audit logging
    expect(mockAuditService.log).toHaveBeenCalledWith(expect.objectContaining({
      details: expect.objectContaining({ phone: expect.stringContaining('*******') })
    }))
    // Assert: The user's temporary state was pruned
    expect(mockRedis.del).toHaveBeenCalledWith(`draft:12345678:fuel-entry`)
  })
})
```

---

## 5. Integration Test Status 

- **Current Coverage Matrix**: The system currently heavily biases towards Unit Tests masking dependencies.
- **Database Bootstraps**: Full isolated End-to-End integration tests operating on shadow databases via `docker-compose.test.yml` are marked for configuration under the Phase 12 constitutional alignment.
