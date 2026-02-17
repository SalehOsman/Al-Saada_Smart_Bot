<!--
Sync Impact Report:
- Version change: 1.2.0 → 1.3.0 (MINOR: Added Hooks system to Layer 3, updated Config-Driven principle)
- Modified principles: II. Config-Driven Architecture (updated to Config-First with hooks), III. Flow Block Reusability (added hook pattern extraction rule)
- Added sections: Practical Example in Layer 2
- No removed sections
- Modified sections: Three-Layer Architecture (Layer 3 updated), Core Principles (Principles II & III updated)
- Templates requiring updates: .specify/templates/plan-template.md (ensure no hardcoded module assumptions)
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
- **Description:** An intelligent, modular platform for Egyptian business management through Telegram. Designed as an empty engine that dynamically loads config-driven modules built using reusable Flow Blocks.
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

### Layer 2: Flow Engine (Fixed — The brain of the platform)
The Flow Engine converts config files into fully working Telegram bot screens:
- **Flow Blocks** — Reusable building blocks:
  - text_input: Free text with validation (min/max length, regex, Arabic-only, etc.)
  - number_input: Numeric input with range validation
  - date_input: Interactive calendar picker with date validation
  - phone_input: Egyptian phone validation (010/011/012/015) with operator detection
  - national_id: 14-digit Egyptian ID with auto-extraction of birthdate, gender, governorate
  - email_input: Email format validation
  - currency_input: Money amount with EGP default
  - location_input: GPS or text address
  - select_from_db: Dynamic selection from any database table (filterable)
  - select_enum: Static options list (e.g., gender, status, type)
  - file_upload: Document upload with type/size validation
  - photo_upload: Image upload with compression
  - confirm: Summary screen + save + optional notifications
  - approval: Manager/admin approval workflow step
- **Wizard Runner** — Reads flow steps array and executes them sequentially, handles back/skip/cancel
- **List Engine** — Paginated, filterable, searchable lists from any table
- **Report Engine** — Excel/PDF report generation from any data query
- **Search Engine** — Smart search across any module's data

**Example: Employee Registration Module (Config + Hooks)**
```
// Config handles: UI steps, field types, validation, DB mapping
steps: [
  { block: 'text_input', field: 'fullName' },
  { block: 'national_id', field: 'nationalId' },
  { block: 'currency_input', field: 'basicSalary' },
  { block: 'confirm', showSummary: true },
]

// Hook handles: Complex Egyptian tax calculation (cannot be config)
hooks: {
  beforeSave: async (data) => {
    data.taxAmount = calculateEgyptianTax(data.basicSalary);
  }
}
```

### Layer 3: Modules (Variable — Config-First with Optional Hooks)
Each module consists of configuration files with optional lifecycle hooks:
- module.config.ts — Module definition (name, section, permissions, icon, menu order)
- add.flow.ts — Add record flow (ordered array of Flow Block steps + optional hooks)
- edit.flow.ts — Edit record flow
- view.config.ts — Single record view configuration
- list.config.ts — List display configuration (columns, filters, sort)
- report.config.ts — Report generation configuration
- schema.prisma — Database table definition for this module

Lifecycle Hooks (optional — only when config is insufficient):
- beforeValidate: Modify or enrich data before validation runs
- beforeSave: Custom business logic before database write (e.g., tax calculations, complex validations)
- afterSave: Post-save actions (e.g., custom notifications, external API calls)
- beforeDelete: Pre-deletion checks or cascading logic
- onApproval: Custom logic when a request is approved
- onRejection: Custom logic when a request is rejected

Hook Rules:
- Hooks are OPTIONAL — most modules should work with config alone
- Hooks must be minimal and focused (single responsibility)
- Hooks must NOT contain UI logic — UI is always handled by Flow Blocks
- Hooks must NOT replace what config can do — use config first, hooks only for exceptions
- Hooks receive typed context (data, user, prisma) and return modified data or throw errors
- All hooks are async and have access to database and services

Key rules:
- Modules are NEVER hardcoded — discovered dynamically at startup
- Sections (departments) are dynamic — created/deleted/renamed by Super Admin
- A module belongs to exactly one section
- Config handles 90%+ of module behavior — hooks handle the remaining edge cases

## Roles & Permissions (RBAC)

### Super Admin
- Full control over the entire platform
- Create, edit, delete sections (departments)
- Create, enable, disable modules within any section
- Manage all users: assign roles, activate, deactivate
- Access all data across all sections and modules
- System settings: maintenance mode, bot configuration
- View audit logs
- Use AI Module Builder (Phase 4)
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
- Outside assigned scope: NO access at all
- Cannot create/delete sections or modules
- Cannot manage other admins or Super Admin

