# خطة إعادة هيكلة التوثيق — Documentation Restructuring Plan

**التاريخ:** 2026-03-03
**الحالة:** معتمد من صاحب المشروع
**المُعدّ:** المستشار التقني

---

## 1. تشخيص الوضع الحالي

### ملفات يجب حذفها أو أرشفتها (لا تعكس الواقع)

| الملف | المشكلة | الإجراء |
|-------|---------|---------|
| `docs/wiki/overview.md` | يذكر "Flow Engine" كـ Layer 2 (تم استبداله بـ Module Kit). يقول "Module Loader لم يُنجز" وهو مُنفَّذ | **يُستبدل** بـ `developer/architecture.md` |
| `docs/wiki/modules.md` | يصف نظام Flow Blocks/Config-Driven القديم بالكامل — تم استبداله بـ validate()/confirm()/save() | **يُستبدل** بـ `developer/module-kit-reference.md` |
| `docs/wiki/WIKI.md` | يُشير لـ "Three-Layer Architecture" (أصبحت Four-Layer) ويُشير للملفات القديمة | **يُستبدل** بـ `docs/README.md` |
| `docs/architecture/flow-engine-spec.md` | مواصفات Flow Engine الملغاة — مشروع مُلغى بالكامل | **يُنقل** لـ `archive/` |
| `docs/architecture/flow-engine-spec.docx` | نسخة Word من نفس المواصفات الملغاة | **يُنقل** لـ `archive/` |
| `docs/architecture/flow-engine-draft.md` | مسودة Flow Engine — ملغاة | **يُنقل** لـ `archive/` |
| `docs/commands/*.md` (14 ملف) | سجلات أوامر تاريخية — مفيدة كأرشيف فقط | **يُنقل** لـ `archive/` |
| `docs/audits/*.md` (3 ملفات) | تقارير مراجعة قديمة — أرشيفية | **يُنقل** لـ `archive/` |
| `docs/doc-issues-tracker.md` | 27 مشكلة مغلقة — أرشيفية | **يُنقل** لـ `archive/` |
| `docs/refactor-unified-start-flow-2026-02-23.md` | توثيق refactor مُكتمل — أرشيفي | **يُنقل** لـ `archive/` |

### ملفات تبقى مع تحديث

| الملف | الإجراء |
|-------|---------|
| `docs/methodology.md` | **يُنقل** لـ `project/methodology.md` — بدون تعديل |
| `docs/role_review.md` | **يُنقل** لـ `project/role-review.md` — بدون تعديل |
| `docs/speckit-commands-reference.md` | **يُنقل** لـ `project/speckit-reference.md` — بدون تعديل |
| `docs/module-development-guide.md` | **يُنقل** لـ `developer/module-development-guide.md` — يحتاج تحديث لاحق |
| `docs/wiki/bot-utils.md` | **يُدمج** في `developer/platform-core-reference.md` |

---

## 2. الهيكل الجديد

```
docs/
├── README.md                              ← خريطة التوثيق (نقطة الدخول)
├── api/                                   ← TypeDoc generated (لا يُرفع لـ git — في .gitignore)
│
├── developer/                             ← توثيق المطوّر (إنجليزي)
│   ├── getting-started.md                 ← إعداد بيئة التطوير من الصفر
│   ├── architecture.md                    ← البنية المعمارية الحقيقية (4 طبقات)
│   ├── platform-core-reference.md         ← مرجع Layer 1 (خدمات، utils، middleware)
│   ├── module-kit-reference.md            ← مرجع Layer 2 (validate, confirm, save, draft)
│   ├── module-development-guide.md        ← دليل بناء الوحدات (مُنقول + مُحدَّث)
│   ├── database-schema.md                 ← نموذج البيانات الحالي
│   ├── i18n-guide.md                      ← دليل الترجمة والمفاتيح
│   ├── ai-assistant-roadmap.md            ← خطة Layer 4 (الوضع والجدول)
│   └── testing-guide.md                   ← دليل الاختبارات
│
├── user/                                  ← توثيق المستخدم النهائي (عربي)
│   ├── user-guide.md                      ← دليل استخدام البوت للموظفين
│   ├── admin-guide.md                     ← دليل الأدمن وSUPER_ADMIN
│   └── faq.md                             ← أسئلة شائعة
│
├── project/                               ← توثيق إدارة المشروع
│   ├── methodology.md                     ← المنهجية (مُنقول بدون تعديل)
│   ├── role-review.md                     ← مراجعة الأدوار (مُنقول)
│   ├── backlog.md                         ← التحسينات المستقبلية (Module Kit + عام)
│   ├── changelog.md                       ← سجل التغييرات الزمني
│   └── speckit-reference.md               ← مرجع أوامر SpecKit (مُنقول)
│
└── archive/                               ← أرشيف (لا يُحذف)
    ├── commands/                           ← الـ 14 ملف cmd
    ├── audits/                             ← تقارير المراجعة
    ├── flow-engine/                        ← مواصفات Flow Engine الملغاة
    ├── doc-issues-tracker.md              ← المشاكل المغلقة
    └── refactor-unified-start-flow.md     ← توثيق الـ refactor
```

