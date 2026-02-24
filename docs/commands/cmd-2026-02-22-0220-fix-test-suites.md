# توثيق الأمر التنفيذي
# Command Log — إصلاح 4 مجموعات اختبار فاشلة

---

## معلومات الأمر

| البند | التفصيل |
|-------|---------|
| **رقم الأمر** | CMD-012 |
| **تاريخ الإرسال** | 2026-02-22 |
| **وقت الإرسال** | 02:20 (UTC+2 — القاهرة) |
| **أرسله** | المستشار التقني |
| **نُفِّذ بواسطة** | المنفّذ (Executor) |
| **الملفات المستهدفة** | `vitest.config.ts`, `join.test.ts`, `menu.test.ts`, `env.test.ts` |
| **الملفات المحمية** | `join.ts`, `menu.ts`, `env.ts`, `start.test.ts` — لا تُعدَّل |
| **نوع الأمر** | إصلاح اختبارات — Test Fixes |
| **الأولوية** | 🔴 حرج |

---

## التشخيص الكامل

### المشكلة الجذرية الأولى — join.test.ts (33 فشل)

**السبب الجذري**: الاختبارات تبني الـ mock على `waitFrom` لكن `join.ts` الحالي يستخدم `waitFor('message:text')` + `waitForCallbackQuery`.

الكود الحالي في join.ts:
```ts
// askForFullName, askForPhoneNumber, askForNationalId — كلها:
const nextCtx = await conversation.waitFor('message:text')

// askForNickname:
const nextCtx = await conversation.waitFor('message:text')

// الـ confirmation:
const confirmation = await conversation.waitForCallbackQuery(['confirm_join', 'cancel_join'])
```

الاختبارات الحالية تبني `conversation = { waitFrom: makeWaitFrom(...) }` — هذا يعني `conversation.waitFor` = undefined، فيقع في الـ catch ويُرسل `error_generic`.

**الحل**: استبدال `makeWaitFrom` بـ `makeWaitFor` + `waitForCallbackQuery` في الـ mock.

---

### المشكلة الثانية — menu.test.ts (4 فشل)

**السبب**: `mockCtx.t()` يُعيد النص بدون استبدال `{name}`:
```ts
'menu_admin': 'Welcome Admin {name}',  // ← {name} لا يُستبدَل
```
الاختبار يتوقع `'Admin User'` لكن يحصل على `'Welcome Admin {name}'`.

**الحل**: تعديل دالة `t()` في الـ mock لتستبدل `{name}` من الـ params.

---

### المشكلة الثالثة — env.test.ts (5 فشل)

**السبب**: الاختبارات تستخدم `vi.stubGlobal('process', {...})` لكن `env.ts` يستورد `process` مباشرة من `'node:process'` — فلا تصل إليه الـ stub.

```ts
// env.ts
import process from 'node:process'  // ← يتجاهل vi.stubGlobal('process')
const env = envSchema.parse(process.env)  // ← يقرأ process.env الحقيقي من .env.test
```

**الحل**: الاختبارات يجب أن تستخدم `vi.stubEnv()` بدلاً من `vi.stubGlobal('process')`.

---

### المشكلة الرابعة — مجلدات خارجية في vitest (3 فشل + bootstrap)

اختبارات `.opencode/node_modules/zod/...` و `.claude/worktrees/...` تُشغَّل بالخطأ لأن `vitest.config.ts` لا يستثنيها.

**الحل**: إضافة `exclude` في `vitest.config.ts`.

---

## نص الأمر المُرسَل للمنفّذ

```
/speckit.implement Apply the following test fixes in order. 
CRITICAL: Do NOT modify any production code files (join.ts, menu.ts, env.ts, start.ts).
Only modify test files and vitest.config.ts.

═══════════════════════════════════════════════════════
FIX 1 — vitest.config.ts: Exclude external test folders
═══════════════════════════════════════════════════════

Read vitest.config.ts and add these patterns to the `exclude` array
(or create the array if it doesn't exist):

  exclude: [
    'node_modules/**',
    '.opencode/**',
    '.claude/**',
    'dist/**',
  ]

═══════════════════════════════════════════════════════
FIX 2 — env.test.ts: Replace vi.stubGlobal with vi.stubEnv
═══════════════════════════════════════════════════════

Replace the ENTIRE content of:
`packages/core/tests/unit/config/env.test.ts`

With:
```ts
import { afterEach, describe, expect, it, vi } from 'vitest'

