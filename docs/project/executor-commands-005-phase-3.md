📋 بطاقة الأمر — 005-production-readiness (Phase 3: Automated Database Backups)

🎯 الهدف:
بناء الميزة الأساسية الأولى للإنتاجية (User Story 1): نظام نسخ احتياطي آلي ويدوي لقاعدة البيانات مع تشفير قوي (AES-256-GCM) وتحكم حصري للسوبر أدمن. 

📁 الملفات المتأثرة:
- `packages/core/tests/services/backup.service.test.ts` — سيُإنشاء (اختبارات الوحدة لضمان الجودة)
- `packages/core/src/bot/services/backup.service.ts` — سيُإنشاء (الخدمة المسؤولة عن `pg_dump` والتشفير)
- `packages/core/src/bot/handlers/backup.ts` — سيُإنشاء (أوامر التليجرام للسوبر أدمن `/backup`, `/backups`, `/restore`)
- `packages/core/src/index.ts` — سيُعدَّل (لجدولة النسخ الاحتياطي التلقائي عبر `node-cron`)

⚙️ ما سيفعله المنفّذ تحديداً:
1. تشغيل أداة SpecKit لتنفيذ المهام T008 إلى T011 بدقة.
2. كتابة الاختبارات أولاً (كما ينص التوثيق)، ثم برمجة خدمة النسخ والتشفير.
3. كتابة الأوامر الخاصة بالبوت وربطها بجدولة المهام.
4. إجراء فحص Typescript واختبارات الوحدة للتأكد من سلامة الكود.
5. عمل commit بالرسالة المحددة.

⚠️ ملاحظات / مخاطر:
- تتطلب هذه المرحلة التعامل مع أوامر نظام التشغيل (`pg_dump`). سيقوم المنفذ بكتابة الكود للتعامل معها بأمان.
- تتطلب ميزة الاستعادة (Restore) بناء نظام "موافقة من خطوتين" (Two-step approval) لمنع مسح القاعدة بالخطأ.

✅ للموافقة: أرسل الأمر التالي للمنفّذ:

```text
/speckit.implement Implement ONLY tasks T008, T009, T010, T011 from specs/005-production-readiness/tasks.md.
Create unit tests for BackupService in packages/core/tests/services/backup.service.test.ts first.
Implement BackupService in packages/core/src/bot/services/backup.service.ts with pg_dump and AES-256-GCM encryption.
Implement SUPER_ADMIN backup commands (/backup, /backups, /restore) in packages/core/src/bot/handlers/backup.ts with interactive two-step approval.
Configure daily backup scheduling using node-cron in packages/core/src/index.ts.
Commit with: "feat(core): implement phase 3 automated database backups for 005-production-readiness (T008-T011)"
```
