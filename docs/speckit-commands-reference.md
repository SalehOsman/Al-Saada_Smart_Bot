# SpecKit Commands Reference — Al-Saada Smart Bot
# مرجع أوامر SpecKit — بوت السعادة الذكي

**التاريخ:** 2026-03-02  
**المصدر:** [github/spec-kit](https://github.com/github/spec-kit) + التوثيق الرسمي + templates المشروع  
**الغرض:** ذاكرة المشروع لضمان الاستخدام الصحيح لأوامر SpecKit من قِبل المستشار التقني والمنفّذ

---

## 1. الفلسفة الأساسية — Spec-Driven Development

SpecKit يتبع تسلسلاً صارماً: **المواصفات → الخطة → المهام → التنفيذ**

```
المواصفات (ماذا نبني ولماذا؟)
    ↓
الخطة التقنية (كيف نبنيه؟)
    ↓
المهام (ما الخطوات بالتفصيل؟)
    ↓
التنفيذ (كتابة الكود الفعلي)
```

**القاعدة الذهبية:** المواصفات هي مصدر الحقيقة الوحيد. عند أي خلاف → نعود للمواصفات.

---

## 2. الأوامر الأساسية (Core Commands)

### `/speckit.constitution`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | إنشاء أو تعديل الدستور — المبادئ الحاكمة التي توجّه كل القرارات |
| **المدخلات** | وصف المبادئ المطلوبة أو التعديلات عليها |
| **المخرجات** | `.specify/memory/constitution.md` |
| **متى يُستخدم** | عند بداية المشروع، أو عند الحاجة لتعديل مبدأ قائم |
| **من يصيغه** | المستشار التقني |

**مثال — إنشاء:**
```
/speckit.constitution Create principles focused on code quality, testing standards, 
user experience consistency, and performance requirements.
```

**مثال — تعديل:**
```
/speckit.constitution Update constitution to remove duplicate sections. 
Remove the DUPLICATE "### VII. Simplicity Over Cleverness" and "### VIII. Monorepo Structure" 
sections that appear AFTER Principle X. KEEP the original sections (VIII and IX).
```

---

### `/speckit.specify`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | إنشاء أو تعديل المواصفات الوظيفية — ماذا نبني ولماذا |
| **المدخلات** | وصف الميزة (user stories, requirements, edge cases) |
| **المخرجات** | `specs/[###-feature-name]/spec.md` |
| **متى يُستخدم** | عند بدء ميزة جديدة، أو تعديل متطلبات قائمة |
| **من يصيغه** | المستشار التقني |
| **ملاحظة مهمة** | ركّز على "ماذا" و"لماذا" — لا تذكر التقنيات هنا |

**مثال — إنشاء:**
```
/speckit.specify Build an application that can help me organize my photos in separate 
photo albums. Albums are grouped by date...
```

**مثال — تعديل (إصلاح مشكلة analyze):**
```
/speckit.specify Update spec.md to fix D1 from analyze report.
Keep QA-002 as-is. Update SC-002 to cross-reference QA-002 instead of repeating it.
Change SC-002 to: "All data operations via the Module Kit trigger automatic audit + 
notification per QA-002, with zero developer-written logging or notification code required."
```

---

### `/speckit.clarify`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | توضيح المتطلبات الغامضة عبر أسئلة منظمة |
| **المدخلات** | أسئلة حول نقاط غير واضحة في المواصفات |
| **المخرجات** | تحديث `spec.md` بقسم Clarifications |
| **متى يُستخدم** | **بعد** `/speckit.specify` و**قبل** `/speckit.plan` (مُوصى به) |
| **من يصيغه** | المستشار التقني أو صاحب المشروع |

**مثال:**
```
/speckit.clarify How should the system handle draft expiration? 
What confirmation should module:remove require?
```

---

### `/speckit.plan`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | إنشاء أو تعديل خطة التنفيذ التقنية — كيف نبنيه |
| **المدخلات** | التقنيات والقرارات المعمارية |
| **المخرجات** | `specs/[###-feature-name]/plan.md` + `research.md` + `data-model.md` + `quickstart.md` + `contracts/` |
| **متى يُستخدم** | **بعد** اكتمال المواصفات والتوضيحات |
| **من يصيغه** | المستشار التقني |
| **ملاحظة** | هنا تُحدد التقنيات (على عكس specify) |

**مثال — إنشاء:**
```
/speckit.plan The application uses grammY 1.x with TypeScript, PostgreSQL via Prisma ORM, 
Redis for sessions and drafts.
```

**مثال — تعديل (إصلاح مشكلة analyze):**
```
/speckit.plan Update plan.md to fix I1 from analyze report.
In the "Source Code" section, add platform.prisma to the prisma/ tree structure.
```

---

### `/speckit.tasks`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | توليد أو تعديل قائمة المهام التفصيلية من الخطة |
| **المدخلات** | تُقرأ من plan.md + spec.md + data-model.md + contracts/ |
| **المخرجات** | `specs/[###-feature-name]/tasks.md` |
| **متى يُستخدم** | **بعد** اكتمال الخطة |
| **من يصيغه** | المستشار التقني (أو تلقائياً من الخطة) |

**مثال — توليد:**
```
/speckit.tasks
```

**مثال — تعديل (إصلاح مشكلة analyze):**
```
/speckit.tasks Update tasks.md to fix U1 from analyze report.
In T017, after "Run prisma generate." add: "Run npm install to link the new workspace package."
In T018, after "Run prisma generate." add: "Run npm install to clean stale workspace symlinks."
```

---

### `/speckit.implement`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | تنفيذ الكود الفعلي — كتابة الملفات البرمجية |
| **المدخلات** | tasks.md (المهام المحددة) |
| **المخرجات** | ملفات الكود الفعلية (`.ts`, `.prisma`, `.ftl`, etc.) |
| **متى يُستخدم** | **بعد** اجتياز `/speckit.analyze` بصفر مشاكل |
| **من يشغّله** | المنفّذ (بأمر دقيق من المستشار) |

**⚠️ تحذير حاسم:**
> `/speckit.implement` لا يُعدّل ملفات التوثيق (spec.md, plan.md, tasks.md, constitution.md).
> وظيفته الوحيدة هي كتابة الكود البرمجي وتنفيذ المهام.

**مثال:**
```
/speckit.implement Implement ONLY tasks T001-T006. 
Create package structure, Prisma multi-file schema, monorepo config.
Commit with: "feat(module-kit): scaffold package structure and Prisma multi-file schema"
```

---

### `/speckit.analyze`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | تحليل التناسق بين جميع ملفات التوثيق |
| **المدخلات** | spec.md + plan.md + tasks.md + constitution.md |
| **المخرجات** | تقرير بالمشاكل (CRITICAL → HIGH → MEDIUM → LOW) |
| **متى يُستخدم** | **بعد** `/speckit.tasks` و**قبل** `/speckit.implement` |
| **من يشغّله** | المنفّذ (بتوجيه المستشار) |

**مثال:**
```
/speckit.analyze Run full analysis on specs/003-module-kit/ to confirm zero issues.
```

---

### `/speckit.checklist`
| البند | التفاصيل |
|-------|----------|
| **الغرض** | توليد قوائم جودة مخصصة للتحقق من المتطلبات |
| **المدخلات** | السياق من spec.md + plan.md + tasks.md |
| **المخرجات** | `specs/[###-feature-name]/checklists/[name].md` |
| **متى يُستخدم** | عند الحاجة للتحقق من جودة معينة |

---

## 3. التسلسل الإلزامي (Mandatory Workflow)

```
┌──────────────────────────────────────────────────────────┐
│                    التسلسل الصحيح                         │
│                                                          │
│  1. /speckit.constitution  → المبادئ الحاكمة              │
│  2. /speckit.specify       → المواصفات الوظيفية           │
│  3. /speckit.clarify       → توضيح المتطلبات (اختياري)    │
│  4. /speckit.plan          → الخطة التقنية                │
│  5. /speckit.tasks         → قائمة المهام                 │
│  6. /speckit.analyze       → فحص التناسق (بوابة إلزامية)  │
│  7. إصلاح المشاكل         → بالأوامر المناسبة أعلاه      │
│  8. /speckit.analyze       → تأكيد صفر مشاكل              │
│  9. /speckit.implement     → تنفيذ الكود                  │
│ 10. /speckit.analyze       → فحص نهائي                    │
└──────────────────────────────────────────────────────────┘
```

---

## 4. قاعدة الأمر الصحيح — أي أمر لأي ملف؟

| الملف المطلوب تعديله | الأمر الصحيح | ❌ الأمر الخاطئ |
|----------------------|-------------|-----------------|
| `constitution.md` | `/speckit.constitution` | `/speckit.implement` أو bash |
| `spec.md` | `/speckit.specify` | `/speckit.implement` أو bash |
| `plan.md` | `/speckit.plan` | `/speckit.implement` أو bash |
| `tasks.md` | `/speckit.tasks` | `/speckit.implement` أو bash |
| ملفات الكود (`.ts`, `.prisma`, etc.) | `/speckit.implement` | `/speckit.specify` أو `/speckit.plan` |
| `checklists/*.md` | `/speckit.checklist` | أي أمر آخر |

**القاعدة:** كل ملف له أمره المخصص. لا استثناءات.

---

## 5. إصلاح مشاكل `/speckit.analyze` — الأوامر الصحيحة

عندما يكتشف `/speckit.analyze` مشاكل، الإصلاح يتم بالأمر المناسب لنوع الملف:

| المشكلة في | الإصلاح عبر | مثال |
|-----------|-------------|------|
| `spec.md` (تكرار، غموض) | `/speckit.specify Update spec.md to fix [ID]...` | إصلاح D1 |
| `plan.md` (هيكل ناقص) | `/speckit.plan Update plan.md to fix [ID]...` | إصلاح I1 |
| `tasks.md` (خطوة مفقودة) | `/speckit.tasks Update tasks.md to fix [ID]...` | إصلاح U1 |
| `constitution.md` (تكرار) | `/speckit.constitution Update constitution to fix [ID]...` | إصلاح I2 |
| تعارض بين ملفات | الأمر الخاص **بالملف المصدر** (الأعلى في التسلسل) | spec → plan → tasks |

**ترتيب الأولوية عند التعارض:**
```
constitution.md (الأعلى سلطة)
    ↓
spec.md (المواصفات)
    ↓
plan.md (الخطة)
    ↓
tasks.md (المهام)
    ↓
الكود (الأدنى — يتبع الكل)
```

---

## 6. نصائح من واقع الاستخدام (Discussion #775)

| الموقف | الحل الصحيح |
|--------|-------------|
| `analyze` يكتشف مشاكل | أطلب من المنفّذ: "Fix A1, C2" — سيفهم من سياق التقرير |
| تحتاج تعديل spec بعد plan | استخدم `/speckit.clarify` لإضافة التوضيحات |
| `/speckit.plan` يمسح تعديلاتك اليدوية | ⚠️ لا تعدّل plan.md يدوياً — استخدم `/speckit.plan` دائماً |
| المنفّذ يضيف أشياء لم تُطلب | راجع المخرجات وأوقفه — over-eagerness شائعة |

---

## 7. هيكل ملفات SpecKit في المشروع

```
_Al-Saada_Smart_Bot/
├── .specify/
│   ├── memory/
│   │   └── constitution.md        ← /speckit.constitution
│   ├── scripts/
│   │   └── powershell/            ← سكربتات داخلية
│   └── templates/
│       ├── commands/
│       │   └── plan.md            ← تعريف سير عمل /speckit.plan
│       ├── constitution-template.md
│       ├── spec-template.md
│       ├── plan-template.md
│       ├── tasks-template.md
│       └── checklist-template.md
├── specs/
│   ├── 001-platform-core/        ← Layer 1
│   │   ├── spec.md               ← /speckit.specify
│   │   ├── plan.md               ← /speckit.plan
│   │   └── tasks.md              ← /speckit.tasks
│   ├── 002-ai-assistant/         ← Layer 4 (AI)
│   ├── 003-module-kit/           ← Layer 2
│   │   ├── spec.md
│   │   ├── plan.md
│   │   ├── tasks.md
│   │   ├── data-model.md
│   │   ├── quickstart.md
│   │   ├── research.md
│   │   ├── contracts/
│   │   └── checklists/
│   └── main/
└── CLAUDE.md                     ← يُحدَّث تلقائياً بالتقنيات
```

---

## 8. المخالفات الشائعة وكيفية تجنبها

| ❌ المخالفة | ✅ الصواب |
|------------|----------|
| استخدام `/speckit.implement` لتعديل `spec.md` | استخدم `/speckit.specify` |
| استخدام `/speckit.implement` لتعديل `plan.md` | استخدم `/speckit.plan` |
| استخدام `/speckit.implement` لتعديل `tasks.md` | استخدم `/speckit.tasks` |
| تعديل `constitution.md` عبر bash أو file_create | استخدم `/speckit.constitution` |
| تشغيل `/speckit.implement` قبل `/speckit.analyze` | analyze أولاً — بوابة إلزامية |
| تجاهل مشاكل CRITICAL والانتقال للتنفيذ | إصلاح CRITICAL → HIGH → MEDIUM أولاً |
| كتابة مواصفات تقنية في `/speckit.specify` | المواصفات = "ماذا ولماذا"، التقنيات في `/speckit.plan` |

---

## سجل التعديلات

| الإصدار | التاريخ | التعديل |
|---------|---------|----------|
| 1.0.0 | 2026-03-02 | الإصدار الأول — مرجع شامل لأوامر SpecKit مبني من التوثيق الرسمي وملفات المشروع |
