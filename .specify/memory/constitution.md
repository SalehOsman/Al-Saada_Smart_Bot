<!--
Sync Impact Report:
- Version change: 2.1.0 → 2.1.1 (PATCH: Removed duplicate sections)
- Modified principles: None
- Added sections: None
- Removed sections: Duplicate Simplicity and Monorepo principles at end of Core Principles
- Modified sections: Amendment History, Version Metadata
- Templates requiring updates: None
- No deferred placeholders
-->

# Al-Saada Smart Bot Constitution

## Table of Contents
1. Project Identity
2. Three-Layer Architecture
3. Roles & Permissions (RBAC)
4. Core Principles
5. Technology Stack
6. Development Phases
7. Governance

## Project Identity

- **Name (EN):** Al-Saada Smart Bot
- **Name (AR):** بوت السعادة الذكي
- **Description:** An intelligent, modular platform for Egyptian business management through Telegram. Designed as an empty engine that dynamically loads config-driven modules built using reusable Flow Blocks, with a built-in AI Operational Assistant trained on company data for queries, reports, and voice interaction.
- **Target Audience:** Any Egyptian organization (construction, maintenance, transport, general business)
- **Expected Users:** ~200 users
- **Primary Language:** Arabic (RTL), with English support
- **Bot Type:** Telegram Bot (single bot, multi-company ready in future)

## Three-Layer Architecture

### Layer 1: Platform Core (Fixed — Never changes per business)
- Bot engine setup (grammY framework)
- Authentication & user registration flow
- RBAC (Role-Based Access Control) with 4 roles
- Dynamic module loader (discovers and loads modules at startup)
- Section (department) management — sections are dynamic containers for modules
- Notification system (personal + role-based)
- Maintenance mode (blocks all access except Super Admin)
- Audit logging (all actions tracked)
- Redis session management
- Docker infrastructure (PostgreSQL + Redis)

### Layer 2: Module Kit (@al-saada/module-kit) (Fixed — Standardized toolkit)
The Module Kit provides standardized helpers and middleware to power dynamic module conversations:
- **Conversation Helpers** — Reusable logic blocks:
  - validate(): Interactive input with multi-retry validation and i18n support
  - confirm(): Summary screen with targeted inline editing
  - save(): Automatic persistence with built-in audit logging and admin notifications
- **Module Loader** — Dynamically discovers and registers modules from `modules/*/config.ts`
- **Draft Middleware** — Automatically persists user progress to Redis with sliding TTL
- **CLI Tools** — Scaffolding (`module:create`), removal (`module:remove`), and listing (`module:list`)

### Layer 3: Modules (Variable — Conversation-Based with Optional Hooks)
Each module consists of configuration files and grammY conversation handlers:
- config.ts — Module definition (name, section, permissions, icon, orderIndex)
- add.conversation.ts — Stateful data collection flow using validate/confirm/save
- edit.conversation.ts — Optional stateful editing flow
- schema.prisma — Module-specific database table definition
- locales/ — Module-specific Fluent (.ftl) files with slug-prefixed keys

Lifecycle Hooks (optional — only when helpers are insufficient):
- beforeSave: Custom business logic before database write (e.g., tax calculations)
- afterSave: Post-save actions (e.g., external API calls)
- beforeDelete: Pre-deletion checks or cascading logic

Key rules:
- Modules are NEVER hardcoded — discovered dynamically at startup
- Sections (departments) are dynamic — created/deleted/renamed by Super Admin
- A module belongs to exactly one section
- Helpers handle 90%+ of module behavior — hooks handle the remaining edge cases

## Roles & Permissions (RBAC)

### Super Admin
- Full control over the entire platform
- Create, edit, delete sections (departments)
- Create, enable, disable modules within any section
- Manage all users: assign roles, activate, deactivate
- Access all data across all sections and modules
- System settings: maintenance mode, bot configuration
- View audit logs
- Use AI Assistant for data queries, reports, and operational insights via text and voice. Configure AI settings (default model, fallback model, voice response, RAG update schedule) — all from within the bot (Phase 4)
- Receive all system-level notifications