---

## 3. تعليمات المنفّذ — مُقسَّمة لـ 4 مراحل

### المرحلة A: الهيكلة والنقل (Restructure & Move)

هذه المرحلة لا تُنشئ محتوى جديد — فقط تنقل وتُرتّب.

```
Create the new docs directory structure and move existing files:

# 1. Create directories
mkdir -p docs/developer docs/user docs/project docs/archive/commands docs/archive/audits docs/archive/flow-engine

# 2. Move archive files
mv docs/commands/* docs/archive/commands/
mv docs/audits/* docs/archive/audits/
mv docs/architecture/flow-engine-spec.md docs/archive/flow-engine/
mv docs/architecture/flow-engine-spec.docx docs/archive/flow-engine/
mv docs/architecture/flow-engine-draft.md docs/archive/flow-engine/
mv docs/doc-issues-tracker.md docs/archive/
mv docs/refactor-unified-start-flow-2026-02-23.md docs/archive/refactor-unified-start-flow.md

# 3. Move project files (no changes)
mv docs/methodology.md docs/project/methodology.md
mv docs/role_review.md docs/project/role-review.md
mv docs/speckit-commands-reference.md docs/project/speckit-reference.md

# 4. Move developer files
mv docs/module-development-guide.md docs/developer/module-development-guide.md

# 5. Remove empty old directories
rmdir docs/commands docs/audits docs/architecture

# 6. Keep wiki/ for now (will be removed after developer/ files are created)
# DO NOT delete wiki/ yet — content is needed as reference for new files

Commit with: "docs: restructure documentation directories — Phase A"
```

---

### المرحلة B: توثيق المطوّر (Developer Documentation)

**الأدوات:**
- المنفّذ يقرأ الكود الفعلي ويبني التوثيق منه
- **TypeDoc** — يولّد API reference تلقائياً من TypeScript (يُثبَّت في B0)
- **GitNexus** — لاستكشاف العلاقات بين الملفات (إذا متاح)

**التعليمات العامة لكل ملف:**
- اللغة: الإنجليزية
- المصدر: الكود الفعلي — ليس التوثيق القديم
- لا تنسخ من wiki/overview.md أو wiki/modules.md — هذه ملفات قديمة لا تعكس الواقع
- كل code example يجب أن يكون من الكود الفعلي الموجود في المشروع
- أي ميزة غير مُنفَّذة تُوضع في قسم "Planned / Not Yet Implemented" منفصل
- أضف تاريخ آخر تحديث في أعلى كل ملف

---

#### B0: تثبيت TypeDoc وتوليد API Reference تلقائي

**الهدف:** تثبيت TypeDoc كأداة تطوير وتوليد API reference تلقائي من الكود الفعلي. هذا يُستخدم كمرجع عند كتابة B3 وB4.

