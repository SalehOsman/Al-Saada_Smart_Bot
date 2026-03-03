# توثيق الأمر التنفيذي
# Command Log — إضافة Slug لـ Section و Module (L1 + L2)

---

## معلومات الأمر

| البند | التفصيل |
|-------|---------|
| **رقم الأمر** | CMD-DOC-002 |
| **تاريخ الإعداد** | 2026-02-23 |
| **أعدّه** | المستشار التقني |
| **يُنفَّذ بواسطة** | المنفّذ (Executor) |
| **الملفات المستهدفة** | `specs/001-platform-core/data-model.md` ، `specs/001-platform-core/spec.md` |
| **نوع الأمر** | تعديل توثيق — `/speckit.implement` |
| **المرجع** | `speckit.analyze` — Issue L1 و L2 |

---

## سبب الأمر

اكتشف `speckit.analyze` مشكلتين معماريتين تمنعان البدء في التنفيذ:

**L1 — تعارض ربط Module بـ Section:**
`ModuleConfig` يستخدم `sectionId` (CUID ديناميكي) — المطوّر لا يعرف هذا الـ id وقت كتابة الـ config لأنه يُولَّد في قاعدة البيانات.

**L2 — هوية Module غير مستقرة:**
جدول `Module` يعتمد على `id` (CUID) كمعرّف وحيد — يتغير عند كل إعادة تحميل، مما يُيتّم أي `AdminScope` أو `AuditLog` يشير إليه.

**الحل المعتمد:** إضافة حقل `slug` ثابت وفريد لكل من `Section` و `Module`.

---

## المدخلات للمنفّذ

على المنفّذ قراءة الملفات التالية قبل تشغيل الأمر:

| الملف | الغرض |
|-------|--------|
| `specs/001-platform-core/data-model.md` | الـ Prisma schema الحالي |
| `specs/001-platform-core/spec.md` | تعريف ModuleConfig و Key Entities |

---

## التعديلات المطلوبة بالتفصيل

### 1. جدول Section — إضافة slug

```prisma
model Section {
  id          String    @id @default(cuid())
  slug        String    @unique  // ← جديد: مثل "hr", "warehouse", "finance"
  name        String
  nameEn      String
  icon        String
  isActive    Boolean   @default(true) @map("is_active")
  orderIndex  Int       @default(0) @map("order_index")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  createdBy   BigInt?   @map("created_by")

  creator     User?     @relation("SectionCreator", fields: [createdBy], references: [telegramId])
  modules     Module[]

  @@map("sections")
}
```

**قاعدة الـ slug:** أحرف إنجليزية صغيرة وأرقام وشرطات فقط — مثل `"hr"`, `"warehouse"`, `"finance"`.
يُدخله الـ Super Admin وقت إنشاء الـ Section. لا يتغير بعد الإنشاء.

---

### 2. جدول Module — إضافة slug و sectionSlug

```prisma
model Module {
  id           String    @id @default(cuid())
  slug         String    @unique  // ← جديد: مثل "hr-employee-registration"
  sectionSlug  String    @map("section_slug")  // ← بديل sectionId
  name         String
  nameEn       String
  icon         String
  isActive     Boolean   @default(true) @map("is_active")
  orderIndex   Int       @default(0) @map("order_index")
  configPath   String    @map("config_path")
  createdAt    DateTime  @default(now()) @map("created_at")

  section      Section   @relation(fields: [sectionSlug], references: [slug])

  @@map("modules")
}
```

---

### 3. AdminScope — استخدام scopeSlug بدلاً من scopeId

```prisma
model AdminScope {
  id          String    @id @default(cuid())
  adminUserId BigInt    @map("admin_user_id")
  scopeType   ScopeType
  scopeSlug   String    @map("scope_slug")  // ← بديل scopeId: يشير لـ Section.slug أو Module.slug
  createdAt   DateTime  @default(now()) @map("created_at")

  adminUser   User      @relation(fields: [adminUserId], references: [telegramId])

  @@unique([adminUserId, scopeType, scopeSlug])
  @@map("admin_scopes")
}
```

---

### 4. تعريف ModuleConfig في spec.md — تحديث

في قسم **Definitions → ModuleConfig**، استبدال:
```
- sectionId (links to organizational section)
```
بـ:
```
- sectionSlug (stable identifier linking to Section — e.g., "hr", "warehouse")
- slug (unique stable identifier for this module — e.g., "hr-employee-registration")
```

---

### 5. قاعدة Slug في data-model.md — إضافة

في قسم **Data Validation Rules**، إضافة:

```typescript
// Slug validation — lowercase letters, numbers, hyphens only
const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
// Examples: "hr", "warehouse", "hr-employee-registration"
// Max length: 60 characters
```

---

### 6. تحديث Business Logic Constraints — قاعدة Module Discovery

في قسم **Module Discovery Rules**، استبدال:
```
- Modules are automatically assigned to sections via config
```
بـ:
```
- Modules link to sections via sectionSlug (stable, developer-defined)
- Module slug must be unique across all modules
- Section slug must be unique across all sections
- AdminScope references scopeSlug (Section.slug or Module.slug) for stable permission tracking
- AuditLog targetId stores slug for modules/sections (not CUID) for stable audit trail
```

---

## نص الأمر المُرسَل للمنفّذ

```
/speckit.implement

Target files:
- specs/001-platform-core/data-model.md
- specs/001-platform-core/spec.md

DO NOT modify any code files. Documentation edits ONLY.

EDIT 1 — data-model.md: Section model
Add `slug String @unique` field after `id` field.
Add slug rule in Data Validation Rules section.

EDIT 2 — data-model.md: Module model
Replace `sectionId String @map("section_id")` with `sectionSlug String @map("section_slug")`.
Add `slug String @unique` field after `id` field.
Update @relation to use `references: [slug]` on Section.

EDIT 3 — data-model.md: AdminScope model
Replace `scopeId String @map("scope_id")` with `scopeSlug String @map("scope_slug")`.
Update @@unique constraint to use scopeSlug.
Update comment to explain scopeSlug references Section.slug or Module.slug.

EDIT 4 — data-model.md: Module Discovery Rules
Update rule to explain sectionSlug linking strategy and slug stability guarantee.

EDIT 5 — spec.md: Definitions → ModuleConfig
Replace `sectionId` with `sectionSlug` and add `slug` field description.

EDIT 6 — data-model.md: Indexes
Add index for Section.slug and Module.slug.

Commit with: "docs(data-model,spec): add slug fields to Section/Module/AdminScope — resolve L1 Module-Section linking and L2 Module identity stability"
```

---

## التحقق بعد التنفيذ (مسؤولية المستشار)

| بند التحقق | المعيار |
|------------|---------|
| `Section` يحتوي على `slug @unique` | ✅ / ❌ |
| `Module` يحتوي على `slug @unique` | ✅ / ❌ |
| `Module` يستخدم `sectionSlug` وليس `sectionId` | ✅ / ❌ |
| `AdminScope` يستخدم `scopeSlug` وليس `scopeId` | ✅ / ❌ |
| `ModuleConfig` في spec.md محدَّث | ✅ / ❌ |
| slug validation rule موجود | ✅ / ❌ |
| لا يوجد تعديل على أي كود `.ts` | ✅ / ❌ |

---

## نتائج التنفيذ

*(تُملأ بعد التنفيذ)*

### الحالة العامة: ⏳ في الانتظار

### Git Commit:
```
[لم يُنفَّذ بعد]
```

### ملاحظات المراجعة:
*(تُضاف بعد قراءة الملفات الناتجة)*
