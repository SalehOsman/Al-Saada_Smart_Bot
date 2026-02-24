# أدوات المحادثة المشتركة (Shared Bot Utilities)

**المسار:** `packages/core/src/bot/utils/`
**أُنشئت في:** 2026-02-24
**المهام:** T088, T089, T090, T091

---

## الهدف

تجميع كل الأكواد المتكررة بين تدفقات البوت المختلفة في وحدات مشتركة قابلة لإعادة الاستخدام.
أي تدفق جديد (HR، مصروفات، إلخ) يستورد من هنا بدلاً من إعادة كتابة نفس المنطق.

---

## الملفات

### 1. `conversation.ts` — أدوات المحادثة

أدوات التتبع والانتظار والإلغاء المشتركة بين جميع التدفقات.

#### `createMessageTracker()` / `trackMessage()` / `deleteTrackedMessages()`
تتبع رسائل التدفق وحذفها دفعة واحدة قبل الرسالة النهائية — لتجربة مستخدم نظيفة.

```ts
const tracker = createMessageTracker()
// ... أثناء التدفق تُتتبع الرسائل تلقائياً
await deleteTrackedMessages(ctx, tracker) // قبل الرسالة النهائية
```

#### `waitForTextOrCancel(conversation, ctx, prompt, options)`
يُرسل prompt مع زر إلغاء. يُرجع `string` أو `null` عند الإلغاء.

#### `waitForSkippable(conversation, ctx, prompt, skipLabel, options)`
يُرسل prompt مع زري تخطي + إلغاء. يُرجع `string | '__skip__' | null`.

#### `waitForConfirm(conversation, ctx, text, options)`
شاشة تأكيد بزري تأكيد/إلغاء. يُرجع `boolean`.

#### `sendCancelled(ctx, message, options)`
رسالة إلغاء موحدة مع زر إعادة المحاولة الاختياري.

---

### 2. `user-inputs.ts` — جامعات المدخلات المصرية

#### `normalizeDigits(input)`
يحوّل الأرقام العربية-الهندية (٠-٩) والفارسية (۰-۹) إلى ASCII (0-9).
مُطبَّق تلقائياً في جميع حقول الأرقام.

```ts
normalizeDigits('٠١٢٣٤٥٦٧٨٩') // '0123456789'
```

#### `askForArabicName(ctx, wait)`
يتحقق من الاسم العربي (حروف عربية فقط، حد أدنى كلمتين).
يُرجع `string` أو `''` عند الإلغاء.

#### `generateNickname(fullName)`
يُولّد اسم الشهرة من أول كلمتين مع دعم الأسماء المركبة.

| الاسم الكامل | اسم الشهرة المُولَّد |
|---|---|
| صالح رجب محمد عثمان | صالح رجب |
| عبد الله أحمد | عبد الله |
| أبو بكر حسين | أبو بكر |
| عبد الله عبد الرحمن | عبد الله |

البادئات المركبة المدعومة: `عبد`، `عبده`، `أبو`، `ابو`، `أبي`، `ابي`، `ابن`، `بنت`، `آل`

#### `askForPhone(ctx, wait)`
يتحقق من رقم الهاتف المصري (010/011/012/015) ويتحقق من عدم تكراره في DB.
يُرجع `string` أو `''` عند الإلغاء.

#### `askForNationalId(ctx, wait)`
يتحقق من الرقم القومي المصري (14 رقماً) ويستخرج تاريخ الميلاد والجنس.
يُرجع `NationalIdInfo | null` عند الإلغاء.

```ts
// NationalIdInfo
{
  nationalId: string
  birthDate?: Date
  gender?: 'MALE' | 'FEMALE'
}
```

---

### 3. `formatters.ts` — المنسقات والإشعارات

#### `formatArabicDate(date)`
يُنسّق التاريخ بصيغة `DD/MM/YYYY`. يُرجع `'value_unknown'` (مفتاح i18n) إذا كان التاريخ غير موجود.

```ts
formatArabicDate(new Date('1990-06-15')) // '15/06/1990'
formatArabicDate(undefined)              // 'value_unknown'
```

#### `formatGender(gender)`
يُرجع **مفتاح i18n** وليس نصاً مباشراً — مبدأ i18n-Only.

```ts
ctx.t(formatGender('MALE'))    // ذكر  (من ar.ftl)
ctx.t(formatGender('FEMALE'))  // أنثى (من ar.ftl)
ctx.t(formatGender(undefined)) // غير محدد (من ar.ftl)
```

#### `notifyAdmins(ctx, payload)`
يكتب إشعاراً لجميع SUPER_ADMIN و ADMIN النشطين في DB.

> **TODO T053/T054:** استبدالها بـ `notificationService.queue()` عند جاهزية BullMQ.

---

### 4. `index.ts` — Barrel Export

```ts
export * from './conversation'
export * from './user-inputs'
export * from './formatters'
```

---

## نمط الاستخدام في التدفقات

```ts
import {
  createMessageTracker, deleteTrackedMessages,
  waitForTextOrCancel, waitForSkippable, waitForConfirm, sendCancelled,
} from '../utils/conversation'
import { askForArabicName, askForPhone, askForNationalId, generateNickname } from '../utils/user-inputs'
import { formatArabicDate, formatGender, notifyAdmins } from '../utils/formatters'

export async function myConversation(conversation, ctx) {
  const tracker = createMessageTracker()
  const wait = (prompt: string) => waitForTextOrCancel(conversation, ctx, prompt, { tracker })

  const name = await askForArabicName(ctx, wait)
  if (!name) { await deleteTrackedMessages(ctx, tracker); await sendCancelled(ctx, ctx.t('cancelled')); return }

  // ... باقي الخطوات

  await deleteTrackedMessages(ctx, tracker) // حذف رسائل التدفق
  await ctx.reply(ctx.t('success'))         // الرسالة النهائية النظيفة
}
```

---

## مفاتيح i18n المرتبطة

| المفتاح | القيمة (ar) |
|---|---|
| `gender_male` | ذكر |
| `gender_female` | أنثى |
| `gender_unknown` | غير محدد |
| `value_unknown` | غير محدد |