```
Install TypeDoc and generate automatic API reference from TypeScript source code.

# 1. Install TypeDoc as dev dependency
npm install --save-dev typedoc

# 2. Create TypeDoc configuration file: typedoc.json in project root
Create file typedoc.json with content:
{
  "$schema": "https://typedoc.org/schema.json",
  "entryPoints": [
    "packages/module-kit/src/index.ts",
    "packages/core/src/services/audit-logs.ts",
    "packages/core/src/services/notifications.ts",
    "packages/core/src/bot/utils/index.ts",
    "packages/core/src/bot/module-loader.ts",
    "packages/core/src/bot/middleware/draft.ts",
    "packages/validators/src/index.ts"
  ],
  "out": "docs/api",
  "name": "Al-Saada Smart Bot — API Reference",
  "readme": "none",
  "excludePrivate": false,
  "excludeInternal": false,
  "includeVersion": true,
  "categorizeByGroup": true,
  "sort": ["source-order"],
  "plugin": [],
  "tsconfig": "tsconfig.json"
}

# 3. Add scripts to root package.json
Add to "scripts":
  "docs:api": "typedoc",
  "docs:api:watch": "typedoc --watch"

# 4. Add docs/api/ to .gitignore (generated files — do NOT commit)
Append to .gitignore:
  # TypeDoc generated API docs
  docs/api/

# 5. Run TypeDoc to verify it works
npm run docs:api

# 6. Verify output
ls docs/api/
# Should contain: index.html, modules/, classes/, functions/, etc.
# If there are TypeScript errors preventing generation, fix them first.

# IMPORTANT NOTES:
# - docs/api/ is generated and NOT committed to git
# - Developers run "npm run docs:api" locally to generate fresh API docs
# - TypeDoc reads JSDoc/TSDoc comments from source code — better comments = better docs
# - If any entry point fails, TypeDoc will warn but continue with others
# - excludePrivate is set to false so private helpers like notifyScopedAdmins are documented

Commit with: "chore: add TypeDoc for automatic API reference generation"
```

**ما يولّده TypeDoc تلقائياً:**
- كل الـ types و interfaces (من `types.ts`)
- كل الـ exported functions مع signatures و JSDoc
- كل الـ parameters و return types
- العلاقات بين الـ classes و modules

**كيف يستفيد المنفّذ منه:**
عند كتابة B3 (`platform-core-reference.md`) و B4 (`module-kit-reference.md`):
1. افتح `docs/api/index.html` للرجوع السريع للـ signatures و types
2. اكتب التوثيق اليدوي (الشروحات، الأمثلة، الـ deep dives) في Markdown
3. أضف رابط في README.md: "للتوثيق التفصيلي للـ API شغّل `npm run docs:api`"

**النتيجة:** TypeDoc = مرجع دقيق آلي + Markdown = شروحات وأمثلة وأدلة يدوية. الاثنان يُكمّلان بعضهما.

---

#### B1: `docs/README.md` — خريطة التوثيق

```
Create docs/README.md as the documentation entry point.

Read these files to understand current state:
- package.json (project name, scripts)
- docs/project/methodology.md (development approach summary)
- specs/ directory listing (what specs exist)

Content requirements:
1. Project identity: name, one-line description, tech stack summary
2. Quick links table: each doc file with one-line description and audience (Developer/User/Project Manager)
3. Project status: current phase, what's implemented, what's planned
4. Getting started: point to developer/getting-started.md
5. API Reference note: "Run `npm run docs:api` to generate TypeDoc API reference locally"

Keep it SHORT — this is a navigation page, not a full document. Max 80 lines.

Commit with: "docs: create README.md documentation map"
```

---

#### B2: `docs/developer/architecture.md` — البنية المعمارية

```
Create docs/developer/architecture.md — the REAL architecture document.

IMPORTANT: Do NOT copy from docs/wiki/overview.md — that file is outdated and describes Flow Engine which no longer exists.

Read these ACTUAL source files to build the document:
- packages/core/src/main.ts (entry point, startup sequence)
- packages/core/src/bot/index.ts (bot setup, middleware chain)
- packages/core/src/bot/module-loader.ts (Layer 2 — ModuleLoader)
- packages/core/src/bot/middleware/ (all middleware files)
- packages/core/src/services/ (all service files)
- packages/module-kit/src/ (all module-kit files)
- packages/validators/src/ (all validator files)
- packages/ai-assistant/ (directory listing only — show planned structure)
- docker-compose.yml (infrastructure)
- prisma/schema/ (database schema files)

Content requirements:
1. "Four-Layer Architecture" section:
   - Layer 1: Platform Core — describe what ACTUALLY EXISTS in packages/core/
   - Layer 2: Module Kit — describe what ACTUALLY EXISTS in packages/module-kit/ (NOT Flow Engine)
   - Layer 3: Modules — describe the modules/ directory structure and how modules plug in
   - Layer 4: AI Assistant — mark as PLANNED, describe the roadmap briefly
   
2. "Infrastructure" section:
   - Docker services (from docker-compose.yml)
   - Database (PostgreSQL + Prisma multi-file schema)
   - Cache (Redis — sessions + drafts)
   
3. "Package Structure" section:
   - Monorepo layout with actual directory tree
   - Package responsibilities
   
4. "Middleware Chain" section:
   - List actual middleware in order from bot setup
   
5. "Key Design Decisions" section:
   - grammY + @grammyjs/conversations (why)
   - Prisma multi-file schema (why)
   - Redis for drafts (why)
   - i18n-Only principle (brief)

Language: English
Do NOT include any feature that doesn't exist in code. Mark planned features clearly.

Commit with: "docs: create architecture.md from actual codebase"
```