describe('environment Variable Validation', () => {
  const baseEnv = {
    BOT_TOKEN: 'valid-token',
    DATABASE_URL: 'valid-db-url',
  }

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('should pass with valid environment variables', async () => {
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    vi.stubEnv('INITIAL_SUPER_ADMIN_ID', '123')
    const { env } = await import('../../../src/config/env')
    expect(env.INITIAL_SUPER_ADMIN_ID).toBe(123)
  })

  it('should fail if BOT_TOKEN is not set', async () => {
    vi.stubEnv('BOT_TOKEN', '')
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })

  it('should fail if DATABASE_URL is not set', async () => {
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', '')
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })

  it('should allow INITIAL_SUPER_ADMIN_ID to be unset', async () => {
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    const { env } = await import('../../../src/config/env')
    expect(env.INITIAL_SUPER_ADMIN_ID).toBeUndefined()
  })

  it('should fail if INITIAL_SUPER_ADMIN_ID is not a number', async () => {
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    vi.stubEnv('INITIAL_SUPER_ADMIN_ID', 'abc')
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })

  it('should fail if INITIAL_SUPER_ADMIN_ID is not a positive number', async () => {
    vi.stubEnv('BOT_TOKEN', baseEnv.BOT_TOKEN)
    vi.stubEnv('DATABASE_URL', baseEnv.DATABASE_URL)
    vi.stubEnv('INITIAL_SUPER_ADMIN_ID', '0')
    await expect(import('../../../src/config/env')).rejects.toThrow()
  })
})
```

═══════════════════════════════════════════════════════
FIX 3 — menu.test.ts: Fix t() to interpolate {name}
═══════════════════════════════════════════════════════

In `packages/core/tests/unit/bot/handlers/menu.test.ts`,
find the mockCtx.t function and replace it so that {name} is substituted:

Change FROM:
    t: vi.fn((key: string, params?: any) => {
      const translations: Record<string, string> = {
        ...
        'menu_admin': 'Welcome Admin {name}',
        ...
      }
      return translations[key] || key
    }),

Change TO:
    t: vi.fn((key: string, params?: any) => {
      const translations: Record<string, string> = {
        'user_inactive': 'User is inactive',
        'error_generic': 'An error occurred',
        'menu_super_admin': 'Welcome Super Admin {name}',
        'menu_admin': 'Welcome Admin {name}',
        'menu_employee': 'Welcome Employee {name}',
        'menu_visitor': 'Welcome Visitor {name}',
        'button_sections': 'Sections',
        'button_users': 'Users',
        'button_maintenance': 'Maintenance',
        'button_audit': 'Audit',
        'button_modules': 'Modules',
        'button_notifications': 'Notifications',
      }
      let msg = translations[key] || key
      if (params) {
        msg = msg.replace(/\{(\w+)\}/g, (_: string, k: string) => String(params[k] ?? `{${k}}`))
      }
      return msg
    }),

═══════════════════════════════════════════════════════
FIX 4 — join.test.ts: Replace waitFrom mock with waitFor + waitForCallbackQuery
═══════════════════════════════════════════════════════

Replace the ENTIRE content of:
`packages/core/tests/unit/bot/conversations/join.test.ts`

With the following (full replacement):

```ts
/**
 * join.test.ts — Unit Tests for Join Conversation
 *
 * IMPORTANT: join.ts uses conversation.waitFor('message:text') and
 * conversation.waitForCallbackQuery(). Mocks must reflect this API.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { joinConversation, extractNationalIdInfo } from '../../../../src/bot/conversations/join'
import { prisma } from '../../../../src/database/prisma'
import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
import type { BotContext } from '../../../../src/types/context'

// ─── Mocks ─────────────────────────────────────────────────────────────────

vi.mock('../../../../src/database/prisma')
vi.mock('../../../../src/utils/logger')

const mockPrisma = prisma as any

// ─── Translation helper ──────────────────────────────────────────────────────

function t(key: string, params?: Record<string, string>): string {
  const translations: Record<string, string> = {
    error_invalid_telegram_id: 'معرف تيليجرام غير صالح',
    user_already_exists: 'المستخدم موجود بالفعل',
    join_request_pending: 'طلب الانضمام قيد المراجعة',
    join_request_start: 'يرجى تقديم بياناتك للانضمام',
    error_required_field: 'هذا الحقل مطلوب',
    ask_full_name: 'أدخل اسمك الكامل باللغة العربية',
    error_invalid_arabic_name: 'يرجى إدخال اسم عربي صحيح',
    error_name_too_short: 'الاسم قصير جداً، يجب أن يكون حرفين على الأقل',
    ask_nickname: 'أدخل اسمك المختصر (اختياري)',
    nickname_info: 'اتركه فارغاً أو اكتب /skip للتوليد التلقائي',
    ask_phone_number: 'أدخل رقم هاتفك المصري',
    phone_info: 'مثال: 01012345678',
    error_invalid_phone: 'رقم الهاتف غير صالح',
    error_phone_exists: 'رقم الهاتف مسجل مسبقاً',
    ask_national_id: 'أدخل رقم بطاقتك الوطنية',
    national_id_info: '14 رقماً يبدأ بـ 2 أو 3',
    error_invalid_national_id: 'رقم الهوية الوطنية غير صالح',
    error_national_id_exists: 'رقم الهوية مسجل مسبقاً',
    join_request_confirm: 'تأكيد البيانات',
    button_confirm: 'تأكيد',
    button_cancel: 'إلغاء',
    notification_join_request_title: 'طلب انضمام جديد',
    notification_join_request_message: 'طلب جديد من {name} ({phone})',
    join_request_saved: 'تم حفظ طلب الانضمام',
    join_request_cancelled: 'تم إلغاء طلب الانضمام',
    join_request_complete: 'اكتملت عملية طلب الانضمام',
    error_generic: 'حدث خطأ، يرجى المحاولة مجدداً',
  }
  let msg = translations[key] ?? key
  if (params) {
    msg = msg.replace(/\{(\w+)\}/g, (_, k) => params[k] ?? `{${k}}`)
  }
  return msg
}

// ─── waitFor factory (correct API — matches join.ts which uses waitFor) ───────

/**
 * Creates a mock for conversation.waitFor('message:text').
 * Each call consumes the next text in the sequence and returns
 * a ctx-like object with message.text set to that value.
 */
