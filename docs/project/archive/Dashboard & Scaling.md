# **مقترحات لوحة القيادة الذكية والتوسع (Dashboard & Scaling)**

**تاريخ الإصدار:** 4 مارس 2026

**الحالة:** مقترحات للتطوير المستقبلي (Phase 5 وما بعدها)

**الهدف:** تحويل المشروع من مجرد "بوت" إلى "نظام إداري متكامل" (ERP Lite) مدعوم بواجهة ويب للتحكم الشامل، وتهيئة البنية التحتية للعمل على نطاق واسع (Scale) أو الاستضافة المحلية (On-Premise).

## **1\. لوحة القيادة الذكية (Smart Admin Dashboard)**

إدارة النظام عبر تيليجرام تفقد بريقها عندما يزداد تعقيد البيانات. لوحة القيادة المقترحة ستكون واجهة ويب (Web Application) تتصل بنفس قاعدة البيانات (PostgreSQL) لتعمل جنباً إلى جنب مع البوت.

### **أ. التقاط الموديولات برمجياً (Auto-Discovery)**

كيف ستتعرف اللوحة على الموديولات الجديدة (مثل الحضور، الوقود، الإجازات) تلقائياً؟

* **آلية العمل:** عند استخدام أمر npm run module:create، يتم تسجيل الموديول في قاعدة البيانات (جدول Modules في Prisma) وتوليد هيكل البيانات الخاص به. واجهة برمجة التطبيقات (API) الخاصة باللوحة ستقوم بقراءة هذا الجدول، واستنباط الحقول (Fields) من Prisma Schema الديناميكي.
* **النتيجة:** بمجرد إنشاء الموديول، سيظهر تلقائياً كـ "قائمة" (Menu Item) في لوحة القيادة دون الحاجة لكتابة كود واجهة مستخدم (UI) مخصص له.

### **ب. تخصيص الصلاحيات وإدارة الواجهة (RBAC & Admin Scopes)**

اللوحة لن تكون حكراً على المدير العام، بل تعتمد على نظام الصلاحيات لتقديم واجهة مخصصة لكل مسؤول:

* **المدير العام (SUPER\_ADMIN):** يمتلك وصولاً كاملاً لإدارة الكور (الصيانة، سجلات التدقيق، الأقسام، الانضمام) وإدارة كافة الموديولات.
* **المدير (ADMIN):** بمجرد دخوله، تقوم اللوحة بقراءة "نطاق الصلاحيات" (Admin Scopes) المخصصة له.
  * *مثال:* مدير الـ HR سيظهر له فقط موديول "الإجازات" و "الحضور والانصراف" ولن يرى موديول "الوقود" أو "المصروفات".
  * هذا يسمح للمدير العام بتفويض المهام (Delegation) عبر لوحة التحكم بأمان تام.

### **ج. تصدير واستيراد البيانات (Data Import/Export)**

* **التصدير (Export):** تصدير بيانات أي موديول (بناءً على صلاحية الآدمن) إلى صيغ Excel أو CSV. مفيد جداً للمحاسبين (مثال: تصدير حركات "موديول المصروفات" لرفعها على نظام ERP الخاص بالشركة).
* **الاستيراد (Import):** إمكانية رفع ملف CSV لإضافة بيانات مجمعة (مثال: استيراد قائمة الموظفين بدلاً من جعلهم يرسلون طلبات انضمام فردية).

### **د. الهيكلة التقنية والمكتبات المقترحة للوحة (Tech Stack & Frameworks)**

لضمان بناء لوحة تحكم احترافية بأقل جهد ممكن وتدعم **الاستضافة المحلية للشركات (Local Intranet)**، نُوصي بالتقنيات التالية:

* **1\. إطار عمل اللوحة (Admin Frameworks):**
  * **الخيار الأول (الأسرع للالتقاط التلقائي): [AdminJS](https://adminjs.co/)** مكتبة لبيئة Node.js تمتلك "محوّل" (Adapter) جاهز لـ Prisma، تبني واجهة CRUD كاملة تلقائياً.
  * **الخيار الثاني (الأقوى للتخصيص الكامل): [Refine.dev](https://refine.dev/)** إطار عمل لتطبيقات React و Next.js، ممتاز للتحكم الكامل في واجهة المستخدم (UX) والصلاحيات المعقدة.
* **2\. الواجهة الأمامية والمكونات (UI & Data Visualization):**
  * **Next.js \+ Tailwind CSS:** كأساس للواجهة.
  * [**Shadcn UI**](https://ui.shadcn.com/)**:** لمكونات الواجهة الأساسية.
  * [**Tremor**](https://www.tremor.so/)**:** مخصصة بالكامل للرسوم البيانية (Charts) لإنشاء شاشات تحليلات احترافية.
* **3\. الواجهة الخلفية (Backend/API):** توسيع سيرفر Hono أو الاعتماد على Next.js API Routes.
* **4\. المصادقة المحلية المدمجة (Self-Hosted Credentials Auth):**
  نظراً لأن النظام قد يُستضاف محلياً (بدون إنترنت خارجي)، يُمنع الاعتماد على (Telegram Login أو Google OAuth). البديل هو نظام مغلق (Invite-Only System) يعمل كالتالي:
  * **المكتبة:** استخدام NextAuth.js (أو Auth.js) مع مزود الاعتمادات (Credentials Provider) باستخدام البريد الإلكتروني وكلمة المرور المشفرة (Bcrypt).
  * **التأسيس (Bootstrap):** واجهة اللوحة لا تحتوي على صفحة "تسجيل حساب". لإنشاء أول مدير عام (SUPER\_ADMIN)، يتم توفير سكربت في سطر الأوامر (مثال: npm run dashboard:setup) يقوم بتوليد حساب بصلاحيات مطلقة.
  * **توزيع الصلاحيات (Provisioning):** بمجرد دخول الـ SUPER\_ADMIN الأول، يمكنه من خلال صفحة "إدارة المديرين" في الداشبورد إنشاء حسابات للمديرين الآخرين (Admins)، تحديد كلمات مرور مؤقتة لهم، وتعيين نطاق صلاحياتهم (Admin Scopes).
  * **الأمان:** هذه الطريقة تضمن عمل اللوحة 100% في البيئات المغلقة (Offline/Localhost) وتمنع أي شخص خارجي من محاولة التطفل على النظام.

### **هـ. الميزات المتقدمة للوحة التحكم (Advanced Dashboard Features)**

لجعل اللوحة منتجاً من الدرجة الأولى (Enterprise-Grade)، يُقترح إضافة الميزات التالية:

* **1\. نظام البث والإشعارات (Broadcast & Notification Center):**
  * واجهة تتيح للمديرين إرسال "إشعارات عامة" (Announcements) للموظفين عبر البوت.
  * **تخصيص الاستهداف:** يمكن إرسال رسالة لكل الشركة، أو تحديد قسم معين (مثال: رسالة لمهندسي الصيانة فقط)، ويقوم السيرفر بوضع الرسائل في طابور BullMQ (الموجود في الكور) لإرسالها تدريجياً لتجنب الحظر من تيليجرام.
* **2\. لوحات سير العمل البصرية (Kanban Approval Boards):**
  * بدلاً من عرض "طلبات الإجازة" أو "سلف الموظفين" كجدول عادي، يتم عرضها كلوحة Kanban (مثل Trello).
  * أعمدة (Pending, Approved, Rejected)، يمكن للمدير سحب وإفلات (Drag & Drop) الطلب ليتم تحديث حالته في قاعدة البيانات، وإرسال إشعار تلقائي للموظف عبر البوت بالنتيجة.
* **3\. مستكشف سجلات التدقيق المتقدم (Advanced Audit Explorer):**
  * الاستفادة من نموذج AuditLog في main.prisma وتحويله إلى شاشة مراقبة أمنية (Security Center).
  * إمكانية تصفية السجلات للبحث عن "كل العمليات التي قام بها مدير معين في آخر 24 ساعة" أو "تتبع متى تم تغيير الحد الأقصى للمصروفات"، مما يوفر شفافية مطلقة.
* **4\. بوابة الربط مع الأنظمة الخارجية (API Keys & Webhooks Out):**
  * إذا كانت الشركة تمتلك نظاماً محاسبياً مثل Odoo أو SAP، سيحتاجون لربط بيانات البوت به.
  * إضافة قسم في الداشبورد لإنشاء "مفاتيح API" تتيح للأنظمة الأخرى سحب البيانات من البوت، بالإضافة إلى إمكانية إعداد Webhooks لتقوم لوحة التحكم بإرسال البيانات للأنظمة الأخرى فور تسجيل الموظف لها في البوت.

## **2\. مقترحات تحسينية أخرى (توسعية وهندسية)**

إلى جانب اللوحة، هناك تحسينات ضرورية لرفع كفاءة البنية التحتية:

### **أ. الانتقال إلى Webhooks في بيئة الإنتاج**

* **المقترح:** عند نشر البوت للشركات (على خوادم تتصل بالإنترنت)، يجب تعديل bot/index.ts لاستخدام **Webhooks** عبر Hono، مما يقلل استهلاك الموارد (CPU/RAM) بنسبة كبيرة ويسمح بخدمة آلاف المستخدمين. *(ملاحظة: إذا كان البوت سيعمل داخل شبكة محلية فقط ولا يستطيع تيليجرام الوصول إليه، فسيستمر الاعتماد على Long-Polling).*

### **ب. الإعدادات الديناميكية للموديولات (Dynamic Module Config)**

* **المقترح:** جعل متغيرات الأعمال قابلة للتعديل من لوحة القيادة.
  * *مثال:* تعديل "الحد الأقصى للإجازات" من الداشبورد ليتم حفظه كـ Config JSON في قاعدة البيانات بدلاً من تعديله في كود TypeScript.

### **ج. تحليلات ورسوم بيانية (Analytics & BI)**

* رسم بياني (باستخدام مكتبة **Tremor**) يعرض: أوقات الذروة لاستخدام البوت، أكثر الموديولات استخداماً، وإحصائيات التسجيل والمهام المعلقة.

## **خلاصة خارطة الطريق المحدثة (Updated Roadmap)**

* **Phase 1 & 2:** Core & Module Kit (مكتمل).
* **Phase 3:** بناء الموديولات التجريبية.
* **Phase 4:** المساعد الذكي (AI Assistant).
* **Phase 5 (جديد):** لوحة القيادة الذكية (Smart Dashboard بمصادقة محلية وميزات متقدمة).

---

## 📦 ARCHIVED — Migration Notes

**Status:** Archived
**Date Archived:** 2026-03-04
**Reason:** Integrated into `docs/project/roadmap.md`

### Migration Map

| Original Section | New Location | Notes |
|-----------------|--------------|-------|
| Auto-Discovery | `roadmap.md` → Phase 5 (DB-001) | MVP feature |
| RBAC & Admin Scopes | `roadmap.md` → Phase 5 (DB-002) | MVP feature |
| Data Import/Export | `roadmap.md` → Phase 5 (DB-004) | Export only in MVP, Import deferred |
| Tech Stack | `roadmap.md` → Phase 5 | Decision: AdminJS for MVP |
| Self-Hosted Auth | `roadmap.md` → Phase 5 (DB-005) | MVP feature |
| Broadcast System | `roadmap.md` → Phase 6 | Deferred to advanced features |
| Kanban Boards | `roadmap.md` → Phase 6 | Deferred to advanced features |
| Advanced Audit Explorer | `roadmap.md` → Phase 6 | Deferred to advanced features |
| API Keys & Webhooks | `roadmap.md` → Phase 6 | Optional, on-demand only |
| Webhooks Mode | Not included | Already supported by Hono |
| Dynamic Module Config | Not included | Deferred (YAGNI) |
| Analytics & BI | `roadmap.md` → Phase 6 | Deferred to advanced features |

### Key Decisions

- ✅ **Framework:** AdminJS chosen for MVP (fastest time to market)
- ✅ **Scope:** MVP features only in Phase 5, advanced features in Phase 6
- ✅ **Auth:** Self-hosted credentials (NextAuth.js) for offline support
- ❌ **Refine.dev:** Deferred (can migrate later if needed)
- ❌ **Kanban/API Keys:** Deferred until user requests them

### How to Use This Archive

This file is kept for historical reference only. For current development plans, see:
- **Active Roadmap:** `docs/project/roadmap.md`
- **Small Improvements:** `docs/project/backlog.md`
- **Methodology:** `docs/project/methodology.md`