### Admin
- Assigned to specific scope by Super Admin. Scope can be:
  - One or more specific sections (all modules within)
  - One or more specific modules (across any section)
  - Any combination of sections and modules
- Within assigned scope:
  - Full CRUD on all records
  - View and manage employees' data
  - Approve/reject requests (leaves, advances, etc.)
  - Generate reports
  - Receive notifications for their scope
  - Use AI Assistant within assigned scope — ask questions and generate reports about data in their sections/modules via text or voice
- Outside assigned scope: NO access at all
- Cannot create/delete sections or modules
- Cannot manage other admins or Super Admin

### Employee
- View own personal data only (profile, salary, leaves, attendance)
- Receive notifications relevant to them only
- Submit requests: leave requests, advance requests, complaints, etc.)
- View status of their submitted requests
- Use AI Assistant to ask about own data via text or voice (salary, leaves, attendance, requests status)
- Cannot view other employees' data
- Cannot access any admin functions
- Menu shows only modules they have permission to interact with

### Visitor
- Can only submit a join request (name, phone, message)
- Sees a single welcome screen with join request option
- Cannot access any other part of the bot
- Becomes Employee after Super Admin or Admin approval
- Join request notification sent to relevant admins

### Permission Resolution Rules
- Super Admin: bypasses all permission checks
- Admin: checked against assigned sections/modules list
- Employee: checked against their own employee ID only
- Visitor: hardcoded to join-request flow only
- If a user has no role assigned: treated as Visitor
- Role assignment is done by Super Admin only

## Core Principles

### I. Platform-First, Module-Second
The platform (Layer 1 + Layer 2) must be 100% complete and tested before any module is created. Modules follow Config-First architecture — primarily configuration with standardized conversation helpers (90/10 rule). All reusable logic lives in the Module Kit.

### II. Config-Driven Architecture (Config-First, Code-When-Needed)
Everything that can be configuration MUST be configuration, not code. Module creation should primarily require:
- Defining module identity and permissions in `config.ts`
- Specifying flow steps using `validate()` and `confirm()`
- Setting database fields in `schema.prisma`

For complex business logic that cannot be expressed as configuration:
- Use lifecycle hooks (beforeSave, afterSave, beforeDelete)
- Hooks must be minimal, focused, and well-documented
- A module with ZERO hooks is the ideal — hooks are the exception, not the rule

The 90/10 Rule: A typical module should be 90% configuration and at most 10% custom hook code. If a module needs more than 10% custom code, the Module Kit likely needs a new helper or feature.

### III. Helper Reusability (NON-NEGOTIABLE)
Every Module Kit helper must be:
- Self-contained and independently testable
- Work with ANY module without modification
- Handle its own validation, error messages, and UI
- Support Arabic and English (via i18n keys)
- Be configurable via options (promptKey, errorKey, validator, etc.)

When a hook pattern repeats across 3+ modules, it MUST be extracted into a new helper or a shared utility in the Module Kit. Hooks are for exceptional cases — repeated patterns belong in the kit.

### IV. Test-First Development
All Module Kit helpers must have unit tests before implementation. All infrastructure features (ModuleLoader, Draft Middleware) must have integration tests. Red-Green-Refactor cycle enforced. Minimum 80% code coverage for engine code.

### V. Egyptian Business Context
All validators must support Egyptian formats (national ID, phone numbers, tax IDs). Arabic name processing with compound name handling. Egyptian governorates as seed data. Currency defaults to EGP. Timezone defaults to Africa/Cairo. Calendar support for both Gregorian and Hijri.

### VI. Security & Privacy
- **Secure Bootstrap**: The initial `SUPER_ADMIN` user must be bootstrapped via a secure, deterministic mechanism. The system will assign the `SUPER_ADMIN` role only to the user whose Telegram ID matches a pre-configured, private environment variable (`INITIAL_SUPER_ADMIN_ID`). This prevents "first-come, first-served" race conditions and ensures administrative control is explicitly designated.
- No sensitive data in logs.
- All user actions audited.
- Session management via Redis.
- Maintenance mode for safe deployments.
- Input sanitization on all user inputs.

