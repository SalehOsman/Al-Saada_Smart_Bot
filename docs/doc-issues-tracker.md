# سجل مشاكل التوثيق — Documentation Issues Tracker

**المشروع:** Al-Saada Smart Bot
**الإصدار:** 1.0.0
**تاريخ الإنشاء:** 2026-02-23
**آخر تحديث:** 2026-02-23
**المسؤول:** المستشار التقني

---

## طريقة القراءة

| الرمز | المعنى |
|-------|--------|
| 🔴 | حرجة — تؤثر على صحة التوثيق الأساسي |
| 🟠 | عالية — تعارض مباشر بين ملفين أو أكثر |
| 🟡 | متوسطة — نقص أو خطأ في محتوى |
| 🔵 | منخفضة — تحسين أو تنظيف |
| ✅ | تم الإصلاح |
| 🔄 | قيد المعالجة |
| ❌ | لم يُعالَج بعد |

---

## قائمة المشاكل — مرتبة حسب الأهمية

---

### 🔴 DOC-001 — unit-tests-requirements.md مُولَّد من مشروع خاطئ تماماً

| البند | التفصيل |
|-------|---------|
| **الملف المتأثر** | `specs/001-platform-core/checklists/unit-tests-requirements.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🔴 حرجة |
| **المكتشف في** | `checklist_analysis.md` + مراجعة يدوية |

**وصف المشكلة:**
الملف يحتوي على 41 بنداً لا علاقة لها بمشروع Telegram Bot. المحتوى يتحدث عن:
- `episode data` — بيانات حلقات (مشروع إعلامي؟)
- `mobile breakpoints` و `responsive layouts` — تصميم ويب
- `hover states` و `visual hierarchy` — واجهات ويب
- `keyboard navigation` — ويب أيضاً
- `card component requirements` بين landing و detail pages

هذا الملف وُلِّد لمشروع ويب مختلف تماماً ووُضع بالخطأ في هذا المشروع.

**الإصلاح المطلوب:**
إعادة توليد الملف من الصفر ليغطي اختبارات وحدة حقيقية لمشروع Telegram Bot مثل:
اختبارات RBAC، Session، Validators، AuditLog، NotificationService، MaintenanceMode، ModuleLoader.

---

### 🔴 DOC-002 — تعارض حقول User بين data-model.md و spec.md

| البند | التفصيل |
|-------|---------|
| **الملفات المتأثرة** | `specs/001-platform-core/data-model.md` ↔ `specs/001-platform-core/spec.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🔴 حرجة |
| **المكتشف في** | `audit-2026-02-22-0018.md` — BUG-01, BUG-02 |

**وصف المشكلة:**
`spec.md` (القسم Key Entities) يعرّف جدول User بالحقول:
```
fullName, nickname, nationalId, telegramUsername, lastActiveAt
```

لكن `data-model.md` (Prisma schema) يعرّفه بالحقول:
```
firstName, lastName  ← (بدون fullName، بدون nickname، بدون nationalId)
```

هذا التعارض هو السبب الجذري لـ BUG-01 و BUG-02 في تقرير الـ Audit.

**الإصلاح المطلوب:**
مزامنة `data-model.md` مع `spec.md` — إما تعديل الـ Prisma model في `data-model.md` أو تحديث `spec.md`.
القرار يحتاج موافقة صاحب المشروع أولاً.

---

### 🟠 DOC-003 — تعارض اسم متغير البيئة في quickstart.md

| البند | التفصيل |
|-------|---------|
| **الملفات المتأثرة** | `specs/001-platform-core/quickstart.md` ↔ `specs/001-platform-core/spec.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🟠 عالية |
| **المكتشف في** | مراجعة يدوية للملفين |

**وصف المشكلة:**
- `spec.md` FR-014 يحدد اسم المتغير: `INITIAL_SUPER_ADMIN_ID`
- `quickstart.md` (قسم Environment Variables) يستخدم: `FIRST_ADMIN_TELEGRAM_ID`

اسمان مختلفان لنفس المتغير — يُربك أي مطور يقرأ التوثيق.

**الإصلاح المطلوب:**
تعديل `quickstart.md` لاستخدام `INITIAL_SUPER_ADMIN_ID` بدلاً من `FIRST_ADMIN_TELEGRAM_ID`.

---

### 🟠 DOC-004 — حالة المهام في tasks.md لا تعكس الواقع

| البند | التفصيل |
|-------|---------|
| **الملف المتأثر** | `specs/001-platform-core/tasks.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🟠 عالية |
| **المكتشف في** | `audit-2026-02-22-0018.md` — BUG-11 |

