# توثيق الأمر التنفيذي
# Command Log — إعادة توليد unit-tests-requirements.md (DOC-001)

---

## معلومات الأمر

| البند | التفصيل |
|-------|---------|
| **رقم الأمر** | CMD-DOC-001 |
| **تاريخ الإعداد** | 2026-02-23 |
| **أعدّه** | المستشار التقني |
| **يُنفَّذ بواسطة** | المنفّذ (Executor) |
| **الملف المستهدف** | `specs/001-platform-core/checklists/unit-tests-requirements.md` |
| **نوع الأمر** | إعادة توليد توثيق — `/speckit.checklist` |
| **المرجع** | `docs/doc-issues-tracker.md` — DOC-001 |

---

## سبب الأمر

الملف الحالي `unit-tests-requirements.md` يحتوي على 41 سؤالاً مستوردة من مشروع ويب مختلف تماماً. الأسئلة تتحدث عن `episode data`، `hover states`، `mobile breakpoints`، `card components` — وهي مفاهيم لا وجود لها في مشروع Telegram Bot مصري.

النتيجة: الـ checklist لا يعكس الواقع ولا متطلبات المشروع ولا خططه المستقبلية، ولا يمكن الاعتماد عليه لمراجعة جودة التوثيق.

---

## المدخلات للمنفّذ

على المنفّذ قراءة الملفات التالية قبل تشغيل الأمر:

| الملف | الغرض |
|-------|--------|
| `specs/001-platform-core/spec.md` | المصدر الأساسي للمتطلبات (FR-001 إلى FR-034، User Stories، Edge Cases) |
| `specs/001-platform-core/plan.md` | السياق التقني والمعماري (Tech Stack، Constitutional Principles) |
| `specs/001-platform-core/tasks.md` | قائمة المهام الكاملة (91 مهمة، 11 مرحلة) |
| `specs/001-platform-core/checklists/requirements.md` | مثال على checklist صحيح ومقبول في المشروع |

---

## نص الأمر المُرسَل للمنفّذ

```
/speckit.checklist

Target file: specs/001-platform-core/checklists/unit-tests-requirements.md

IMPORTANT CONTEXT — READ BEFORE GENERATING:
The current file contains questions copied from a web project (episodes, hover states,
mobile breakpoints) that have NO relation to this project. You must completely replace
the file content.

This is a Telegram Bot project for Egyptian business management. The checklist must
validate the QUALITY of the requirements in spec.md — not test code.

INPUTS to base the checklist on:
- specs/001-platform-core/spec.md (primary — FR-001 to FR-034, User Stories, Edge Cases)
- specs/001-platform-core/plan.md (technical context)
- specs/001-platform-core/tasks.md (91 tasks, 11 phases)
- specs/001-platform-core/checklists/requirements.md (example of correct format)

REQUIRED SECTIONS (keep these exact section names):
1. Requirement Completeness
2. Requirement Clarity
3. Requirement Consistency
4. Acceptance Criteria Quality
5. Scenario Coverage
6. Edge Case Coverage
7. Non-Functional Requirements
8. Dependencies & Assumptions
9. Ambiguities & Conflicts
10. Traceability
11. Surface & Resolve Issues

CONTENT RULES:
- Every question must reference concepts from THIS project only:
  Bootstrap Lock, Egyptian Phone/National ID validation, RBAC (4 roles),
  Join Request flow, Section management, Module Loader, Maintenance Mode,
  BullMQ Notifications, Redis Sessions, Audit Logging, Bilingual (AR/EN)
- Questions must be answerable by reading spec.md
- Keep total questions between 35-45
- Format: - [ ] CHKxxx Question text? [Category]
- Language: English (same as existing file)

DO NOT include any questions about:
episodes, hover states, visual hierarchy, mobile breakpoints,
card components, keyboard navigation, browser support, landing pages

Commit with: "docs(checklists): regenerate unit-tests-requirements.md for Telegram Bot project — DOC-001"
```

---

## التحقق بعد التنفيذ (مسؤولية المستشار)

بعد انتهاء المنفّذ، على المستشار قراءة الملف الناتج والتحقق من:

| بند التحقق | المعيار |
|------------|---------|
| لا يوجد ذكر لـ episodes أو hover أو mobile | ✅ / ❌ |
| الأسئلة مرتبطة بـ FR محددة من spec.md | ✅ / ❌ |
| تغطية Bootstrap Lock (FR-014) | ✅ / ❌ |
| تغطية Egyptian Validation (FR-034) | ✅ / ❌ |
| تغطية RBAC الـ 4 أدوار (FR-015) | ✅ / ❌ |
| تغطية Audit Log (FR-026) | ✅ / ❌ |
| تغطية Maintenance Mode (FR-022) | ✅ / ❌ |
| عدد الأسئلة بين 35-45 | ✅ / ❌ |
| الصيغة: `- [ ] CHKxxx ... [Category]` | ✅ / ❌ |

---

## نتائج التنفيذ

### الحالة العامة: ✅ نجاح كامل

### Git Commit:
```
[001-platform-core db0475e] docs(checklists): regenerate unit-tests-requirements.md for Telegram Bot project — DOC-001
1 file changed, 68 insertions(+), 79 deletions(-)
```

### نتائج التحقق:

| بند التحقق | النتيجة |
|------------|----------|
| لا يوجد ذكر لـ episodes أو hover أو mobile | ✅ |
| الأسئلة مرتبطة بـ FR محددة من spec.md | ✅ |
| تغطية Bootstrap Lock (FR-014) | ✅ CHK001, CHK025, CHK031 |
| تغطية Egyptian Validation (FR-034) | ✅ CHK004, CHK006, CHK035 |
| تغطية RBAC الـ 4 أدوار (FR-015) | ✅ CHK009 |
| تغطية Audit Log (FR-026) | ✅ CHK003, CHK036 |
| تغطية Maintenance Mode (FR-022) | ✅ CHK007 |
| عدد الأسئلة بين 35-45 | ✅ 41 سؤال |
| الصيغة: `- [ ] CHKxxx ... [Category]` | ✅ |

---

## تحديث سجل المشاكل بعد الإنجاز

بعد التحقق الناجح، تحديث `docs/doc-issues-tracker.md`:
- DOC-001: تغيير الحالة من ❌ إلى ✅
- إضافة سطر في جدول "سجل الإصلاحات"
