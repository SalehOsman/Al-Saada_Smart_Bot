# **مقترحات تحسين الأداء والبنية التحتية (Enhancement Proposals)**

**تاريخ الإصدار:** 4 مارس 2026

**الحالة:** مقترحات للمراحل القادمة (Phase 3 & Phase 4\)

**الهدف:** ضمان استقرار منصة "بوت السعادة الذكي"، تحسين الأمان، وتهيئة النظام للعمل في بيئة الإنتاج (Production Environment).

## **1\. المراقبة واكتشاف الأخطاء (Observability & APM)**

يعتمد النظام حالياً على Pino لتسجيل الأحداث (Logging). في بيئة الإنتاج، يصعب تتبع الأخطاء من خلال ملفات السجلات النصية فقط.

**التوصيات:**

* **دمج أداة Sentry:** لالتقاط الأخطاء البرمجية (Runtime Exceptions) في الوقت الفعلي.
* **إعداد تنبيهات (Alerting):** ربط Sentry بقناة مخصصة على تيلجرام أو Slack لفريق التطوير لإرسال تنبيهات فورية عند تعطل أي خدمة.
* **مراقبة الأداء (Tracing):** مراقبة استعلامات قاعدة البيانات (Prisma Queries) البطيئة لمعرفة الموديولات التي تستهلك موارد النظام.

**متطلبات التنفيذ:**

* تثبيت @sentry/node.
* إضافة Sentry Middleware في packages/core/src/bot/index.ts ليتم التقاط الأخطاء قبل وصولها لـ Error Boundary.

## **2\. حماية واجهة تيليجرام (Rate Limiting & Throttling)**

نظراً لأن البوت سيخدم شركات بمئات الموظفين، هناك خطر التعرض لحظر مؤقت من خوادم تيليجرام (Flood Wait) نتيجة كثرة الطلبات.

**التوصيات:**

* **تفعيل Auto-Retry:** استخدام إضافة @grammyjs/auto-retry للتعامل التلقائي مع أخطاء 429 Too Many Requests وإعادة إرسال الطلب بعد فترة التأخير المطلوبة.
* **محدد الطلبات (Rate Limiter):** إضافة @grammyjs/ratelimiter مدعوم بـ Redis (الموجود بالفعل في البنية التحتية) لمنع المستخدمين من إرسال (Spam) للأوامر.

**متطلبات التنفيذ:**

// مثال للإضافة في bot/index.ts
import { autoRetry } from "@grammyjs/auto-retry";
import { limit } from "@grammyjs/ratelimiter";

bot.api.config.use(autoRetry());
bot.use(limit({
  timeFrame: 2000,
  limit: 3,
  storageClient: redisClient,
  onLimitExceeded: async (ctx) \=\> {
    await ctx.reply("عذراً، الرجاء الانتظار قليلاً قبل إرسال المزيد من الطلبات.");
  },
}));

## **3\. التكامل والنشر المستمر (CI/CD Pipelines)**

لضمان جودة الكود المُضاف من قبل المطورين وعدم كسر جوهر النظام (Platform Core) أثناء تطوير موديولات جديدة.

**التوصيات:**

* **إعداد GitHub Actions / GitLab CI:** لإنشاء مسار عمل (Workflow) يعمل تلقائياً عند كل Pull Request.
* **خطوات الـ Pipeline المقترحة:**
  1. npm install
  2. npm run lint (للتأكد من جودة الكود)
  3. npm run typecheck
  4. npm run db:generate (لضمان صحة الـ Prisma Schema)
  5. npm run test (لتشغيل 112+ اختبار الموجودة في Vitest)

## **4\. أمان طبقة الذكاء الاصطناعي (AI Layer Security \- Phase 4\)**

مع التخطيط لإضافة المساعد الذكي (Phase 4\) والتعامل مع تقنية RAG (Retrieval-Augmented Generation)، ستمر بيانات الشركة الحساسة عبر نماذج الذكاء الاصطناعي.

**التوصيات:**