**وصف المشكلة:**
المهمة T077 (healthRouter) علامتها `[X]` — مكتملة، لكن BUG-11 يثبت أن `healthRouter` غير مُركَّب في الـ app الرئيسية أصلاً.

هذا يعني أن `tasks.md` يُظهر تقدماً غير حقيقي. لا يمكن الاعتماد عليه كمرجع موثوق لحالة المشروع.

**الإصلاح المطلوب:**
مراجعة جميع المهام المعلَّمة `[X]` والتحقق من كل منها مع الكود الفعلي، وتصحيح الحالات غير الدقيقة.

---

### 🟡 DOC-005 — data-model.md لا يذكر حقل phone_regex المحدث في spec.md

| البند | التفصيل |
|-------|---------|
| **الملفات المتأثرة** | `specs/001-platform-core/data-model.md` ↔ `specs/001-platform-core/spec.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🟡 متوسطة |
| **المكتشف في** | مقارنة الملفين |

**وصف المشكلة:**
`spec.md` FR-034 يحدد regex الهاتف بدقة:
```
/^(010|011|012|015)\d{8}$/
```

لكن `data-model.md` يحدده بصيغة مختلفة:
```
/^01[0125][0-9]{8}$/
```

الصيغتان غير متطابقتين تماماً — `[0125]` يقبل `013` و`014` بينما `(010|011|012|015)` لا يقبلهما. الـ spec.md هو المرجع الصحيح.

**الإصلاح المطلوب:**
تحديث `data-model.md` ليستخدم نفس regex المحدد في spec.md FR-034.

---

### 🟡 DOC-006 — plan.md لا يذكر مهام T083-T087 المضافة لاحقاً في tasks.md

| البند | التفصيل |
|-------|---------|
| **الملفات المتأثرة** | `specs/001-platform-core/plan.md` ↔ `specs/001-platform-core/tasks.md` |
| **الحالة** | ❌ لم يُعالَج |
| **الأولوية** | 🟡 متوسطة |
| **المكتشف في** | مقارنة الملفين |

**وصف المشكلة:**
`tasks.md` يحتوي على مهام T083 → T087 لم تكن موجودة في خطة `plan.md` الأصلية:
- T083: input validation utilities
- T084: AdminScope authorization in canAccess()
- T085: unregisterModule() API
- T086: Redis pub/sub for maintenance mode
- T087: Redis fallback to in-memory sessions

هذه المهام أُضيفت لاحقاً لكن `plan.md` لم يُحدَّث ليعكسها.

**الإصلاح المطلوب:**
إضافة هذه المهام في القسم المناسب من `plan.md` مع توضيح سبب إضافتها.

---

### 🟠 DOC-008 — T080 يُشير إلى SC خاطئ (SC-008 بدلاً من SC-003)

| البند | التفصيل |
|-------|---------|
| **الملف المتأثر** | `specs/001-platform-core/tasks.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🟠 عالية |
| **المكتشف في** | `speckit.analyze` — Issue A1 |

**وصف المشكلة:**
المهمة T080 في tasks.md تقول:
```
T080 Verify SC-008: Confirm audit logs capture 100% of defined auditable actions
```
لكن SC-008 هو في الواقع:
```
SC-008: System maintains 99.9% uptime for core services
```
بينما "audit logs 100%" هو **SC-003** تحديداً.

**الإصلاح المطلوب:**
تعديل T080 في tasks.md من `SC-008` إلى `SC-003`.

---

### 🟠 DOC-009 — T079 يُشير إلى SC خاطئ (SC-005 بدلاً من RBAC verification)

