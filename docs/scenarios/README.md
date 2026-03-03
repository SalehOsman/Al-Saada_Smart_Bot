# سيناريوهات المستخدم | User Scenarios

توثيق شامل لجميع سيناريوهات التفاعل مع البوت، مقسمة حسب الطبقة والوظيفة.

---

## 🔵 سيناريوهات النواة (Core - Layer 1)

السيناريوهات المبنية حالياً والتي تعمل في الإصدار الحالي.

| # | السيناريو | الملف | الحالة |
|---|----------|-------|--------|
| C-01 | [أول تفاعل مع البوت (`/start`)](core/C-01-first-contact.md) | `start.ts` | ✅ مُنفذ |
| C-02 | [طلب الانضمام (Join Request)](core/C-02-join-request.md) | `join.ts` | ✅ مُنفذ |
| C-03 | [مراجعة طلبات الانضمام](core/C-03-join-approval.md) | `approvals.ts` | ✅ مُنفذ |
| C-04 | [القائمة الرئيسية والتنقل](core/C-04-menu-navigation.md) | `menu.ts` | ✅ مُنفذ |
| C-05 | [إدارة المستخدمين](core/C-05-user-management.md) | `users.ts` | ✅ مُنفذ |
| C-06 | [إدارة صلاحيات Admin](core/C-06-admin-scopes.md) | `users.ts` | ✅ مُنفذ |
| C-07 | [إلغاء العمليات (`/cancel`)](core/C-07-cancel-flow.md) | `conversation.ts` | ✅ مُنفذ |
| C-08 | [الرسائل غير المدعومة](core/C-08-fallback.md) | `fallback.ts` | ✅ مُنفذ |
| C-09 | [إدارة الأقسام](core/C-09-section-management.md) | — | ⏳ غير مُنفذ |
| C-10 | [وضع الصيانة](core/C-10-maintenance-mode.md) | — | ⏳ غير مُنفذ |

---

## 🟢 سيناريوهات بناء الموديولات (Module Kit - Layer 2)

سيناريوهات المطور عند إنشاء موديول جديد باستخدام أدوات Module Kit.

| # | السيناريو | الملف |
|---|----------|-------|
| M-01 | [إنشاء موديول جديد عبر CLI](module-kit/M-01-create-module.md) | `module:create` |
| M-02 | [دورة حياة الموديول (validate → confirm → save)](module-kit/M-02-module-lifecycle.md) | Module Kit API |
| M-03 | [نظام المسودات (Drafts)](module-kit/M-03-draft-system.md) | `draft.ts` |
| M-04 | [تحميل الموديولات تلقائياً](module-kit/M-04-module-loading.md) | `module-loader.ts` |

---

## 🟡 سيناريوهات الذكاء الاصطناعي (AI Assistant - Layer 4)

سيناريوهات مخططة للمساعد الذكي التشغيلي (لم تُنفذ بعد).

| # | السيناريو | الحالة |
|---|----------|--------|
| A-01 | [سؤال نصي بالعربية (RAG)](ai-assistant/A-01-text-query.md) | ⏳ مخطط |
| A-02 | [تحليل ملف مرفق (PDF/Excel/صورة)](ai-assistant/A-02-file-analysis.md) | ⏳ مخطط |
| A-03 | [ملاحظة صوتية](ai-assistant/A-03-voice-note.md) | ⏳ مخطط |

---

## 🔶 سيناريوهات الموديولات التجارية (Business Modules - Layer 3)

أمثلة على سيناريوهات الموديولات التي ستُبنى حسب احتياج كل شركة.

| # | السيناريو | الحالة |
|---|----------|--------|
| B-01 | [تسجيل بيانات (نموذج عام)](business-modules/B-01-generic-data-entry.md) | ⏳ نموذج |
| B-02 | [طلب يحتاج موافقة مدير](business-modules/B-02-approval-workflow.md) | ⏳ نموذج |
| B-03 | [عرض تقرير](business-modules/B-03-report-view.md) | ⏳ نموذج |
