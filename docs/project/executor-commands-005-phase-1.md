📋 بطاقة الأمر — 005-production-readiness (Phase 1 Setup)

🎯 الهدف:
البدء في تجهيز البنية التحتية لبيئة الإنتاج الأساسية (تثبيت الحزم، وتجهيز مسارات المراقبة والحماية)، لتنفيذ المهام من T001 إلى T003.

📁 الملفات المتأثرة:
- `package.json` — سيُعدَّل (إضافة حزم Sentry, ratelimiter, auto-retry, cron)
- `.env.example` — سيُعدَّل (إضافة مفاتيح SENTRY_DSN، RATE_LIMIT، BACKUP)
- `packages/core/src/bot/monitoring/` — سيُإنشاء (مجلد فارغ)
- `packages/core/src/bot/middleware/` — سيُإنشاء (مجلد فارغ)
- `packages/core/src/bot/services/` — سيُإنشاء (مجلد فارغ)

⚙️ ما سيفعله المنفّذ تحديداً:
1. سيقوم بتشغيل أداة SpecKit لتنفيذ المهام الثلاثة بدقة.
2. سيُثبت الحزم ويجهّز ملفات البيئة والمجلدات الفارغة المذكورة.
3. سيقوم بعمل commit بالرسالة المحددة.

⚠️ ملاحظات / مخاطر:
لا توجد مخاطر. هذه مجرد إعدادات بنية تحتية لا تمس الكود الفعلي القديم.

✅ للموافقة: أرسل الأمر التالي للمنفّذ:

```text
/speckit.implement Implement ONLY tasks T001, T002, T003 from specs/005-production-readiness/tasks.md.
Install production dependencies: @sentry/node, @grammyjs/ratelimiter, @grammyjs/auto-retry, node-cron.
Update .env.example with SENTRY_DSN, BACKUP_*, and RATE_LIMIT_* configurations.
Create the following empty directories: packages/core/src/bot/monitoring/, packages/core/src/bot/middleware/, packages/core/src/bot/services/.
Commit with: "feat(core): setup phase 1 infrastructure for 005-production-readiness (T001-T003)"
```