### VII. i18n-Only User Text (NON-NEGOTIABLE)
Arabic is the primary language of the application. However, Arabic text is STRICTLY FORBIDDEN in source code files.

**The Rule:** All user-facing text — messages, labels, button captions, error messages, status strings, and any text displayed to users — MUST be defined exclusively in `.ftl` locale files:
- `packages/core/src/locales/ar.ftl` — Arabic (primary)
- `packages/core/src/locales/en.ftl` — English (secondary)

**In Code:**
- Reference translation keys only: `ctx.t('errors.section.has_active_modules')`
- Functions that classify data (gender, status, role) MUST return i18n keys, not display text
- No Arabic string literals anywhere in TypeScript/JavaScript source files

**In Specification Documents (spec.md, tasks.md, plan.md):**
- When documenting error messages, write: via i18n key `errors.example.key`
- Never write the Arabic text directly in task descriptions

**Violation Examples:**
- ❌ `ctx.reply('لا يمكن حذف القسم')` — hardcoded Arabic in code
- ❌ `return 'ذكر'` — Arabic in function return
- ✅ `ctx.reply(ctx.t('errors.section.has_active_modules'))` — correct
- ✅ `return 'gender.male'` — returns i18n key

**Why:** Mixing Arabic text in source code causes encoding issues, makes code reviews harder, breaks grep/search tools, and violates single-responsibility principle. Locale files are the single source of truth for all displayed text.

### VIII. Simplicity Over Cleverness
Start simple, add complexity only when proven necessary. YAGNI principle strictly enforced. No premature optimization. Clear naming conventions (Arabic-friendly). Every file has a single clear purpose.

### IX. Monorepo Structure
The project uses a monorepo with clear package separation:
- packages/core — Platform Core (Layer 1)
- packages/module-kit — Module Kit (@al-saada/module-kit) (Layer 2)
- packages/validators — Egyptian validation library
- packages/ai-assistant — AI Operational Assistant with RAG (Phase 4)
- modules/ — All modules (config + conversations)

### X. Zero-Defect Gate (NON-NEGOTIABLE)
No phase or task may proceed until all issues from the current phase are fully resolved.

**The Rule:** Never advance with broken code — every step must be 100% correct before moving to the next.

**Mandatory sequence for every Phase:**
1. Run `/speckit.analyze` → zero issues required before implementation
2. Fix CRITICAL → fix HIGH → fix MEDIUM
3. Re-run `/speckit.analyze` → confirm zero issues
4. Run `/speckit.implement` → execute tasks
5. All tests must be 100% passing
6. Final `/speckit.analyze` → confirm clean state
7. Only then advance to next Phase

**Applies to:** all `/speckit.analyze` findings, all TypeScript/Linting errors, all test failures, all cross-artifact inconsistencies (spec, plan, tasks, constitution).

**Violation:** Advancing to any new step with unresolved issues is an explicit constitutional breach requiring immediate rollback and full remediation before continuing.

## Technology Stack

### Core
- **Runtime:** Node.js ≥20
- **Language:** TypeScript 5.x (strict mode)
- **Bot Framework:** grammY 1.x + @grammyjs/conversations + @grammyjs/hydrate
- **Server:** Hono (webhook + optional API)
- **ORM:** Prisma with PostgreSQL
- **Cache:** Redis (ioredis)
- **Task Queue:** BullMQ (background jobs)
- **Logger:** Pino + pino-pretty
- **Validation:** Zod (schema validation for all inputs)
- **i18n:** @grammyjs/i18n (Arabic primary, English secondary)
- **Dates:** dayjs (timezone + Hijri calendar support)
- **IDs:** nanoid
- **Scheduler:** node-cron
- **Reports:** ExcelJS (Excel), PDFKit (PDF)

### Infrastructure
- Docker Compose (PostgreSQL + Redis + Bot)
- Prisma Studio (visual DB browser)