---

#### B3: `docs/developer/platform-core-reference.md` — مرجع Layer 1

```
Create docs/developer/platform-core-reference.md — Layer 1 API reference.

Read these ACTUAL source files:
- packages/core/src/services/audit-logs.ts (auditService — all exported functions with signatures)
- packages/core/src/services/notifications.ts (queueNotification, queueBulkNotifications — signatures)
- packages/core/src/services/join-requests.ts (JoinRequestService — public methods)
- packages/core/src/bot/utils/conversation.ts (all exports with JSDoc)
- packages/core/src/bot/utils/user-inputs.ts (all exports with JSDoc)
- packages/core/src/bot/utils/formatters.ts (all exports with JSDoc)
- packages/core/src/bot/middleware/draft.ts (draftMiddleware behavior)
- packages/core/src/bot/middleware/session.ts (session structure)
- packages/core/src/bot/middleware/error.ts (error handling)
- packages/core/src/bot/handlers/start.ts (start flow)
- packages/core/src/bot/handlers/menu.ts (menu system)
- packages/core/src/cache/redis.ts (Redis client)
- packages/core/src/database/prisma.ts (Prisma client)
- packages/core/src/utils/logger.ts (Pino logger)

Content requirements:
1. "Services" section — for each service:
   - File path
   - Exported functions with TypeScript signatures (copy from actual code)
   - Brief description of what each function does
   - Usage example (from actual usage in codebase, e.g., how join.ts calls auditService)

2. "Bot Utilities" section — for each utility file:
   - Same format as Services
   - Include the content from docs/wiki/bot-utils.md BUT verify it matches actual code
   - Update any discrepancies

3. "Middleware" section — for each middleware:
   - What it does
   - Where it sits in the chain
   - Configuration options

4. "Handlers" section:
   - /start flow (actual behavior from code)
   - Menu system (role-based menus)

Language: English
This is an API reference — be precise with types and signatures.

Commit with: "docs: create platform-core-reference.md from actual codebase"
```

---

#### B4: `docs/developer/module-kit-reference.md` — مرجع Layer 2