### Employee
- View own personal data only (profile, salary, leaves, attendance)
- Receive notifications relevant to them only
- Submit requests: leave requests, advance requests, complaints, etc.
- View status of their submitted requests
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
The platform (Layer 1 + Layer 2) must be 100% complete and tested before any module is created. Modules are pure configuration — they contain ZERO business logic code. All logic lives in the Flow Engine.

### II. Config-Driven Architecture (Config-First, Code-When-Needed)
Everything that can be configuration MUST be configuration, not code. Module creation should primarily require:
- Defining flow steps (which Flow Blocks in what order)
- Specifying database fields
- Setting permissions

For complex business logic that cannot be expressed as configuration:
- Use lifecycle hooks (beforeValidate, beforeSave, afterSave, beforeDelete, onApproval, onRejection)
- Hooks must be minimal, focused, and well-documented
- A module with ZERO hooks is the ideal — hooks are the exception, not the rule

The 90/10 Rule: A typical module should be 90% configuration and at most 10% custom hook code. If a module needs more than 10% custom code, the Flow Engine likely needs a new Flow Block or feature.

### III. Flow Block Reusability (NON-NEGOTIABLE)
Every Flow Block must be:
- Self-contained and independently testable
- Work with ANY module without modification
- Handle its own validation, error messages, and UI
- Support Arabic and English
- Be configurable via parameters (label, field, validation rules, etc.)

When a hook pattern repeats across 3+ modules, it MUST be extracted into a new Flow Block or a shared utility in the Flow Engine. Hooks are for exceptional cases — repeated patterns belong in the engine.

### IV. Test-First Development
All Flow Blocks must have unit tests before implementation. All engine features must have integration tests. Red-Green-Refactor cycle enforced. Minimum 80% code coverage for engine code.

### V. Egyptian Business Context
All validators must support Egyptian formats (national ID, phone numbers, tax IDs). Arabic name processing with compound name handling. Egyptian governorates as seed data. Currency defaults to EGP. Timezone defaults to Africa/Cairo. Calendar support for both Gregorian and Hijri.

### VI. Security & Privacy
No sensitive data in logs. All user actions audited. Session management via Redis. Maintenance mode for safe deployments. Input sanitization on all user inputs.

### VII. Simplicity Over Cleverness
Start simple, add complexity only when proven necessary. YAGNI principle strictly enforced. No premature optimization. Clear naming conventions (Arabic-friendly). Every file has a single clear purpose.

### VIII. Monorepo Structure
The project uses a monorepo with clear package separation:
- packages/core — Platform Core (Layer 1)
- packages/flow-engine — Flow Engine (Layer 2)
- packages/validators — Egyptian validation library
- packages/ai-builder — RAG Module Builder (Phase 4)
- modules/ — All modules (config files only)

## Technology Stack

### Core
- **Runtime:** Node.js ≥20
- **Language:** TypeScript 5.x (strict mode)
- **Bot Framework:** grammY + @grammyjs/conversations + @grammyjs/hydrate
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

### Future (Phase 4)
- **AI/RAG:** Vercel AI SDK or LangChain.js
- **Vector DB:** pgvector (Prisma extension)

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

### Phase 2: Flow Engine (Feature 002)
- All Flow Blocks implementation (14 blocks)
- Wizard Runner
- List Engine
- Report Engine
- Search Engine

### Phase 3: Test Module (Feature 003)
- One complete HR module (Employee Registration)
- Built entirely with Flow Blocks config
- Proves the platform works end-to-end

### Phase 4: AI Module Builder (Feature 004)
- RAG knowledge base
- Conversational module creation via bot
- Auto-generation of config files

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
  - MINOR: New sections or significant additions
  - PATCH: Formatting, clarification, or minor fixes

### Compliance Rules
- All code must comply with these principles before merge
- No module-specific code is allowed in platform packages (packages/core, packages/flow-engine)
- Any deviation from the constitution must be documented and justified
- Code reviews must verify constitutional compliance

### Amendment History
| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2026-02-17 | Initial constitution with 8 core principles |
| 1.1.0 | 2026-02-17 | Added Project Identity, Three-Layer Architecture, RBAC |
| 1.2.0 | 2026-02-17 | Formatting fixes, expanded governance, added TOC |
| 1.3.0 | 2026-02-17 | Added Hooks system to Layer 3, updated Config-Driven principle to Config-First |

**Version**: 1.3.0 | **Ratified**: 2026-02-17 | **Last Amended**: 2026-02-17