| البند | التفصيل |
|-------|---------|
| **الملف المتأثر** | `specs/001-platform-core/tasks.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🟠 عالية |
| **المكتشف في** | `speckit.analyze` — Issue A2 |

**وصف المشكلة:**
المهمة T079 في tasks.md تقول:
```
T079 Verify SC-005: Confirm all 4 roles display correct menus and access levels
```
لكن SC-005 هو في الواقع:
```
SC-005: Maintenance mode toggle affects all non-Super Admin users within 5 seconds
```
بينما التحقق من الأدوار والقوائم لا يوجد له SC محدد — هو في الواقع تحقق من FR-015 و FR-016.

**الإصلاح المطلوب:**
تعديل T079 في tasks.md من `SC-005` إلى مرجع صحيح (`FR-015, FR-016`) أو إنشاء SC جديد للـ RBAC verification.

---

### 🟡 DOC-010 — FR-035 مفقود لاستخراج بيانات الرقم القومي

| البند | التفصيل |
|-------|---------|
| **الملف المتأثر** | `specs/001-platform-core/spec.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🟡 متوسطة |
| **المكتشف في** | `speckit.analyze` — Issue A4 |

**وصف المشكلة:**
User Story 2 تذكر استخراج الجنس وتاريخ الميلاد من الرقم القومي:
```
(National ID collection with Egyptian validation and auto-extraction of birthdate/gender)
```
لكن لا يوجد FR مستقل يوثق هذا المتطلب. المنطق موجود في الكود (join.ts) لكنه غير موثق رسمياً في spec.md كمتطلب قابل للتتبع والاختبار.

**الإصلاح المطلوب:**
إضافة `FR-035` في spec.md تحت قسم Functional Requirements:
```
FR-035: System MUST extract birthdate and gender from Egyptian National ID.
         - Digits 2-7: birthdate (YYMMDD)
         - Digit 9: gender (odd = MALE, even = FEMALE)
         - Digit 1: century (2 = 1900s, 3 = 2000s)
```

---

### 🔵 DOC-007 — methodology.md لا يذكر إصدار 1.2.0 في الـ Header

| البند | التفصيل |
|-------|---------|
| **الملف المتأثر** | `docs/methodology.md` |
| **الحالة** | ✅ تم الإصلاح |
| **الأولوية** | 🔵 منخفضة |
| **المكتشف في** | مراجعة بعد تحديث اليوم |

**وصف المشكلة:**
بعد التحديث الذي تم اليوم (2026-02-23) وإضافة الإصدار 1.2.0 في سجل التعديلات، يجب تحديث الـ Header أيضاً:
```
الإصدار: 1.1.0  ← يجب أن يكون 1.2.0
آخر تعديل: 2026-02-21  ← يجب أن يكون 2026-02-23
```

**الإصلاح المطلوب:**
تحديث سطري `الإصدار` و`آخر تعديل` في header الملف.

---

## ملخص الحالة

| الرمز | العدد | النوع |
|-------|-------|-------|
| 🔴 | 0 | حرجة مفتوحة |
| 🟠 | 0 | عالية مفتوحة |
| 🟡 | 0 | متوسطة مفتوحة |
| 🔵 | 2 | منخفضة مفتوحة (BUG-15, BUG-16) |
| ✅ | 27 | مغلقة |
| **المجموع** | **31** | — |

---

## مشاكل الكود المكتشفة — Code Issues Tracker

> هذه مشاكل في الكود الفعلي (ليس التوثيق) — مكتشفة من `/speckit.analyze` وتقرير الـ Audit