```
Create docs/developer/module-kit-reference.md — Module Kit API reference.

CRITICAL: This is the MOST IMPORTANT missing document. Module Kit is fully implemented but has NO reference docs.

Read these ACTUAL source files:
- packages/module-kit/src/types.ts (ALL type definitions — ModuleDefinition, SaveOptions, ValidateOptions, etc.)
- packages/module-kit/src/define-module.ts (defineModule function)
- packages/module-kit/src/validation.ts (validate function — full implementation)
- packages/module-kit/src/confirmation.ts (confirm function — full implementation)
- packages/module-kit/src/persistence.ts (save function + notifyScopedAdmins — full implementation)
- packages/module-kit/src/pii-masker.ts (maskPII function)
- packages/module-kit/src/index.ts (public API — what's exported)
- packages/core/src/bot/module-loader.ts (ModuleLoader — how modules are discovered and registered)
- packages/core/src/bot/middleware/draft.ts (draft middleware — auto-save, command interrupts, /help)
- scripts/module-create.ts (CLI scaffolding tool)
- scripts/module-remove.ts (CLI removal tool)
- scripts/module-list.ts (CLI listing tool)
- packages/module-kit/tests/ (all test files — for usage examples)

Content requirements:
1. "Overview" — what Module Kit is, how it replaces the old Flow Engine concept

2. "Public API" — for each exported function:
   - TypeScript signature (from actual code)
   - Parameters table (name, type, required, description)
   - Return type
   - Behavior description (from actual implementation)
   - Usage example (from tests or actual module code)

3. "defineModule()" deep dive:
   - Full ModuleDefinition type
   - Required vs optional fields
   - How slug, sectionSlug, permissions work
   - How addEntryPoint/editEntryPoint are registered

4. "validate()" deep dive:
   - The prompt → validate → retry loop
   - Command interrupt handling (/cancel, /start, /menu)
   - maxRetries behavior
   - formatter function

5. "confirm()" deep dive:
   - Summary display
   - Re-entry for editable fields
   - Current limitation: no empty data guard (see backlog BL-004)

6. "save()" deep dive:
   - The full flow: action → audit → notification → draft cleanup
   - notifyScopedAdmins — how scoping works (sectionSlug → Section → AdminScope)
   - PII masking via maskPII()
   - Error handling (current: throw, planned: retry — see backlog BL-002)

7. "Draft System" deep dive:
   - Redis key format: draft:{userId}:{moduleSlug}
   - Auto-save in middleware
   - TTL management
   - Resume prompt (FR-009)
   - Command interrupts (/cancel, /help)
   - Current limitations: no Redis failure warning, no timeout (see backlog BL-001, BL-003)

8. "ModuleLoader" deep dive:
   - Discovery scan process
   - Module registration (conversations, i18n, DB upsert)
   - Error handling (notify SUPER_ADMINs on failure)
   - Performance target (QA-001: <5s)

9. "CLI Tools":
   - module:create — what it scaffolds
   - module:remove — safety checks
   - module:list — output format

10. "Known Limitations & Planned Improvements":
    - BL-001: Redis failure user warning
    - BL-002: save() automatic retry
    - BL-003: Conversation inactivity timeout
    - BL-004: confirm() empty data guard

Language: English

Commit with: "docs: create module-kit-reference.md from actual codebase"
```

---

#### B5: `docs/developer/getting-started.md` — إعداد بيئة التطوير

```
Create docs/developer/getting-started.md — developer onboarding guide.

Read these ACTUAL files:
- package.json (root — scripts, engines, workspaces)
- packages/core/package.json (dependencies)
- packages/module-kit/package.json
- packages/validators/package.json
- docker-compose.yml (services, ports, volumes)
- .env.example OR .env (if exists — environment variables)
- prisma/schema/main.prisma (datasource config)
- tsconfig.json (root config)
- CLAUDE.md (if exists — may have setup info)

Content requirements:
1. "Prerequisites" — Node.js version, npm/pnpm, Docker, Git
2. "Quick Start" — step-by-step from clone to running bot:
   - Clone repo
   - Install dependencies
   - Docker services up
   - Environment variables
   - Prisma generate + migrate
   - Run bot
3. "Project Scripts" — all npm scripts with descriptions
4. "Environment Variables" — table of all required env vars
5. "Troubleshooting" — common issues (port conflicts, Prisma errors, Redis connection)

Language: English

Commit with: "docs: create getting-started.md developer onboarding guide"
```

---

#### B6: `docs/developer/database-schema.md` — نموذج البيانات

```
Create docs/developer/database-schema.md — database reference.

Read these ACTUAL files:
- prisma/schema/main.prisma
- prisma/schema/platform.prisma
- prisma/schema/modules/ (if any module schemas exist)

Content requirements:
1. "Schema Organization" — multi-file Prisma setup explanation
2. "Platform Models" — for each model:
   - Fields table (name, type, constraints, description)
   - Relations
   - Indexes
3. "Module Schema Convention" — how modules add their own schema files
4. "Entity Relationship" — text description of key relationships (User → JoinRequest, User → AdminScope, Section → Module, etc.)

Language: English

Commit with: "docs: create database-schema.md from Prisma schemas"
```

---

#### B7: `docs/developer/i18n-guide.md` — دليل الترجمة