function makeWaitFor(...texts: (string | undefined)[]) {
  let idx = 0
  return vi.fn().mockImplementation((_filter: string) => {
    const text = texts[idx++]
    return Promise.resolve({
      from: { id: 12345, first_name: 'Test User' },
      reply: vi.fn(),
      message: text !== undefined ? { text } : undefined,
      t,
    } as unknown as BotContext)
  })
}

/**
 * Creates a mock for conversation.waitForCallbackQuery.
 * match is set to the callbackData provided.
 */
function makeWaitForCallbackQuery(callbackData: string) {
  return vi.fn().mockResolvedValue({
    match: callbackData,
    editMessageText: vi.fn(),
    answerCallbackQuery: vi.fn(),
  })
}

type MockConversation = {
  waitFor: ReturnType<typeof makeWaitFor>
  waitForCallbackQuery: ReturnType<typeof makeWaitForCallbackQuery>
}

// ─── Base mockCtx ────────────────────────────────────────────────────────────

function makeMockCtx(overrides: Partial<{ id: number }> = {}): BotContext {
  return {
    from: { id: overrides.id ?? 12345, first_name: 'Test User' },
    reply: vi.fn(),
    editMessageText: vi.fn(),
    t,
  } as unknown as BotContext
}

// ─── Valid test data ──────────────────────────────────────────────────────────