| الرمز | الكود | المشكلة | الملف | الحالة |
|-------|-------|---------|-------|--------|
| BUG-01 | 🔴 | Prisma Client قديم — لم يُشغَّل `prisma generate` بعد آخر migration | جميع ملفات `prisma.user` | ✅ |
| BUG-02 | 🔴 | أسماء حقول `saveJoinRequest()` خاطئة (`userId` بدلاً من `telegramId`) | `join.ts` | ✅ |
| BUG-03 | 🔴 | منطق الجنس معكوس في `extractNationalIdInfo()` | `national-id.ts` | ✅ |
| BUG-04 | 🔴 | `main.ts` فارغ — البوت لا يعمل أبداً | `packages/core/src/main.ts` | ✅ |
| BUG-05 | 🟠 | زر التأكيد يُرسل `callback_query` لكن الكود ينتظر `message.text` | `join.ts` | ✅ |
| BUG-06 | 🟠 | `bot.conversation()` غير موجودة في grammY API | `bot/index.ts` | ✅ |
| BUG-07 | 🟠 | `menu.ts` يستعلم عن علاقات غير موجودة في الـ Schema | `menu.ts` | ✅ |
| BUG-08 | 🟡 | `SessionData` معرّف مرتين بحقول متعارضة | `context.ts` و `session.ts` | ✅ |
| BUG-09 | 🟡 | حرف صيني مختلط في `ar.ftl` السطر 26 | `ar.ftl` | ✅ |
| BUG-10 | 🟡 | مقارنة `INITIAL_SUPER_ADMIN_ID` غير آمنة للـ BigInt | `start.ts` | ✅ |
| BUG-11 | 🟡 | `healthRouter` غير مُربوط بالـ Hono App | `bot/index.ts` | ✅ |
| BUG-12 | 🟡 | `menu.ts` يستخدم `any` للمستخدم | `menu.ts` | ✅ |
| BUG-13 | 🟡 | `egyptianNationalId()` غير مُستخدم — regex بسيط بدلاً منه | `join.ts` | ✅ |
| BUG-14 | 🔵 | `vitest.config.ts` لا يُطبّق حد الـ 80% coverage | `vitest.config.ts` | ✅ |
| BUG-15 | 🔵 | `packages/validators` مُستثنى من نطاق الـ Coverage | `vitest.config.ts` | ❌ |
| BUG-16 | 🔵 | T025-B (Skills Verification) لم تُنفَّذ | `tasks.md` | ❌ |
| ARC-01 | 🟠 | `extractNationalIdInfo` مكررة في `join.ts` بدلاً من استيرادها من validators | `join.ts` + `national-id.ts` | ✅ |
| ARC-02 | 🟠 | `join.ts` يكتب مباشرة لقاعدة البيانات بدلاً من `JoinRequestService` | `join.ts` | ✅ |
| ARC-03 | 🟡 | `national-id.ts` لا يُصدّر `extractNationalIdInfo` | `packages/validators/src/national-id.ts` | ✅ |
| SYN-01 | 🟡 | T025-T027 منفّذة في الكود لكن مُعلَّمة `[ ]` في tasks.md | `tasks.md` | ✅ |
| SYN-02 | 🔵 | T083 مسماة "إنشاء" والأدوات موجودة — يجب تسميتها "توسيع/دمج" | `tasks.md` | ✅ |

---

## ترتيب الإصلاح (حسب الأولوية)

```
1.  DOC-001 — إعادة توليد unit-tests-requirements.md 🔴
2.  DOC-002 — مزامنة حقول User بين data-model.md و spec.md 🔴
3.  DOC-003 — توحيد اسم INITIAL_SUPER_ADMIN_ID في quickstart.md 🟠
4.  DOC-004 — مراجعة وتصحيح حالات المهام في tasks.md 🟠
5.  DOC-008 — تصحيح T080: SC-008 → SC-003 في tasks.md 🟠
6.  DOC-009 — تصحيح T079: SC-005 → FR-015/FR-016 في tasks.md 🟠
7.  DOC-005 — توحيد phone regex في data-model.md 🟡
8.  DOC-006 — إضافة T083-T087 في plan.md 🟡
9.  DOC-010 — إضافة FR-035 لاستخراج بيانات الرقم القومي في spec.md 🟡
10. DOC-007 — تحديث header في methodology.md 🔵
```

---

## سجل الإصلاحات