```
Create docs/developer/i18n-guide.md — internationalization guide.

Read these ACTUAL files:
- packages/core/src/locales/ar.ftl (all current keys)
- packages/core/src/locales/en.ftl (all current keys)
- packages/core/src/bot/i18n.ts OR wherever i18n is configured
- Any module locales in modules/*/locales/

Content requirements:
1. "How i18n Works" — Fluent (.ftl) format basics, ctx.t('key') usage
2. "Key Naming Convention":
   - Platform keys: descriptive names (e.g., join_request_already_pending)
   - Module Kit system keys: module-kit-* prefix
   - Module-specific keys: {module-slug}-* prefix
3. "Current Key Catalog" — table of ALL existing keys grouped by category
4. "Adding New Keys" — step-by-step (add to ar.ftl + en.ftl BEFORE using in code)
5. "The i18n-Only Rule" — explain the methodology principle with examples of violations

Language: English

Commit with: "docs: create i18n-guide.md from locale files"
```

---

#### B8: `docs/developer/ai-assistant-roadmap.md` — خطة AI

```
Create docs/developer/ai-assistant-roadmap.md — AI layer roadmap.

Read these files:
- specs/002-ai-assistant/spec.md
- specs/002-ai-assistant/plan.md (if exists)
- specs/002-ai-assistant/tasks.md (if exists)
- packages/ai-assistant/ (directory listing — what exists so far)
- docker-compose.yml (check if Ollama/pgvector services exist)

Content requirements:
1. "Vision" — what the AI assistant will do
2. "Technology Choices" — Qwen2.5:7b, Ollama, pgvector, nomic-embed-text (and WHY local)
3. "Current State" — what actually exists in code/config right now
4. "Roadmap Phases":
   - Phase A: Infrastructure (pgvector, Ollama in docker-compose)
   - Phase B: Core services (embedding, RAG, LLM client)
   - Phase C: Integration (bot handler, RBAC on RAG)
5. "AI-RBAC Rules" — the 4 role-based access rules
6. "Dependencies" — what must be completed in Layer 1 before AI work starts

Language: English

Commit with: "docs: create ai-assistant-roadmap.md from spec"
```

---

#### B9: `docs/developer/testing-guide.md` — دليل الاختبارات

```
Create docs/developer/testing-guide.md — testing reference.

Read these ACTUAL files:
- packages/module-kit/tests/*.test.ts (all test files)
- packages/validators/src/ (check for .test.ts files)
- package.json (test scripts)
- vitest.config.ts OR jest.config.ts (test framework config)

Content requirements:
1. "Test Framework" — what's used (Vitest/Jest), how to run
2. "Test Structure" — where tests live, naming convention
3. "Current Coverage" — what's tested, what's not
4. "Writing Tests" — patterns used in existing tests (with examples from actual test files)
5. "Integration Tests" — status (planned but not implemented)

Language: English

Commit with: "docs: create testing-guide.md from test files"
```

---

### المرحلة C: توثيق المستخدم (User Documentation)

**اللغة:** عربي
**الجمهور:** مستخدمو البوت (ليسوا مطورين)

---

#### C1: `docs/user/user-guide.md` — دليل المستخدم

```
Create docs/user/user-guide.md — end-user guide in ARABIC.

Read these files to understand the actual user experience:
- packages/core/src/bot/handlers/start.ts (what happens when user sends /start)
- packages/core/src/bot/conversations/join.ts (the join flow — steps user goes through)
- packages/core/src/bot/handlers/menu.ts (what menus user sees)
- packages/core/src/locales/ar.ftl (actual Arabic messages the bot sends)

Content requirements (ALL IN ARABIC):
1. "مقدمة" — ما هو بوت السعادة وما الذي يمكنك فعله به
2. "بدء الاستخدام" — خطوة بخطوة:
   - إرسال /start
   - إذا كنت أول مستخدم (Bootstrap — تصبح مدير أعلى تلقائياً)
   - إذا كنت مستخدم جديد (تعبئة طلب الانضمام)
   - إذا كنت مستخدم مُسجّل (تظهر القائمة)
3. "طلب الانضمام" — شرح كل خطوة:
   - الاسم الكامل (عربي فقط)
   - اسم الشهرة (يُولَّد تلقائياً)
   - رقم الهاتف (صيغة مصرية)
   - الرقم القومي (14 رقم)
4. "القوائم" — ماذا يرى كل دور
5. "الأوامر" — /start, /menu, /cancel, /help

Language: Arabic (العربية)
Style: بسيط وواضح — المستخدم ليس مطوراً

Commit with: "docs: create user-guide.md in Arabic"
```

