# UX Improvements — Implementation Guide

**Reference:** UX-Audit-Report.md  
**Date:** 2026-03-04  
**Status:** Implementation Ready

---

## Quick Reference

| Category | Issues | Priority | Time |
|----------|--------|----------|------|
| Navigation | 4 issues | CRITICAL/HIGH | 6-8h |
| Button Text | 3 issues | CRITICAL/MEDIUM | 4-5h |
| User Management | 3 issues | CRITICAL/HIGH | 8-10h |
| Conversation Flow | 3 issues | HIGH/MEDIUM | 6-8h |
| Information Architecture | 3 issues | CRITICAL/MEDIUM | 4-6h |

**Total Estimated Time:** 28-37 hours

---

## Implementation Priority Matrix

```
CRITICAL + Quick (< 2h)     → Do First
CRITICAL + Long (> 4h)      → Do Second
HIGH + Quick                → Do Third
HIGH + Long                 → Do Fourth
MEDIUM/LOW                  → Phase 6
```

---

## Detailed Implementation Steps

### 🔴 CRITICAL-001: User Profile View

**File:** `packages/core/src/bot/handlers/users.ts`

**Step 1: Add Profile Handler**
```typescript
// Add after line 40
if (action === 'profile') {
  return showUserProfile(ctx, targetId)
}
```

**Step 2: Create Profile Function**
```typescript
async function showUserProfile(ctx: BotContext, telegramId: bigint) {
  const user = await prisma.user.findUnique({
    where: { telegramId },
    include: {
      adminScopes: {
        include: { section: true }
      },
      joinRequest: true,
      _count: {
        select: {
          auditLogs: true
        }
      }
    }
  })

  if (!user) {
    return ctx.answerCallbackQuery(ctx.t('errors-user-not-found'))
  }

  // Mask sensitive data
  const maskedNationalId = user.nationalId 
    ? `${user.nationalId.substring(0, 4)}${'*'.repeat(10)}`
    : ctx.t('value-unknown')

  const text = ctx.t('user-profile-full', {
    name: user.fullName,
    nickname: user.nickname || ctx.t('value-none'),
    phone: user.phone || ctx.t('value-unknown'),
    nationalId: maskedNationalId,
    role: ctx.t(`role-${user.role.toLowerCase()}`),
    status: user.isActive ? ctx.t('status-active') : ctx.t('status-inactive'),
    createdAt: user.createdAt.toLocaleDateString('ar-EG'),
    lastActive: user.lastActiveAt 
      ? user.lastActiveAt.toLocaleDateString('ar-EG')
      : ctx.t('value-never'),
    auditCount: user._count.auditLogs,
    scopesCount: user.adminScopes.length
  })

  const keyboard = new InlineKeyboard()
    .text(ctx.t('button-back-to-user'), `user:view:${telegramId}`)

  return ctx.editMessageText(text, {
    parse_mode: 'Markdown',
    reply_markup: keyboard
  })
}
```

**Step 3: Add Button in User Details**
```typescript
// In showUserDetails(), before "Back to List"
keyboard.text(ctx.t('button-view-profile'), `user:profile:${telegramId}`)
keyboard.row()
```

**Step 4: Add i18n Keys**
```fluent
# ar.ftl
user-profile-full =
    👤 *الملف الشخصي الكامل*
    ════════════════════
    📛 الاسم: { $name }
    🏷️ الشهرة: { $nickname }
    📱 الهاتف: { $phone }
    🪪 الرقم القومي: { $nationalId }
    
    👔 الدور: { $role }
    🔘 الحالة: { $status }
    
    📅 تاريخ التسجيل: { $createdAt }
    ⏰ آخر نشاط: { $lastActive }
    
    📊 الإحصائيات:
    • { $auditCount } عملية مسجلة
    • { $scopesCount } صلاحية إدارية
    ════════════════════

button-view-profile = 📋 الملف الكامل
button-back-to-user = 🔙 رجوع للمستخدم
value-none = لا يوجد
value-never = لم يسجل دخول
```

**Testing:**
1. Login as SUPER_ADMIN
2. Go to Users → Select any user
3. Click "الملف الكامل"
4. Verify all data shows correctly
5. Verify masked national ID
6. Click back button

---

### 🔴 CRITICAL-002: Confirmation for Destructive Actions

**File:** `packages/core/src/bot/handlers/users.ts`

**Step 1: Change Toggle Button**
```typescript
// In showUserDetails(), change:
keyboard.text(
  user.isActive ? ctx.t('button-deactivate') : ctx.t('button-activate'),
  `user:toggle_confirm:${telegramId}`, // ← Add _confirm
)
```

