📋 بطاقة الأمر — 005-production-readiness (Phase 2 Foundational)

🎯 الهدف:
بناء البنية التحتية الأساسية (Foundational) التي تسبق بناء أي ميزة إنتاجية أخرى. يشمل ذلك تحديث قاعدة البيانات بنموذج النسخ الاحتياطي، إضافة أداة تصفية البيانات الحساسة (PII)، وإعداد مفاتيح الترجمة. (المهام T004 مساراً إلى T007).

📁 الملفات المتأثرة:
- `prisma/schema/platform.prisma` — سيُعدَّل (إضافة جدول `BackupMetadata` و `BackupStatus` enum)
- `packages/core/src/bot/utils/pii-filter.ts` — سيُإنشاء (أداة التصفية)
- `packages/core/src/locales/ar.ftl` & `en.ftl` — سيُعدَّل (إضافة مفاتيح الإنتاجية)
- `prisma/migrations/` — سيُإنشاء (ملفات التهجير لنموذج قاعدة البيانات)

⚙️ ما سيفعله المنفّذ تحديداً:
1. سيقوم بتشغيل أداة SpecKit لتنفيذ المهام T004 و T005 و T006.
2. سيقوم المنفذ يدوياً بتشغيل التحقق والاختبار، ثم إنشاء ملفات التهجير (Migration) عبر `prisma migrate dev` كجزء من T007.
3. سيقوم بعمل commit بالرسالة المحددة.

⚠️ ملاحظات / مخاطر:
- إضافة جدول جديد لقاعدة البيانات (T004/T007) تتطلب الانتباه لعدم كسر الجداول الموجودة. هذه الخطوة آمنة لأنها إضافة جدول مستقل (BackupMetadata) لا يعدل الجداول الحالية.
- يرجى التأكد من تشغيل `npm run typecheck` و `npm run test` دائمًا للتحقق من سلامة الأكواد المنتجة.

✅ للموافقة: أرسل الأمر التالي للمنفّذ:

```text
/speckit.implement Implement ONLY tasks T004, T005, T006, T007 from specs/005-production-readiness/tasks.md.
Add BackupMetadata model and BackupStatus enum to prisma/schema/platform.prisma.
Implement PII filtering utility in packages/core/src/bot/utils/pii-filter.ts.
Add i18n keys for production readiness in packages/core/src/locales/ar.ftl and en.ftl.
Run `npx prisma migrate dev --name add_backup_metadata` to apply the BackupMetadata table (T007).
Commit with: "feat(core): implement phase 2 foundational setup for 005-production-readiness (T004-T007)"
```