---

#### C2: `docs/user/admin-guide.md` — دليل الأدمن

```
Create docs/user/admin-guide.md — admin guide in ARABIC.

Read these files:
- packages/core/src/bot/handlers/menu.ts (admin menu options)
- packages/core/src/services/join-requests.ts (approve/reject flow)
- prisma/schema/platform.prisma (User roles, AdminScope model)
- packages/core/src/locales/ar.ftl (admin-related messages)

Content requirements (ALL IN ARABIC):
1. "أدوار النظام" — شرح كل دور (SUPER_ADMIN, ADMIN, EMPLOYEE, VISITOR)
2. "إدارة طلبات الانضمام" — الموافقة والرفض
3. "نظام الصلاحيات" — AdminScope وكيف يعمل
4. "الإشعارات" — ما الإشعارات التي يتلقاها الأدمن
5. "الميزات القادمة" — إدارة الأقسام، نظام الصيانة (مُخطط لها)

Language: Arabic
Style: عملي ومباشر

Commit with: "docs: create admin-guide.md in Arabic"
```

---

#### C3: `docs/user/faq.md` — أسئلة شائعة

```
Create docs/user/faq.md — FAQ in ARABIC.

Build from actual bot behavior and common scenarios:

Content requirements (ALL IN ARABIC):
1. "لماذا لا يقبل البوت اسمي؟" — يجب أن يكون عربي، كلمتين على الأقل
2. "لماذا يظهر لي 'طلبك قيد المراجعة'؟" — شرح حالة PENDING
3. "هل يمكنني استخدام الأرقام العربية (٠١٢)؟" — نعم، يتم تحويلها تلقائياً
4. "ماذا يحدث إذا أرسلت /cancel أثناء إدخال البيانات؟" — يُحفظ كمسودة
5. "كيف أغير لغة البوت؟" — إذا كان مدعوماً
6. أضف أي أسئلة أخرى منطقية من فحص الكود

Language: Arabic
Style: سؤال وجواب — مباشر وقصير

Commit with: "docs: create faq.md in Arabic"
```

---

### المرحلة D: توثيق المشروع + التنظيف (Project Docs + Cleanup)

---

#### D1: `docs/project/backlog.md` — التحسينات المستقبلية

```
Create docs/project/backlog.md — improvement backlog.

Content:

# Improvement Backlog

**Last Updated**: 2026-03-03

## Module Kit Improvements (from /speckit.clarify session)

| ID | Title | Current Behavior | Planned Improvement | Priority | Affected Files |
|----|-------|-----------------|---------------------|----------|---------------|
| BL-001 | Redis failure user warning | Draft middleware catches errors silently (log only) | Warn user via module-kit-draft-save-unavailable | LOW | packages/core/src/bot/middleware/draft.ts |
| BL-002 | save() automatic retry | Throws error immediately, draft preserved | Max 1 retry before throwing, show module-kit-save-failed-persistent | LOW | packages/module-kit/src/persistence.ts |
| BL-003 | Conversation inactivity timeout | No timeout — handler stays active | 15-min timeout, release handler, keep draft | LOW | packages/core/src/bot/middleware/draft.ts |
| BL-004 | confirm() empty data guard | No validation | Throw developer error if data is empty | LOW | packages/module-kit/src/confirmation.ts |
| BL-005 | FR-007 doc alignment | FR-007 says "no standalone notifyScopedAdmins" | Update to reflect actual private helper | LOW | specs/003-module-kit/spec.md |

## Platform Core — Not Yet Implemented

| ID | Feature | Spec Reference | Phase |
|----|---------|---------------|-------|
| BL-010 | BullMQ notification queue | T053/T054 | Phase 1 remaining |
| BL-011 | Full RBAC with canAccess() | spec 001 | Phase 1 remaining |
| BL-012 | Section management via bot | spec 001 | Phase 1 remaining |
| BL-013 | Maintenance mode | spec 001 | Phase 1 remaining |
| BL-014 | Integration tests for join flow | spec 001 | Phase 1 remaining |

## Future i18n Keys (Not Yet Implemented)

- module-kit-draft-save-unavailable (ar + en)
- module-kit-save-failed-persistent (ar + en)
- module-kit-conversation-timeout (ar + en)

Commit with: "docs: create backlog.md with improvement tracking"
```