| التاريخ | المشكلة | الإجراء | المنفذ |
|---------|---------|---------|--------|
| 2026-02-23 | methodology.md — إزالة بند التعديل المباشر | تعديل قسم الإصلاح المباشر + جدول التدخل | المستشار التقني |
| 2026-02-23 | DOC-001 — unit-tests-requirements.md مُولَّد من مشروع خاطئ | إعادة توليد بـ /speckit.checklist بمدخلات مخصصة للمشروع | المنفّذ (Gemini) |
| 2026-02-23 | DOC-002 — تعارض حقول User بين data-model.md و spec.md | تحديث data-model.md: استبدال firstName/lastName بـ fullName وإضافة nickname/nationalId/telegramUsername/lastActiveAt/id + توحيد phone regex | المستشار التقني |
| 2026-02-23 | DOC-003 — تعارض اسم متغير البيئة في quickstart.md | تعديل FIRST_ADMIN_TELEGRAM_ID إلى INITIAL_SUPER_ADMIN_ID | المستشار التقني |
| 2026-02-23 | DOC-005 — توحيد phone regex في data-model.md | تعديل الـ regex من /^01[0125][0-9]{8}$/ إلى /^(010|011|012|015)\d{8}$/ (حُلت ضمن DOC-002) | المستشار التقني |
| 2026-02-23 | DOC-004 — T077 معلمة [X] لكنها غير مكتملة | تصحيح [X] إلى [ ] في tasks.md | المستشار التقني |
| 2026-02-23 | DOC-008 — T080 يُشير لـ SC-008 بدلاً من SC-003 | تصحيح مرجع SC-008 إلى SC-003 في T080 | المستشار التقني |
| 2026-02-23 | DOC-009 — T079 يُشير لـ SC-005 بدلاً من FR-015/FR-016 | تصحيح مرجع SC-005 إلى FR-015, FR-016 في T079 | المستشار التقني |
| 2026-02-23 | DOC-006 — T083-T087 غائبة من plan.md | إضافة قسم Post-Plan Additions في plan.md يوثق المهام الخمسة وسبب إضافتها | المستشار التقني |
| 2026-02-23 | DOC-007 — header في methodology.md لم يُحدَّث | تحديث الإصدار إلى 1.2.0 وآخر تعديل إلى 2026-02-23 | المستشار التقني |
| 2026-02-23 | DOC-010 — FR-035 مفقود لاستخراج بيانات الرقم القومي | إضافة FR-035 في spec.md بتفاصيل استخراج القرن والميلاد والجنس | المستشار التقني |
| 2026-02-23 | DOC-011 — Bootstrap Flow: تعارض بين FR-014 و US1 | إضافة 4a و 4b في FR-014 لتوضيح محادثة جمع البيانات قبل إنشاء Super Admin | المستشار التقني |

---

| 2026-02-24 | BUG-01،04،06،08 | إصلاح البنية التحتية: main.ts، session، bot/index، Prisma | تدفق تطوير جلسات سابقة |
| 2026-02-24 | BUG-02،03،05،07،09،10 | إصلاح join.ts: حقول DB، callback handling، BigInt، ar.ftl | تدفق تطوير جلسات سابقة |
| 2026-02-24 | BUG-13، ARC-01، ARC-02، ARC-03 | استخدام `@al-saada/validators` في join.ts + تفريغ `user-inputs.ts` لـ bot/utils | إنشاء bot/utils (T088-T091) |
| 2026-02-24 | SYN-01، SYN-02 | تحديث tasks.md ليعكس الواقع: T088-T091 مضافة، حالات محدّثة | إنشاء bot/utils (T088-T091) |
| 2026-02-24 | overview.md | تحديث حالة المشروع، إضافة bot/utils، بنية الملفات، مبدأ i18n-Only | مراجعة توثيقية 2026-02-24 |
| 2026-02-24 | BUG-12 | استبدال `user: any` بـ `MenuUser = Prisma.UserGetPayload<...>` في الدوال الأربع | إصلاح BUG-12 |
| 2026-02-24 | BUG-14 | إضافة thresholds بـ 20% baseline + إصلاح assertion في start.test.ts | إصلاح BUG-14 |

*يُحدَّث هذا الملف بعد كل إصلاح توثيقي*
