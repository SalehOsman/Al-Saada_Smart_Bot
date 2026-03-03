# توثيق الأمر التنفيذي
# Command Log — تصحيح Bootstrap Flow (I1)

---

## معلومات الأمر

| البند | التفصيل |
|-------|---------|
| **رقم الأمر** | CMD-SPEC-001 |
| **تاريخ الإعداد** | 2026-02-23 |
| **أعدّه** | المستشار التقني |
| **يُنفَّذ بواسطة** | المنفّذ (Executor) |
| **الملفات المستهدفة** | `specs/001-platform-core/spec.md` ، `specs/001-platform-core/tasks.md` |
| **نوع الأمر** | تعديل توثيق فقط — لا تعديل كود |
| **المرجع** | `speckit.analyze` — Issue I1 (Bootstrap Flow Conflict) |

---

## سبب الأمر

`speckit.analyze` رصد تعارضاً بين FR-014 و US1:

- **US1** يقول: Super Admin يُطلب منه إدخال **الاسم الكامل والرقم القومي** قبل إنشاء الحساب.
- **FR-014** يصف منطق Bootstrap Lock فقط دون ذكر الـ UI التفاعلي.

**القرار المعتمد (B):** Super Admin يمر بمحادثة أولاً لجمع الاسم الكامل والرقم القومي، ثم يُنشأ الحساب بدور SUPER_ADMIN.

---

## التعديلات المطلوبة

### EDIT 1 — spec.md: تحديث FR-014

في FR-014، بعد النقطة رقم 4، أضف:

```
4a. Bootstrap Conversation: After eligibility is confirmed, the system MUST start
    a grammY conversation to collect:
    - Full Name (Arabic, required)
    - National ID (14-digit Egyptian format, required — extract birthdate and gender via FR-035)
    - Nickname (optional — auto-generated if empty: firstName + 4-char nanoid)
    Only after successful data collection does the system create the SUPER_ADMIN user
    and write the USER_BOOTSTRAP audit log.
4b. If the user cancels or sends invalid data 3 times during bootstrap conversation,
    the conversation ends with an Arabic error message. Bootstrap remains eligible
    for the next /start attempt.
```

### EDIT 2 — tasks.md: إضافة T023-B

في Phase 3 (Bootstrap System)، بعد T023، أضف:

```
- [ ] T023-B [US1] Create Super Admin bootstrap conversation in
  `packages/core/src/bot/conversations/bootstrap.ts` — collect Full Name,
  National ID (with FR-035 extraction), optional Nickname. Done when:
  Super Admin account is created only after successful data collection.
```

---

## قواعد التنفيذ

- تعديل `spec.md` و `tasks.md` فقط
- لا تعديل على أي ملف كود `.ts`
- لا تعديل على أي ملف آخر خارج الملفين المحددين
- لا تشغيل أي أمر speckit آخر بعد الانتهاء

## Commit Message

```
docs(spec,tasks): clarify Super Admin bootstrap as interactive conversation — resolve I1
```

---

## التحقق بعد التنفيذ (مسؤولية المستشار)

| بند التحقق | المعيار |
|------------|---------|
| FR-014 يذكر Bootstrap Conversation صراحةً | ✅ / ❌ |
| T023-B موجودة في tasks.md | ✅ / ❌ |
| لا يوجد تعديل على ملفات `.ts` | ✅ / ❌ |
| لا يوجد تعديل على ملفات خارج الملفين | ✅ / ❌ |

---

## نتائج التنفيذ

### الحالة: ✅ مكتمل

### Git Commit:
```
docs(spec,tasks): clarify Super Admin bootstrap as interactive conversation — resolve I1
```

### ملاحظات المراجعة:
- spec.md: FR-014 يحتوي الآن على 4a و 4b ✅
- tasks.md: T023-B مضافة بعد T023 ✅
- لا تعديل على ملفات .ts ✅
- لا أوامر إضافية شُغّلت ✅