**Step 2: Add Confirmation Handler**
```typescript
// Add after line 50
if (action === 'toggle_confirm') {
  const user = await prisma.user.findUnique({ where: { telegramId: targetId } })
  if (!user) {
    return ctx.answerCallbackQuery(ctx.t('errors-user-not-found'))
  }

  const confirmKey = user.isActive 
    ? 'user-deactivate-confirm' 
    : 'user-activate-confirm'

  const keyboard = new InlineKeyboard()
    .text(ctx.t('button-confirm'), `user:toggle_execute:${targetId}`)
    .row()
    .text(ctx.t('button-cancel'), `user:view:${targetId}`)

  return ctx.editMessageText(
    ctx.t(confirmKey, { name: user.nickname || user.fullName }),
    { reply_markup: keyboard }
  )
}

if (action === 'toggle_execute') {
  // Original toggle logic here
  const user = await prisma.user.findUnique({ where: { telegramId: targetId } })
  if (!user) {
    return ctx.answerCallbackQuery(ctx.t('errors-user-not-found'))
  }

  const newStatus = !user.isActive
  await prisma.user.update({
    where: { telegramId: targetId },
    data: { isActive: newStatus },
  })

  if (!newStatus) {
    await redis.del(`session:${targetId}`)
    logger.info({ userId: targetId.toString() }, 'User deactivated, session cleared')
  }

  await auditService.log({
    userId: BigInt(ctx.from?.id || 0),
    action: newStatus ? AuditAction.USER_ACTIVATE : AuditAction.USER_DEACTIVATE,
    targetType: 'User',
    targetId: targetId.toString(),
  })

  await ctx.answerCallbackQuery(ctx.t('user-status-updated'))
  return showUserDetails(ctx, targetId)
}
```

**Step 3: Add i18n Keys**
```fluent
user-deactivate-confirm =
    ⚠️ *تأكيد إيقاف الحساب*
    
    هل تريد إيقاف حساب *{ $name }*؟
    
    سيتم:
    • تسجيل خروجه فوراً
    • منعه من الدخول للنظام
    • حفظ بياناته (لا يتم حذفها)

user-activate-confirm =
    ✅ *تأكيد تفعيل الحساب*
    
    هل تريد تفعيل حساب *{ $name }*؟
    
    سيتمكن من:
    • تسجيل الدخول للنظام
    • الوصول لصلاحياته
```

---

### 🔴 CRITICAL-003: Short Button Text for Mobile

**File:** `packages/core/src/locales/ar.ftl`

**Changes:**
```fluent
# Replace long texts
button-back-to-menu = 🏠 القائمة
button-back-to-sections = 🔙 الأقسام
button-manage-scopes = 🔐 الصلاحيات
button-view-profile = 📋 الملف

# Keep full versions as comments for reference
# button-back-to-menu-full = 🏠 العودة للقائمة الرئيسية
# button-manage-scopes-full = إدارة الصلاحيات
```

**File:** `packages/core/src/locales/en.ftl`
```fluent
button-back-to-menu = 🏠 Menu
button-back-to-sections = 🔙 Sections
button-manage-scopes = 🔐 Scopes
button-view-profile = 📋 Profile
```

**Testing:**
Test on actual mobile device (not desktop Telegram):
1. iPhone SE (small screen)
2. Android with Arabic RTL
3. Verify all buttons show completely

---

### 🟠 HIGH-001: Navigation Utility

**File:** `packages/core/src/bot/utils/navigation.ts` (NEW)

```typescript
import { InlineKeyboard } from 'grammy'
import type { BotContext } from '../../types/context'

export type BackDestination = 'menu' | 'list' | 'parent' | 'custom'

export interface NavigationOptions {
  destination: BackDestination
  customCallback?: string
  customLabel?: string
}

/**
 * Adds consistent back button to keyboard
 */
export function addBackButton(
  keyboard: InlineKeyboard,
  ctx: BotContext,
  options: NavigationOptions
): InlineKeyboard {
  let callback: string
  let label: string

  switch (options.destination) {
    case 'menu':
      callback = 'menu:main'
      label = ctx.t('button-back-to-menu')
      break
    
    case 'list':
      callback = ctx.session.lastList || 'menu:main'
      label = ctx.t('button-back-to-list')
      break
    
    case 'parent':
      callback = ctx.session.lastScreen || 'menu:main'
      label = ctx.t('button-back')
      break
    
    case 'custom':
      callback = options.customCallback || 'menu:main'
      label = options.customLabel || ctx.t('button-back')
      break
  }

  keyboard.text(label, callback)
  return keyboard
}

/**
 * Saves current screen for back navigation
 */
export function saveNavigationState(
  ctx: BotContext,
  screen: string,
  list?: string
) {
  ctx.session.lastScreen = screen
  if (list) {
    ctx.session.lastList = list
  }
}
```