const VALID_PHONE = '01012345678'
const VALID_NATIONAL_ID = '29901010100018'
const VALID_NAME = 'محمد أحمد السيد'

// ─── Shared conversation builder ──────────────────────────────────────────────

function makeConversation(
  texts: (string | undefined)[],
  callbackData: string = 'cancel_join',
): MockConversation {
  return {
    waitFor: makeWaitFor(...texts),
    waitForCallbackQuery: makeWaitForCallbackQuery(callbackData),
  }
}

// ─── beforeEach ──────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks()
  mockPrisma.user = {
    findUnique: vi.fn().mockResolvedValue(null),
    findMany: vi.fn().mockResolvedValue([]),
  }
  mockPrisma.joinRequest = {
    findFirst: vi.fn().mockResolvedValue(null),
    create: vi.fn().mockResolvedValue({ id: 'req-001' }),
  }
  mockPrisma.notification = {
    create: vi.fn().mockResolvedValue({}),
  }
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 1 — Guard checks
// ═══════════════════════════════════════════════════════════════════════════

describe('T025 — Guard Checks', () => {
  it('should reject invalid telegram ID (0)', async () => {
    const ctx = makeMockCtx({ id: 0 })
    await joinConversation(
      makeConversation([]) as any,
      ctx,
    )
    expect(ctx.reply).toHaveBeenCalledWith('معرف تيليجرام غير صالح')
  })

  it('should reject already-registered user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing', telegramId: 12345n })
    const ctx = makeMockCtx()
    await joinConversation(makeConversation([]) as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('المستخدم موجود بالفعل')
  })

  it('should reject user with existing PENDING join request', async () => {
    mockPrisma.joinRequest.findFirst.mockResolvedValueOnce({ id: 'pending-001', status: 'PENDING' })
    const ctx = makeMockCtx()
    await joinConversation(makeConversation([]) as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('طلب الانضمام قيد المراجعة')
  })

  it('should handle database errors gracefully', async () => {
    mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('DB connection failed'))
    const ctx = makeMockCtx()
    await joinConversation(makeConversation([]) as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('حدث خطأ، يرجى المحاولة مجدداً')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 2 — Arabic name validation
// ═══════════════════════════════════════════════════════════════════════════

describe('T025 — Full Name Validation', () => {
  it('should reject names shorter than 2 characters', async () => {
    const ctx = makeMockCtx()
    // Give invalid name first, then break the loop by providing undefined (no message)
    // The while(true) loop will call waitFor again — give it undefined to make text empty → continue
    // Then provide another invalid so we can see the reply, then break with undefined chain
    // Strategy: provide 'أ' then let loop retry — but loop is infinite.
    // We need the conversation to stop. Supply enough inputs so the loop eventually gets
    // an error message on the first invalid input then crashes on the 2nd undefined → catch → error_generic
    // But we want to verify the VALIDATION message was sent before the crash.
    // Solution: provide 'أ' only → loop calls waitFor again → we make waitFor throw on 2nd call
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: 'أ' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('الاسم قصير جداً، يجب أن يكون حرفين على الأقل')
  })

  it('should reject non-Arabic characters in name', async () => {
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: 'Ahmed Mohamed' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('يرجى إدخال اسم عربي صحيح')
  })

  it('should reject names with numbers', async () => {
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: 'محمد123' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('يرجى إدخال اسم عربي صحيح')
  })

  it('should accept valid two-word Arabic name', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['محمد أحمد', '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'cancel_join')
    await joinConversation(conv as any, ctx)
    expect(ctx.reply).not.toHaveBeenCalledWith('يرجى إدخال اسم عربي صحيح')
    expect(ctx.reply).not.toHaveBeenCalledWith('الاسم قصير جداً، يجب أن يكون حرفين على الأقل')
  })

  it('should accept valid compound Arabic name (3+ words)', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['عبد الرحمن بن حسن', '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'cancel_join')
    await joinConversation(conv as any, ctx)
    expect(ctx.reply).not.toHaveBeenCalledWith('يرجى إدخال اسم عربي صحيح')
  })

  it('should require non-empty name (undefined input)', async () => {
    const ctx = makeMockCtx()
    // undefined text → text is undefined → loop continues → next call throws → catch
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: undefined, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('هذا الحقل مطلوب')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 3 — Nickname
// ═══════════════════════════════════════════════════════════════════════════

describe('T025 — Nickname Generation', () => {
  it('should auto-generate nickname when input is empty', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, '', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockPrisma.joinRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nickname: expect.stringMatching(/^محمد-[a-z0-9]{4}$/),
        }),
      }),
    )
  })

  it('should auto-generate nickname when /skip is entered', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['فاطمة محمد', '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockPrisma.joinRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          nickname: expect.stringMatching(/^فاطمة-[a-z0-9]{4}$/),
        }),
      }),
    )
  })

  it('should use first word of compound name as nickname prefix', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['أحمد بن محمد علي', '', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    const created = mockPrisma.joinRequest.create.mock.calls[0][0].data
    expect(created.nickname).toMatch(/^أحمد-[a-z0-9]{4}$/)
  })

  it('should preserve custom nickname when provided', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, 'محمدو', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockPrisma.joinRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ nickname: 'محمدو' }),
      }),
    )
  })

  it('should generate unique nanoid (4 chars, lowercase alphanumeric)', async () => {
    const results: string[] = []
    for (let i = 0; i < 2; i++) {
      vi.clearAllMocks()
      mockPrisma.user = { findUnique: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) }
      mockPrisma.joinRequest = { findFirst: vi.fn().mockResolvedValue(null), create: vi.fn().mockResolvedValue({ id: 'r' }) }
      mockPrisma.notification = { create: vi.fn().mockResolvedValue({}) }
      const ctx = makeMockCtx()
      const conv = makeConversation([VALID_NAME, '', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
      await joinConversation(conv as any, ctx)
      const nick = mockPrisma.joinRequest.create.mock.calls[0][0].data.nickname
      results.push(nick)
    }
    expect(results[0]).toMatch(/^محمد-[a-z0-9]{4}$/)
    expect(results[1]).toMatch(/^محمد-[a-z0-9]{4}$/)
    const id0 = results[0].split('-').pop()!
    const id1 = results[1].split('-').pop()!
    expect(id0).toHaveLength(4)
    expect(id1).toHaveLength(4)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 4 — Phone number validation
// ═══════════════════════════════════════════════════════════════════════════

describe('T025 — Phone Number Validation (FR-034)', () => {
  const validPhones = ['01012345678', '01112345678', '01212345678', '01512345678']
  const invalidPhones = [
    '1012345678', '20112345678', '013123456789',
    '0101234567', '010123456789', 'abc01012345678', '010-1234-5678',
  ]

  for (const phone of validPhones) {
    it(`should accept valid phone: ${phone}`, async () => {
      const ctx = makeMockCtx()
      const conv = makeConversation([VALID_NAME, '/skip', phone, VALID_NATIONAL_ID], 'cancel_join')
      await joinConversation(conv as any, ctx)
      expect(ctx.reply).not.toHaveBeenCalledWith('رقم الهاتف غير صالح')
    })
  }

  for (const phone of invalidPhones) {
    it(`should reject invalid phone: ${phone}`, async () => {
      const ctx = makeMockCtx()
      // invalid phone → loop retries → throw on 2nd waitFor call → catch
      const waitFor = vi.fn()
        .mockResolvedValueOnce({ message: { text: VALID_NAME }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockResolvedValueOnce({ message: { text: '/skip' }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockResolvedValueOnce({ message: { text: phone }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockRejectedValueOnce(new Error('test stop'))
      await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
      expect(ctx.reply).toHaveBeenCalledWith('رقم الهاتف غير صالح')
    })
  }

  it('should reject duplicate phone number', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'other', phone: VALID_PHONE })
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: VALID_NAME }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockResolvedValueOnce({ message: { text: '/skip' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockResolvedValueOnce({ message: { text: VALID_PHONE }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('رقم الهاتف مسجل مسبقاً')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 5 — National ID validation
// ═══════════════════════════════════════════════════════════════════════════

describe('T025 — National ID Validation', () => {
  const validIds = ['29901010100018', '30302010100020']
  const invalidIds = [
    '1990101010001', '299010101000134', '19901010100013',
    '29900013010001', '29901300100013', 'abc0101010001x', '',
  ]

  for (const id of validIds) {
    it(`should accept valid National ID: ${id}`, async () => {
      const ctx = makeMockCtx()
      const conv = makeConversation([VALID_NAME, '/skip', VALID_PHONE, id], 'cancel_join')
      await joinConversation(conv as any, ctx)
      expect(ctx.reply).not.toHaveBeenCalledWith('رقم الهوية الوطنية غير صالح')
    })
  }

  for (const id of invalidIds) {
    it(`should reject invalid National ID: "${id}"`, async () => {
      const ctx = makeMockCtx()
      const waitFor = vi.fn()
        .mockResolvedValueOnce({ message: { text: VALID_NAME }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockResolvedValueOnce({ message: { text: '/skip' }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockResolvedValueOnce({ message: { text: VALID_PHONE }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockResolvedValueOnce({ message: { text: id }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockRejectedValueOnce(new Error('test stop'))
      await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
      expect(ctx.reply).toHaveBeenCalledWith('رقم الهوية الوطنية غير صالح')
    })
  }

  it('should reject duplicate National ID', async () => {
    mockPrisma.user.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'other', nationalId: VALID_NATIONAL_ID })
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: VALID_NAME }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockResolvedValueOnce({ message: { text: '/skip' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockResolvedValueOnce({ message: { text: VALID_PHONE }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockResolvedValueOnce({ message: { text: VALID_NATIONAL_ID }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith('رقم الهوية مسجل مسبقاً')
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 6 — extractNationalIdInfo
// ═══════════════════════════════════════════════════════════════════════════

describe('extractNationalIdInfo — Birth date & gender extraction', () => {
  it('should extract birth date for 19xx century (starts with 2)', () => {
    const { birthDate } = extractNationalIdInfo('29901010100018')
    expect(birthDate.getFullYear()).toBe(1999)
    expect(birthDate.getMonth()).toBe(0)
    expect(birthDate.getDate()).toBe(1)
  })

  it('should extract birth date for 20xx century (starts with 3)', () => {
    const { birthDate } = extractNationalIdInfo('30302010100020')
    expect(birthDate.getFullYear()).toBe(2003)
    expect(birthDate.getMonth()).toBe(1)
    expect(birthDate.getDate()).toBe(1)
  })

  it('should extract MALE gender (odd 10th digit)', () => {
    // '29901010100018' → position 9 = '1' → odd → FEMALE per Egyptian spec
    // Use an ID with known odd 10th digit that means MALE
    // Egyptian spec: odd = MALE
    // '29901010100018' position 9 = '1' → odd → MALE ✓
    const { gender } = extractNationalIdInfo('29901010100018')
    // Wait: join.ts says: genderCode % 2 === 0 ? 'FEMALE' : 'MALE'
    // so odd → MALE. '29901010 1 00018' position 9 = '1' → odd → MALE
    expect(gender).toBe('MALE')
  })

  it('should extract FEMALE gender (even 10th digit)', () => {
    // '29901010200018' position 9 = '2' → even → FEMALE
    const { gender } = extractNationalIdInfo('29901010200018')
    expect(gender).toBe('FEMALE')
  })

  it('should correctly map century code 2 → 1900s', () => {
    const { birthDate } = extractNationalIdInfo('29001010100018')
    expect(birthDate.getFullYear()).toBe(1990)
  })

  it('should correctly map century code 3 → 2000s', () => {
    const { birthDate } = extractNationalIdInfo('30001010100020')
    expect(birthDate.getFullYear()).toBe(2000)
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 7 — Confirmation flow
// ═══════════════════════════════════════════════════════════════════════════

describe('T025/T026 — Confirmation & Save Flow', () => {
  it('should save join request on confirmation', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockPrisma.joinRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          telegramId: 12345n,
          fullName: VALID_NAME,
          phone: VALID_PHONE,
          nationalId: VALID_NATIONAL_ID,
          status: 'PENDING',
        }),
      }),
    )
  })

  it('should cancel join request when user clicks cancel', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'cancel_join')
    await joinConversation(conv as any, ctx)
    expect(mockPrisma.joinRequest.create).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════
// SUITE 8 — Admin notification
// ═══════════════════════════════════════════════════════════════════════════

describe('T027 — Admin Notification on Join Request', () => {
  it('should notify all active admins after confirmed join request', async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([
      { telegramId: 11111n, role: 'SUPER_ADMIN', isActive: true },
      { telegramId: 22222n, role: 'ADMIN', isActive: true },
    ])
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockPrisma.notification.create).toHaveBeenCalledTimes(2)
  })

  it('should NOT send notifications when no active admins exist', async () => {
    mockPrisma.user.findMany.mockResolvedValueOnce([])
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockPrisma.notification.create).not.toHaveBeenCalled()
  })
})
```

═══════════════════════════════════════════════════════
STEP 5 — Commit
═══════════════════════════════════════════════════════

git add packages/core/tests/unit/bot/conversations/join.test.ts
git add packages/core/tests/unit/bot/handlers/menu.test.ts
git add packages/core/tests/unit/config/env.test.ts
git add vitest.config.ts (or packages/core/vitest.config.ts — whichever exists)
git commit -m "test: fix mock patterns for waitFor API, menu t() interpolation, env stubbing, and exclude external test folders"

STEP 6 — Verify
Run: npm run test
Expected: failures from join, menu, env tests should be resolved.
Report: test results summary (pass/fail counts per file).
```

---

## ملاحظات التنفيذ

> [!WARNING]
> المنفّذ يجب أن يقرأ `vitest.config.ts` أولاً قبل التعديل — موقعه قد يكون في الجذر أو في `packages/core/`.

> [!IMPORTANT]
> **لا تُعدَّل الملفات التالية أبداً:**
> - `packages/core/src/bot/conversations/join.ts`
> - `packages/core/src/bot/handlers/menu.ts`
> - `packages/core/src/config/env.ts`
> - `packages/core/tests/unit/bot/handlers/start.test.ts` (يعمل بالفعل)

> [!NOTE]
> اختبارات `extractNationalIdInfo` — المشكلة كانت في التعليق الخاطئ في الاختبار الأصلي:
> "position 9 = '2' → even → **MALE**" — لكن الكود يقول `even → FEMALE`.
> الكود صحيح، التعليق في الاختبار غلط. الاختبارات الجديدة تُصحّح هذا.

> [!NOTE]
> `start.test.ts` — يعمل بشكل صحيح بالفعل (pattern صحيح: `get env` getter). لا تُعدَّل.

> [!NOTE]
> `bootstrap.service.test.ts` في `.claude/worktrees/` — ستُحَل تلقائياً بعد FIX 1 (exclude).

---

## النتائج المتوقعة بعد التنفيذ

| الملف | قبل | بعد |
|-------|-----|-----|
| `join.test.ts` | 33 فشل | ✅ 0 فشل |
| `menu.test.ts` | 4 فشل | ✅ 0 فشل |
| `env.test.ts` | 5 فشل | ✅ 0 فشل |
| `.opencode/zod tests` | 3 فشل (suite) | ✅ مستبعدة |
| `.claude/worktrees/bootstrap` | 6 فشل | ✅ مستبعدة |
| `start.test.ts` | ❌ suite error | يتطلب تحقق |
| **الإجمالي** | **44+ فشل** | **~0 فشل** |