---

#### D2: `docs/project/changelog.md` — سجل التغييرات

```
Create docs/project/changelog.md — project changelog.

Read the git log to build this:
git log --oneline --since="2026-02-01" --format="%h %s (%ai)"

Content: Standard Keep a Changelog format (https://keepachangelog.com/)
Group by date, categorize as Added/Changed/Fixed/Removed.
Include only significant changes (not every small fix).

Commit with: "docs: create changelog.md from git history"
```

---

#### D3: التنظيف النهائي — حذف الملفات القديمة

```
Final cleanup — remove old wiki directory:

rm -rf docs/wiki/

# Verify no broken references
grep -r "docs/wiki" docs/ || echo "No broken references found"
grep -r "flow-engine" docs/developer/ docs/user/ docs/project/ || echo "No Flow Engine references in new docs"

Commit with: "docs: remove legacy wiki directory — restructuring complete"
```

---

## 4. ملاحظات مهمة للمنفّذ

### ما يجب الالتزام به:
- **اقرأ الكود الفعلي** — لا تعتمد على التوثيق القديم في wiki/
- **لا تذكر Flow Engine** في أي ملف جديد إلا في سياق "تم استبداله بـ Module Kit"
- **كل code example يجب أن يكون حقيقي** — من الكود الموجود فعلاً
- **الميزات غير المُنفَّذة** تُوضع في قسم واضح باسم "Planned / Not Yet Implemented"
- **i18n keys يجب أن تكون من ar.ftl/en.ftl الفعلي** — لا تخترع مفاتيح
- **تاريخ آخر تحديث** في أعلى كل ملف

### ما يُحظر:
- نسخ محتوى من docs/wiki/overview.md أو docs/wiki/modules.md مباشرة (قديم)
- ذكر Flow Blocks أو Config-Driven 90/10 كوصف للنظام الحالي
- كتابة نصوص عربية في ملفات developer/ (إنجليزي فقط)
- كتابة نصوص إنجليزية في ملفات user/ (عربي فقط)
- إنشاء توثيق لميزات غير موجودة في الكود بدون تمييزها بوضوح

### الترتيب الإلزامي:
```
المرحلة A (هيكلة) → المرحلة B (مطوّر) → المرحلة C (مستخدم) → المرحلة D (مشروع + تنظيف)
```

لا تبدأ المرحلة التالية قبل مراجعة المستشار التقني لمخرجات المرحلة الحالية.

---

## 5. أداة مساعدة: GitNexus

إذا كان GitNexus متاحاً، يمكن استخدامه لتسريع المراحل B:

```
# لـ architecture.md — استكشاف البنية
gitnexus_explore({ query: "middleware chain order in bot setup" })
gitnexus_explore({ query: "all exported services and their functions" })

# لـ module-kit-reference.md — استكشاف API
gitnexus_explore({ query: "validate function implementation and usage" })
gitnexus_explore({ query: "save function flow and notifyScopedAdmins" })

# لـ platform-core-reference.md — استكشاف الخدمات
gitnexus_explore({ query: "auditService methods and callers" })
gitnexus_explore({ query: "notification service exports" })
```

---

## 6. معايير القبول

| المعيار | الشرط |
|---------|-------|
| لا توجد إشارة لـ Flow Engine في الملفات الجديدة | ✅ مطلوب |
| كل code example موجود فعلاً في الكود | ✅ مطلوب |
| الميزات غير المُنفَّذة مُعلَّمة بوضوح | ✅ مطلوب |
| ملفات developer/ بالإنجليزية | ✅ مطلوب |
| ملفات user/ بالعربية | ✅ مطلوب |
| docs/wiki/ محذوف بالكامل | ✅ مطلوب |
| لا ملفات قديمة في docs/ root | ✅ مطلوب |
| docs/README.md يُشير لكل الملفات الجديدة | ✅ مطلوب |
| TypeDoc مُثبَّت و `npm run docs:api` يعمل بنجاح | ✅ مطلوب |
| `docs/api/` موجود في `.gitignore` | ✅ مطلوب |
| `typedoc.json` موجود في جذر المشروع | ✅ مطلوب |