**Usage Example:**
```typescript
// In users.ts
import { addBackButton, saveNavigationState } from '../utils/navigation'

async function showUserDetails(ctx: BotContext, telegramId: bigint) {
  saveNavigationState(ctx, `user:view:${telegramId}`, 'users:list')
  
  const keyboard = new InlineKeyboard()
  // ... add other buttons
  
  addBackButton(keyboard, ctx, { destination: 'list' })
  
  return ctx.editMessageText(text, { reply_markup: keyboard })
}
```

---

### 🟠 HIGH-002: Cancel Button in Conversations

**File:** `packages/core/src/bot/conversations/join.ts`

**Add to each step:**
```typescript
// Example for name step
async function askName(conversation, ctx) {
  const keyboard = new InlineKeyboard()
    .text(ctx.t('button-cancel-flow'), 'cancel:join')

  await ctx.reply(ctx.t('join-step-name'), {
    reply_markup: keyboard
  })

  const response = await conversation.waitFor(['message:text', 'callback_query'])

  // Handle cancel
  if (response.callbackQuery?.data === 'cancel:join') {
    await response.answerCallbackQuery()
    await ctx.reply(ctx.t('join-cancelled'))
    return null // Signal cancellation
  }

  return response.message.text
}
```

**Add Cancel Handler:**
```typescript
// In bot/index.ts
bot.callbackQuery(/^cancel:/, async (ctx) => {
  const [_, flow] = ctx.callbackQuery.data.split(':')
  
  await ctx.answerCallbackQuery()
  await ctx.conversation.exit(flow)
  await ctx.reply(ctx.t(`${flow}-cancelled`))
})
```

---

### 🟠 HIGH-003: User Search Function

**File:** `packages/core/src/bot/handlers/users.ts`

**Step 1: Add Search Button**
```typescript
export async function usersHandler(ctx: BotContext, page = 1) {
  const limit = 10
  const skip = (page - 1) * limit

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      take: limit,
      skip,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count()
  ])

  const totalPages = Math.ceil(total / limit)

  const keyboard = new InlineKeyboard()
  
  // Add search button at top
  keyboard.text(ctx.t('button-search-user'), 'users:search')
  keyboard.row()

  // User list
  for (const user of users) {
    const status = user.isActive ? '✅' : '🚫'
    const displayName = user.nickname || user.fullName
    keyboard.text(`${status} ${displayName} (${user.role})`, `user:view:${user.telegramId}`)
    keyboard.row()
  }

  // Pagination
  if (totalPages > 1) {
    const paginationRow = []
    if (page > 1) {
      paginationRow.push({ text: ctx.t('button-prev-page'), callback_data: `users:list:${page - 1}` })
    }
    paginationRow.push({ text: `${page}/${totalPages}`, callback_data: 'noop' })
    if (page < totalPages) {
      paginationRow.push({ text: ctx.t('button-next-page'), callback_data: `users:list:${page + 1}` })
    }
    keyboard.row(...paginationRow)
  }

  keyboard.text(ctx.t('button-back-to-menu'), 'menu:main')

  return replyOrEdit(ctx, ctx.t('users-list-title'), keyboard)
}
```

**Step 2: Add Search Handler**
```typescript
if (query === 'users:search') {
  await ctx.answerCallbackQuery()
  await ctx.reply(ctx.t('user-search-prompt'))
  // Wait for user input
  // Search in fullName, nickname, phone
  // Show results
}
```

**i18n Keys:**
```fluent
button-search-user = 🔍 بحث
user-search-prompt = أدخل اسم أو رقم هاتف المستخدم:
user-search-no-results = ❌ لم يتم العثور على نتائج
user-search-results = 🔍 نتائج البحث ({ $count }):
```

---

## Testing Checklist

### Critical Features

- [ ] User profile shows all data correctly
- [ ] National ID is masked properly
- [ ] Deactivate user requires confirmation
- [ ] Activate user requires confirmation
- [ ] All buttons fit on mobile screen (iPhone SE)
- [ ] Arabic RTL displays correctly
- [ ] Back buttons work from all screens

### High Priority Features

- [ ] Navigation utility works consistently
- [ ] Cancel button appears in join flow
- [ ] Cancel button works at each step
- [ ] User search finds by name
- [ ] User search finds by phone
- [ ] Pagination works correctly

---

## Rollout Plan

### Week 1: Critical Fixes
- Day 1-2: User Profile View
- Day 3: Confirmation Dialogs
- Day 4: Button Text
- Day 5: Testing

### Week 2: High Priority
- Day 1: Navigation Utility
- Day 2-3: Cancel Buttons
- Day 4: User Search
- Day 5: Testing

---

## Success Metrics

- ✅ Zero user complaints about missing back buttons
- ✅ Zero accidental user deactivations
- ✅ 100% button text visible on mobile
- ✅ Admin can view full user profile in < 3 clicks
- ✅ User can cancel join flow at any step

---

**Status:** ✅ Ready for Implementation  
**Next:** Review with project owner → Create tasks → Implement
