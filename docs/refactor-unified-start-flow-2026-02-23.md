# توثيق إعادة هيكلة /start Flow - 2026-02-23

## ملخص التغييرات

تم إعادة هيكلة تدفق `/start` إلى تدفق موحد لجميع المستخدمين، حيث تم نقل منطق Bootstrap من `startHandler` إلى داخل `joinRequestService.createOrBootstrap()`.

---

## الملفات المعدلة

### 1. `packages/core/src/bot/handlers/start.ts`

**التغيير**: تبسيط المعالج إلى 3 حالات فقط:

```typescript
// الحالة 1: مستخدم موجود → عرض القائمة
if (existingUser) {
  return menuHandler(ctx)
}

// الحالة 2: طلب انضمام معلق → رسالة انتظار
if (pendingRequest) {
  return ctx.reply(ctx.t('join_request_already_pending', { date }))
}

// الحالة 3: مستخدم جديد → دخول محادثة الانضمام
await ctx.conversation.enter('join')
```

**ما تم إزالته**:
- منطق Bootstrap (نقل إلى `joinRequestService`)
- فحص `superAdminCount`
- إنشاء SUPER_ADMIN مباشرة

---

### 2. `packages/core/src/services/join-requests.ts`

**التغيير**: إضافة دالة `createOrBootstrap()` جديدة:

```typescript
async createOrBootstrap(params): Promise<CreateOrBootstrapResult> {
  // فحص أهلية Bootstrap
  const superAdminCount = await prisma.user.count({ where: { role: 'SUPER_ADMIN' } })
  const initialSuperAdminId = env.INITIAL_SUPER_ADMIN_ID ? BigInt(env.INITIAL_SUPER_ADMIN_ID) : null

  // إذا كان Bootstrap مؤهلاً
  if (superAdminCount === 0 && initialSuperAdminId === params.telegramId) {
    // إنشاء SUPER_ADMIN
    const superAdmin = await prisma.user.create({ ... })
    // إنشاء سجل تدقيق
    await prisma.auditLog.create({ action: 'USER_BOOTSTRAP' })
    return { type: 'bootstrap' }
  }

  // وإلا إنشاء طلب انضمام عادي
  const request = await prisma.joinRequest.create({ ... })
  return { type: 'join_request', requestId: request.id }
}
```

---

### 3. `packages/core/src/bot/conversations/join.ts`

**التغييرات**:

1. **استدعاء `createOrBootstrap()` بدلاً من `create()`**:
```typescript
const result = await joinRequestService.createOrBootstrap({ ... })

if (result.type === 'bootstrap') {
  await ctx.editMessageText(ctx.t('welcome_super_admin_new'))
} else {
  const requestCode = result.requestId.substring(0, 8).toUpperCase()
  await ctx.editMessageText(ctx.t('join_request_received', { requestCode, date }))
}
```

2. **إزالة الفحوصات المكررة**:
   - إزالة فحص `hasPendingRequest` (موجود في `start.ts`)
   - إزالة فحص `existingUser` (موجود في `start.ts`)

3. **تحديث شاشة التأكيد**:
   - عرض جميع الحقول: fullName, nickname, phone, nationalId, birthDate (DD/MM/YYYY), gender (ذكر/أنثى)

---

### 4. `packages/core/src/locales/ar.ftl`

**المفاتيح الجديدة**:
- `join_welcome` - رسالة الترحيب
- `join_step_name` - الخطوة 1: الاسم
- `join_step_nickname` - الخطوة 2: الاسم المستعار
- `join_step_phone` - الخطوة 3: رقم الهاتف
- `join_step_national_id` - الخطوة 4: الرقم القومي
- `join_confirm` - مراجعة البيانات
- `join_request_already_pending` - طلب معلق
- `join_request_received` - تم استلام الطلب
- `join_cancelled` - تم الإلغاء
- `welcome_super_admin_new` - ترحيب SUPER_ADMIN
- `join_approved` - تمت الموافقة
- `join_rejected` - تم الرفض
- رسائل الخطأ المحدثة

---

### 5. `packages/core/src/locales/en.ftl`

**التغيير**: ترجمة إنجليزية لجميع المفاتيح العربية أعلاه.

---

### 6. `specs/001-platform-core/spec.md`

**التغيير**: تحديث FR-014 ليعكس التدفق الموحد:

```
FR-014 (Bootstrap Lock - Unified Flow):
1. فحص Bootstrap يتم داخل createOrBootstrap() بعد جمع البيانات
2. لا يوجد محادثة Bootstrap منفصلة
3. التدفق الموحد يتعامل مع Bootstrap و Join Request
```

**إضافة**: توضيح في جلسة 2026-02-23 يشرح قرار التدفق الموحد.

---

### 7. `specs/001-platform-core/tasks.md`

**المهام المحدثة**:
- ✅ T022-B: Bootstrap Lock داخل `createOrBootstrap()`
- ✅ T023-B: لا حاجة لمحادثة Bootstrap منفصلة
- ✅ T028: منطق "pending approval" مُنفذ
- ➕ T066-B: مهمة جديدة لتدقيق جلسات المستخدم

---

## ملفات الاختبار

### الملفات المحذوفة:
1. `packages/core/tests/unit/bot/handlers/start.test.ts` (قديم)
2. `packages/core/tests/integration/bot/start-to-join-flow.test.ts` (قديم)

### الملفات المنشأة:
1. `packages/core/tests/unit/bot/handlers/start.test.ts` (جديد)
   - اختبارات للحالات الثلاث: مستخدم موجود، طلب معلق، مستخدم جديد

2. `packages/core/tests/integration/bot/start-to-join-flow.test.ts` (جديد)
   - اختبارات تكامل للتدفق الكامل

3. `packages/core/tests/unit/services/join-requests.test.ts` (جديد)
   - اختبارات لـ `createOrBootstrap()`
   - اختبارات لـ `hasPendingRequest()`
   - اختبارات لـ `create()`

---

## الالتزامات (Commits)

1. **`8165a64`**: `refactor(start): unify /start flow — bootstrap logic moves to joinRequestService [T023-B, T022-B]`

2. **`bbbc667`**: `refactor(join): remove redundant hasPendingRequest check — already handled in start.ts [T073-partial]`

3. **`4c5467e`**: `refactor(join): remove redundant user existence check — already handled in start.ts [T073-partial-2]`

---

## الفوائد

1. **تبسيط الكود**: مسار واحد لجميع المستخدمين الجدد
2. **أمان أفضل**: Bootstrap يتم بعد جمع البيانات وليس قبلها
3. **صيانة أسهل**: لا يوجد محادثة Bootstrap منفصلة
4. **تدفق أوضح**: الفصل بين `startHandler` (توجيه) و `joinRequestService` (منطق)

---

## ملاحظات تقنية

- النوع `CreateOrBootstrapResult` هو discriminated union:
  ```typescript
  type CreateOrBootstrapResult =
    | { type: 'bootstrap' }
    | { type: 'join_request'; requestId: string }
  ```

- الـ TODO في `notifyAdmins()`:
  ```
  TODO: T053/T054 — Replace with notificationService.queue() when BullMQ is ready
  ```

---

## حالة الاختبارات

⚠️ **جاري العمل**: الاختبارات تحتاج إلى إصلاح بسبب مشاكل في إعداد Vitest. الأخطاء الحالية:
- "No test suite found in file" - قد تكون مشكلة في الـ mocks أو الـ imports

---

*تم إنشاء هذا التوثيق في: 2026-02-23*