* **تصفية البيانات (Data Masking & Redaction):** توسيع استخدام موديول pii-masker.ts (الموجود في Module Kit) ليقوم بإخفاء الأسماء، الأرقام القومية، والمعلومات المالية قبل إرسال السياق (Context) لأي نموذج سحابي (Cloud LLMs مثل Gemini/Claude).
* **تشفير المتجهات (Vector Encryption):** إذا تم استخدام pgvector، يجب التأكد من تشفير قاعدة البيانات (Encryption at Rest).
* **تطبيق صارم لـ RBAC في RAG:** يجب أن يرث المساعد الذكي صلاحيات المستخدم. (مثال: إذا سأل موظف "ما هي رواتب الإدارة؟"، يجب أن يرفض النظام الاستعلام في قاعدة المتجهات بناءً على صلاحية السائل).

## **5\. النسخ الاحتياطي الآلي والربط مع Google Drive (Automated Backups via Google Drive)**

يحتوي main.prisma على أحداث تدقيق للنسخ الاحتياطي (BACKUP\_TRIGGER)، مما يعني أن الميزة قيد التخطيط ولكن يجب تحويلها لعملية آلية بالكامل تُحفظ على السحابة لضمان عدم ضياع البيانات.

**التوصيات:**

* **أتمتة النسخ:** إعداد (Cron Job) يومي يعمل في أوقات الركود (مثال: 3 فجراً بتوقيت القاهرة) لإنشاء نسخة من قاعدة بيانات PostgreSQL باستخدام pg\_dump.
* **الربط مع Google Drive:** رفع النسخة الاحتياطية المشفرة تلقائياً إلى مجلد مخصص على Google Drive.
* **سياسة الاحتفاظ (Retention Policy):** برمجة السكربت ليقوم بحذف النسخ الأقدم من 30 يوماً من Google Drive لتوفير المساحة.
* **إشعارات التدقيق:** تسجيل نجاح أو فشل العملية في AuditService وإرسال إشعار فوري لـ Super Admin عبر البوت.

**متطلبات التنفيذ:**

1. **إعداد Google Cloud Console:**
   * إنشاء مشروع وتفعيل Google Drive API.
   * إنشاء Service Account وتنزيل ملف الاعتمادات (Credentials JSON).
   * مشاركة مجلد النسخ الاحتياطي في Google Drive مع البريد الإلكتروني الخاص بـ Service Account.
2. **برمجة السكربت (أو استخدام أدوات مساعدة):**
   * يمكن برمجة سكربت Node.js باستخدام مكتبة googleapis، أو تبسيط الأمر باستخدام أداة سطر الأوامر rclone لرفع الملفات إلى Drive بخطوة واحدة.
3. **التشفير:** التأكد من ضغط وتشفير ملف (SQL/Dump) بكلمة مرور (مثال باستخدام gpg أو openssl) قبل رفعه إلى جوجل درايف.

**الخطوات القادمة:**

يُنصح بتحويل هذه المقترحات إلى مهام (Tasks) وإضافتها إلى docs/project/backlog.md ليتم جدولتها ضمن دورات التطوير القادمة (Sprints).

---

## 📦 ARCHIVED — Migration Notes

**Status:** Archived
**Date Archived:** 2026-03-04
**Reason:** Integrated into `docs/project/roadmap.md`

### Migration Map

| Original Section | New Location | Notes |
|-----------------|--------------|-------|
| Section 1: Observability & APM | `roadmap.md` → Phase 3 (PR-001) | Sentry integration |
| Section 2: Rate Limiting | `roadmap.md` → Phase 3 (PR-002) | Auto-retry + rate limiter |
| Section 3: CI/CD Pipelines | `roadmap.md` → Phase 3 (PR-003) | GitHub Actions workflow |
| Section 4: AI Security | `specs/002-ai-assistant/security.md` | Moved to AI spec |
| Section 5: Backups | `roadmap.md` → Phase 3 (PR-004) | Simplified (local only, Google Drive optional) |

### Key Changes

- ✅ Google Drive backups changed from mandatory to optional plugin
- ✅ AI security moved to dedicated spec file
- ✅ All sections integrated into structured roadmap with timelines
- ✅ Priority levels assigned (CRITICAL/HIGH/MEDIUM/LOW)

### How to Use This Archive

This file is kept for historical reference only. For current development plans, see:
- **Active Roadmap:** `docs/project/roadmap.md`
- **Small Improvements:** `docs/project/backlog.md`
- **Methodology:** `docs/project/methodology.md`