### Development Tools
- **Linting:** ESLint with @antfu/eslint-config
- **Git Hooks:** Husky + lint-staged
- **Testing:** Vitest
- **Build:** tsup (production) + tsx (development)
- **Commits:** commitlint (conventional commits)
- **Changelog:** changelogen
- **AI Agent Skills:** Curated skills from `antigravity-awesome-skills` installed locally in `.agents/skills/`. Governance rules: (1) Skills must be cherry-picked individually — no bulk installation. (2) Skills must NOT be used to bypass Config-First architecture. (3) Only the Technical Advisor (AI) selects and applies skills — the Executor follows the plan.

### AI Assistant (Phase 4)
- **AI Framework:** Vercel AI SDK (@ai-sdk/*) — unified interface for all models
- **Primary Model (Local):** Qwen2.5:7b running via Ollama — lighter than Qwen3-8B, excellent Arabic support, handles 90% of daily queries with full data privacy
- **Embeddings Model:** nomic-embed-text via Ollama — Arabic-capable, fully local, no external APIs
- **Fallback Models (Cloud):** Gemini API (free tier), Claude API, OpenAI API — for complex analysis when local model is insufficient
- **RAG Engine:** pgvector (PostgreSQL extension) — embeddings from company database (employees, equipment, finances, sections, modules, audit logs) — no additional DB required
- **Speech-to-Text (STT):** OpenAI Whisper API or Google STT — converts voice messages to text
- **Text-to-Speech (TTS):** Google TTS or OpenAI TTS — Arabic voice responses
- **Model Switching:** All AI settings configurable from bot by Super Admin (no code changes)
- **Parallel Build Strategy:** AI infrastructure built in parallel with Layer 1 — not after it
  - Phase A (parallel with Phase 6-7): pgvector + Ollama in docker-compose, empty packages/ai-assistant/ scaffold
  - Phase B (parallel with Phase 8-9): Embeddings table in Prisma, Embedding Service, RAG Service, LLM Client
  - Phase C (after Phase 11): Full bot integration, RBAC on RAG, conversation UI

## Development Phases

### Phase 1: Platform Core (Feature 001)
- Bot engine setup and configuration
- Authentication & user registration
- RBAC system with 4 roles
- Dynamic module loader
- Section management
- Maintenance mode
- Docker setup (PostgreSQL + Redis)
- Basic notification system
- Audit logging

### Phase 2: Module Kit (Feature 002)
- CLI scaffolding tools (`module:create`, `module:remove`, `module:list`)
- Conversation Helpers (`validate`, `confirm`, `save`)
- Draft recovery middleware with sliding TTL
- Automatic audit logging and notifications
- Dynamic module auto-discovery

### Phase 3: Test Module (Feature 003)
- One complete HR module (Employee Registration)
- Built entirely with Module Kit conversation helpers
- Proves the platform works end-to-end

### Phase 4: AI Operational Assistant (Feature 004)
- RAG engine trained on company database using pgvector embeddings — not general AI, but company-specific knowledge
- Primary local model: Qwen2.5:7b via Ollama — lighter, faster, excellent Arabic support, full data privacy
- Embeddings: nomic-embed-text via Ollama — fully local, Arabic-capable
- Cloud models (Gemini/Claude/GPT) as fallback for complex tasks
- All AI configuration managed from bot by Super Admin:
  - Default model selection (local or cloud)
  - Fallback model selection
  - Voice response toggle (on/off)
  - RAG update schedule (manual trigger or daily auto-sync)
- Natural language data queries in Arabic via text or voice ("كم موظف في إجازة اليوم؟" / "ما حالة المعدة رقم 105؟")
- Voice input: user sends voice message → STT → AI processes with RAG context → responds with text + optional voice reply
- AI-powered report generation and data summarization from company data
- All AI responses respect RBAC — user only gets answers about data they have permission to access
- AI is read-only — no data modification through AI, only queries and reports
- Provider-agnostic via Vercel AI SDK — switch models by changing one config value from bot
- **Parallel Build Strategy (decided 2026-02-24):** AI infrastructure is built in parallel with Layer 1 phases, not after full completion:
  - Phase A (parallel Phase 6-7): docker-compose adds pgvector + Ollama services, packages/ai-assistant/ scaffold created
  - Phase B (parallel Phase 8-9): Embedding table in Prisma, Embedding Service, RAG Service, LLM Client built
  - Phase C (after Phase 11): Full integration — RBAC-aware RAG, bot conversation handler, production-ready

## Governance

### Authority
- This constitution is the highest authority in the project
- It supersedes all other practices, conventions, and decisions
- The AI agent MUST reference this constitution before any implementation decision

### Amendment Process
- Amendments require: description of change, rationale, and date
- Only Super Admin (project owner) can approve constitutional amendments
- Each amendment increments the version number (MAJOR.MINOR.PATCH)
  - MAJOR: Fundamental philosophy change
  - MINOR: New principle/section added or materially expanded guidance
  - PATCH: Clarifications, wording, typo fixes, non-semantic refinements

### Compliance Rules
- All code must comply with these principles before merge
- No module-specific code is allowed in platform packages (packages/core, packages/module-kit)
- Any deviation from the constitution must be documented and justified
- Code reviews must verify constitutional compliance
- **Strict Methodology Adherence (NON-NEGOTIABLE):** The Technical Advisor (AI) and the Executor (AI) MUST strictly follow the operating procedures defined by [github/spec-kit](https://github.com/github/spec-kit) and [sickn33/antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills).
  - **Advisor Rule:** The Advisor must plan, create clear task cards, and use specific Antigravity skills (like `architect`, `plan-writing`, `conductor`) without jumping into manual raw bash implementation unless explicitly necessary for a break-glass fix.
  - **Executor Rule:** The Executor (`/speckit.implement`) must ONLY implement predefined implementation tasks from `tasks.md`. It must NOT be used to hack documentation files (`spec.md`, `tasks.md`, etc.) via bash commands. The `analyze` gate MUST be respected before implementation.
- **AI Skills Restriction:** AI Agent Skills MUST NOT be used to bypass the Config-First architecture. They must be cherry-picked and installed individually as needed, rather than blindly bulk-installed.

### Amendment History
| Version | Date | Description |
|---|---|---|
| 1.0.0 | 2026-02-17 | Initial constitution with 8 core principles |
| 1.1.0 | 2026-02-17 | Added Project Identity, Three-Layer Architecture, RBAC |
| 1.2.0 | 2026-02-17 | Formatting fixes, expanded governance, added TOC |
| 1.3.0 | 2026-02-17 | Added Hooks system to Layer 3, updated Config-Driven principle to Config-First |
| 1.4.0 | 2026-02-17 | Replaced AI Module Builder with AI Operational Assistant — local open-source model (Gemma/Ollama) as primary with RAG on company DB, cloud models as fallback, voice support (STT/TTS), all settings configurable from bot, RBAC-aware responses |
| 1.4.1 | 2026-02-17 | Specified Qwen3-8B as primary local AI model — chosen for superior Arabic language support, Apache 2.0 license, built-in function calling, and RAG-optimized context window |
| 1.5.0 | 2026-02-20 | Added Secure Bootstrap rule to Principle VI (Security & Privacy) |
| 1.6.0 | 2026-02-20 | Updated Principle VI to use Telegram ID (INITIAL_SUPER_ADMIN_ID) instead of phone number for bootstrapping |
| 1.7.0 | 2026-02-20 | Formalized integration and governance of Antigravity Awesome Skills |
| 1.8.0 | 2026-02-24 | Updated AI Assistant: Qwen2.5:7b (from Qwen3-8B), added nomic-embed-text for embeddings, defined Parallel Build Strategy (Phase A/B/C) |
| 2.0.0 | 2026-02-24 | Added Principle VII: i18n-Only User Text — Arabic forbidden in source code, all text via .ftl locale files. Renumbered principles VIII-XI. |
| 2.1.0 | 2026-03-02 | 003-module-kit: Replaced Flow Engine with Module Kit architecture. Layer 2 now provides @al-saada/module-kit package with conversation helpers, RBAC, draft middleware, and CLI tools. |
| 2.1.1 | 2026-03-02 | Removed duplicate Simplicity Over Cleverness and Monorepo Structure sections. |

**Version**: 2.1.1 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-03-02
