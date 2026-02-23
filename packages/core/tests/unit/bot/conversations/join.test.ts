/**
 * join.test.ts — Unit Tests for Join Conversation
 *
 * IMPORTANT: join.ts uses conversation.waitFor('message:text') and
 * conversation.waitForCallbackQuery(). Mocks must reflect this API.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { joinConversation } from '../../../../src/bot/conversations/join'
import { extractEgyptianNationalIdInfo } from '@al-saada/validators'
import { joinRequestService } from '../../../../src/services/join-requests'
import { prisma } from '../../../../src/database/prisma'
import type { BotContext } from '../../../../src/types/context'

// ─── Mocks ─────────────────────────────────────────────────────────────────
vi.mock('../../../../src/database/prisma')
vi.mock('../../../../src/services/join-requests')
vi.mock('../../../../src/utils/logger')

const mockPrisma = prisma as any
const mockJoinRequestService = joinRequestService as any
// ─── Translation helper ──────────────────────────────────────────────────────
function t(key: string, params?: Record<string, string>): string {
  const translations: Record<string, string> = {
    error_invalid_telegram_id: 'معرّف Telegram غير صالح.',
    user_already_exists: 'لقد قمت بالتسجيل مسبقاً.',
    join_request_pending: 'لديك طلب انضمام قيد المراجعة بالفعل.',
    join_request_start: 'سنساعدك في تسجيل بياناتك. يرجى الإجابة على الأسئلة التالية بدقة:',
    error_required_field: 'هذا الحقل مطلوب.',
    ask_full_name: 'ما هو اسمك الكامل باللغة العربية؟',
    error_invalid_arabic_name: 'يرجى إدخال اسم عربي صالح.',
    error_name_too_short: 'الاسم قصير جداً. يرجى إدخال اسم كامل.',
    ask_nickname: 'هل تريد إضافة لقب اختياري؟ (اضغط /skip للانتقال التالي)',
    nickname_info: '(يمكنك تخطي هذا السؤال وسنقوم بإنشاء لقب تلقائي من اسمك)',
    ask_phone_number: 'ما هو رقم هاتفك المصري؟ (مثال: 01xxxxxxxx)',
    phone_info: '(يرجى إدخال الرقم بصيغة مصرية كاملة)',
    error_invalid_phone: 'يرجى إدخال رقم هاتف مصري صالح.',
    error_phone_exists: 'هذا الرقم مسجل مسبقاً.',
    ask_national_id: 'ما هو رقم البطاقة الشخصية المصرية؟',
    national_id_info: '(يرجى إدخال الرقم المكون من 14 رقمًا)',
    error_invalid_national_id: 'يرجى إدخال رقم بطاقة شخصية مصري صالح (14 رقم).',
    error_national_id_exists: 'هذا الرقم مسجل مسبقاً.',
    join_request_confirm: 'تأكيد بيانات الانضمام:',
    button_confirm: 'تأكيد',
    button_cancel: 'إلغاء',
    notification_join_request_title: 'طلب انضمام جديد',
    notification_join_request_message: 'لديك طلب انضمام جديد من: {name} - {phone}',
    join_request_saved: 'تم حفظ طلب الانضمام بنجاح! ستصلك رسالة عند الرد.',
    join_request_cancelled: 'تم إلغاء طلب الانضمام.',
    join_request_complete: 'اكتملت عملية تسجيل البيانات. شكراً!',
    error_generic: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
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
  // Mock service methods
  mockJoinRequestService.hasPendingRequest = vi.fn().mockResolvedValue(false)
  mockJoinRequestService.create = vi.fn().mockResolvedValue({ id: 'req-001' })

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
    expect(ctx.reply).toHaveBeenCalledWith(t('error_invalid_telegram_id'))
  })
  it('should reject already-registered user', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({ id: 'existing', telegramId: 12345n })
    const ctx = makeMockCtx()
    await joinConversation(makeConversation([]) as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith(t('user_already_exists'))
  })
  it('should reject user with existing PENDING join request', async () => {
    mockJoinRequestService.hasPendingRequest.mockResolvedValueOnce(true)
    const ctx = makeMockCtx()
    await joinConversation(makeConversation([]) as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith(t('join_request_pending'))
  })
  it('should handle database errors gracefully', async () => {
    mockPrisma.user.findUnique.mockRejectedValueOnce(new Error('DB connection failed'))
    const ctx = makeMockCtx()
    await joinConversation(makeConversation([]) as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith(t('error_generic'))
  })
})
// ═══════════════════════════════════════════════════════════════════════════
// SUITE 2 — Arabic name validation
// ═══════════════════════════════════════════════════════════════════════════
describe('T025 — Full Name Validation', () => {
  it('should reject names shorter than 2 characters', async () => {
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: 'أ' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith(t('error_name_too_short'))
  })
  it('should reject non-Arabic characters in name', async () => {
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: 'Ahmed Mohamed' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith(t('error_invalid_arabic_name'))
  })
  it('should reject names with numbers', async () => {
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: { text: 'محمد123' }, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith(t('error_invalid_arabic_name'))
  })
  it('should accept valid two-word Arabic name', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['محمد أحمد', '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'cancel_join')
    await joinConversation(conv as any, ctx)
    expect(ctx.reply).not.toHaveBeenCalledWith(t('error_invalid_arabic_name'))
    expect(ctx.reply).not.toHaveBeenCalledWith(t('error_name_too_short'))
  })
  it('should accept valid compound Arabic name (3+ words)', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['عبد الرحمن بن حسن', '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'cancel_join')
    await joinConversation(conv as any, ctx)
    expect(ctx.reply).not.toHaveBeenCalledWith(t('error_invalid_arabic_name'))
  })
  it('should require non-empty name (undefined input)', async () => {
    const ctx = makeMockCtx()
    const waitFor = vi.fn()
      .mockResolvedValueOnce({ message: undefined, t, reply: vi.fn(), from: { id: 12345 } })
      .mockRejectedValueOnce(new Error('test stop'))
    await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
    expect(ctx.reply).toHaveBeenCalledWith(t('error_required_field'))
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
    expect(mockJoinRequestService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: expect.stringMatching(/^محمد-[a-z0-9]{4}$/),
      }),
    )
  })
  it('should auto-generate nickname when /skip is entered', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['فاطمة محمد', '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockJoinRequestService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: expect.stringMatching(/^فاطمة-[a-z0-9]{4}$/),
      }),
    )
  })
  it('should use first word of compound name as nickname prefix', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation(['أحمد بن محمد علي', '', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    const created = mockJoinRequestService.create.mock.calls[0][0]
    expect(created.nickname).toMatch(/^أحمد-[a-z0-9]{4}$/)
  })
  it('should preserve custom nickname when provided', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, 'محمدو', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
    await joinConversation(conv as any, ctx)
    expect(mockJoinRequestService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        nickname: 'محمدو',
      }),
    )
  })
  it('should generate unique nanoid (4 chars, lowercase alphanumeric)', async () => {
    const results: string[] = []
    for (let i = 0; i < 2; i++) {
      vi.clearAllMocks()
      mockPrisma.user = { findUnique: vi.fn().mockResolvedValue(null), findMany: vi.fn().mockResolvedValue([]) }
      // Mock service methods
      mockJoinRequestService.hasPendingRequest = vi.fn().mockResolvedValue(false)
      mockJoinRequestService.create = vi.fn().mockResolvedValue({ id: 'r' })
      mockPrisma.notification = { create: vi.fn().mockResolvedValue({}) }
      const ctx = makeMockCtx()
      const conv = makeConversation([VALID_NAME, '', VALID_PHONE, VALID_NATIONAL_ID], 'confirm_join')
      await joinConversation(conv as any, ctx)
      const nick = mockJoinRequestService.create.mock.calls[0][0].nickname
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
      expect(ctx.reply).not.toHaveBeenCalledWith(t('error_invalid_phone'))
    })
  }
  for (const phone of invalidPhones) {
    it(`should reject invalid phone: ${phone}`, async () => {
      const ctx = makeMockCtx()
      const waitFor = vi.fn()
        .mockResolvedValueOnce({ message: { text: VALID_NAME }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockResolvedValueOnce({ message: { text: '/skip' }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockResolvedValueOnce({ message: { text: phone }, t, reply: vi.fn(), from: { id: 12345 } })
        .mockRejectedValueOnce(new Error('test stop'))
      await joinConversation({ waitFor, waitForCallbackQuery: vi.fn() } as any, ctx)
      expect(ctx.reply).toHaveBeenCalledWith(t('error_invalid_phone'))
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
    expect(ctx.reply).toHaveBeenCalledWith(t('error_phone_exists'))
  })
})
// ═══════════════════════════════════════════════════════════════════════════
// SUITE 5 — National ID validation
// ═══════════════════════════════════════════════════════════════════════════
describe('T025 — National ID Validation', () => {
  const validIds = ['29901010100018', '30302010100020']
  const invalidIds = [
    '1990101010001', '299010101000134', '19901010100013',
    '29900013010001', '29901300100013', 'abc0101010001x',
  ]
  for (const id of validIds) {
    it(`should accept valid National ID: ${id}`, async () => {
      const ctx = makeMockCtx()
      const conv = makeConversation([VALID_NAME, '/skip', VALID_PHONE, id], 'cancel_join')
      await joinConversation(conv as any, ctx)
      expect(ctx.reply).not.toHaveBeenCalledWith(t('error_invalid_national_id'))
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
      expect(ctx.reply).toHaveBeenCalledWith(t('error_invalid_national_id'))
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
    expect(ctx.reply).toHaveBeenCalledWith(t('error_national_id_exists'))
  })
})
// ═══════════════════════════════════════════════════════════════════════════
// SUITE 6 — extractEgyptianNationalIdInfo
// ═══════════════════════════════════════════════════════════════════════════
describe('extractEgyptianNationalIdInfo — Birth date & gender extraction', () => {
  it('should extract birth date for 19xx century (starts with 2)', () => {
    const { birthDate } = extractEgyptianNationalIdInfo('29901010100018')
    expect(birthDate.getFullYear()).toBe(1999)
    expect(birthDate.getMonth()).toBe(0)
    expect(birthDate.getDate()).toBe(1)
  })
  it('should extract birth date for 20xx century (starts with 3)', () => {
    const { birthDate } = extractEgyptianNationalIdInfo('30302010100020')
    expect(birthDate.getFullYear()).toBe(2003)
    expect(birthDate.getMonth()).toBe(1)
    expect(birthDate.getDate()).toBe(1)
  })
  it('should extract MALE gender (odd 13th digit)', () => {
    const { gender } = extractEgyptianNationalIdInfo('29901010100018')
    expect(gender).toBe('MALE')
  })
  it('should extract FEMALE gender (even 13th digit)', () => {
    const { gender } = extractEgyptianNationalIdInfo('29901010200028')
    expect(gender).toBe('FEMALE')
  })
  it('should correctly map century code 2 → 1900s', () => {
    const { birthDate } = extractEgyptianNationalIdInfo('29001010100018')
    expect(birthDate.getFullYear()).toBe(1990)
  })
  it('should correctly map century code 3 → 2000s', () => {
    const { birthDate } = extractEgyptianNationalIdInfo('30001010100020')
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
    expect(mockJoinRequestService.create).toHaveBeenCalledWith(
      expect.objectContaining({
        telegramId: 12345n,
        fullName: VALID_NAME,
        phone: VALID_PHONE,
        nationalId: VALID_NATIONAL_ID,
      }),
    )
  })
  it('should cancel join request when user clicks cancel', async () => {
    const ctx = makeMockCtx()
    const conv = makeConversation([VALID_NAME, '/skip', VALID_PHONE, VALID_NATIONAL_ID], 'cancel_join')
    await joinConversation(conv as any, ctx)
    expect(mockJoinRequestService.create).not.toHaveBeenCalled()
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