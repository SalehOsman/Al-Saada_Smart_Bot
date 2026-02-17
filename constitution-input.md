Create the project constitution for "Al-Saada Smart Bot" based on the following comprehensive project definition:
Project Identity

Name (EN): Al-Saada Smart Bot
Name (AR): بوت السعادة الذكي
Description: An intelligent, modular platform for Egyptian business management through Telegram, designed as an empty engine that dynamically loads config-driven modules built using reusable Flow Blocks.
Target: Any Egyptian organization (construction, maintenance, transport, general business)
Expected Users: ~200 users
Primary Language: Arabic (RTL), with English support

Core Philosophy — The Three-Layer Architecture
The platform follows a strict three-layer separation:
Layer 1: Platform Core (Fixed — Never changes per business)

Bot engine setup (grammY framework)
Authentication & user registration
RBAC (Role-Based Access Control) with 4 roles
Dynamic module loader (discovers and loads modules at startup)
Section (department) management — sections are containers for modules
Notification system
Maintenance mode
Audit logging

Layer 2: Flow Engine (Fixed — The brain of the platform)
The Flow Engine converts config files into fully working Telegram bot screens. It contains:

Flow Blocks: Reusable building blocks for any workflow:

text_input, number_input, date_input (calendar), phone_input (Egyptian validation)
national_id (with auto-extraction of birthdate, gender)
email_input, currency_input, location_input
select_from_db (dynamic from any DB table), select_enum (static options)
file_upload, photo_upload
confirm (summary + save + notifications)
approval (manager approval workflow)


Wizard Runner: Reads flow steps array and executes them sequentially
List Engine: Displays paginated, filterable, searchable lists from any table
Report Engine: Generates Excel/PDF reports from any data
Search Engine: Smart search across any module's data

Layer 3: Modules (Variable — Config only, no code!)
Each module is purely configuration files:

module.config.ts — Module definition (name, section, permissions, icon)
add.flow.ts — Add record flow (array of Flow Block steps)
edit.flow.ts — Edit record flow
list.config.ts — List display configuration
report.config.ts — Report generation configuration
schema.prisma — Database table definition

Modules are NEVER hardcoded. They are discovered dynamically at startup.
Sections (departments) are also dynamic — they are created/deleted by Super Admin.
Roles & Permissions (RBAC)
Super Admin

Full control over everything
Create/delete sections and modules
Manage all users and roles
Access all data across all sections
System settings and maintenance mode
Can use AI Module Builder (Phase 4)

Admin

Assigned to specific sections OR specific modules (configurable per admin)
Full CRUD within assigned scope
Can manage employees within their scope
Can approve/reject requests within their scope
Cannot create sections or modules

Employee

View their own data only (personal info, salary, leaves, etc.)
Receive notifications relevant to them
Submit requests (leave requests, advances, etc.)
Cannot view other employees' data

Visitor

Can only submit a join request
Sees nothing else in the bot
Becomes Employee after admin approval

Tech Stack
Core:

Runtime: Node.js ≥20
Language: TypeScript 5.x (strict mode)
Bot Framework: grammY + @grammyjs/conversations + @grammyjs/hydrate
Server: Hono (webhook + optional API)
ORM: Prisma with PostgreSQL
Cache: Redis (ioredis)
Task Queue: BullMQ (background jobs)
Logger: Pino + pino-pretty
Validation: Zod (schema validation for all inputs)
i18n: @grammyjs/i18n (Arabic primary, English secondary)
Dates: dayjs (timezone + Hijri calendar support)
IDs: nanoid
Scheduler: node-cron
Reports: ExcelJS (Excel), PDFKit (PDF)

Infrastructure:

Docker Compose (PostgreSQL + Redis + Bot)
Prisma Studio (visual DB browser)

Development Tools:

ESLint: @antfu/eslint-config
Git Hooks: Husky + lint-staged
Testing: Vitest
Build: tsup (production) + tsx (development)
Commit: commitlint (conventional commits)
Changelog: changelogen

Future (Phase 4):

AI/RAG: Vercel AI SDK or LangChain.js
Vector DB: pgvector (Prisma extension)

Development Principles
I. Platform-First, Module-Second
The platform (Layer 1 + Layer 2) must be 100% complete and tested before any module is created. Modules are pure configuration — they contain ZERO business logic code. All logic lives in the Flow Engine.
II. Config-Driven Architecture
Everything that can be configuration MUST be configuration, not code. Module creation should require only:

Defining flow steps (which Flow Blocks in what order)
Specifying database fields
Setting permissions
No TypeScript code should be written to create a standard module.

III. Flow Block Reusability (NON-NEGOTIABLE)
Every Flow Block must be:

Self-contained and independently testable
Work with ANY module without modification
Handle its own validation, error messages, and UI
Support Arabic and English
Be configurable via parameters (label, field, validation rules, etc.)

IV. Test-First Development

All Flow Blocks must have unit tests before implementation
All engine features must have integration tests
Red-Green-Refactor cycle enforced
Minimum 80% code coverage for engine code

V. Egyptian Business Context

All validators must support Egyptian formats (national ID, phone numbers, tax IDs)
Arabic name processing with compound name handling
Egyptian governorates as seed data
Currency defaults to EGP
Timezone defaults to Africa/Cairo
Calendar support for both Gregorian and Hijri

VI. Security & Privacy

No sensitive data in logs
All user actions audited
Session management via Redis
Maintenance mode for safe deployments
Input sanitization on all user inputs

VII. Simplicity Over Cleverness

Start simple, add complexity only when proven necessary
YAGNI principle strictly enforced
No premature optimization
Clear naming conventions (Arabic-friendly)
Every file has a single clear purpose

VIII. Monorepo Structure
The project uses a monorepo with clear package separation:

packages/core — Platform Core (Layer 1)
packages/flow-engine — Flow Engine (Layer 2)
packages/validators — Egyptian validation library
packages/ai-builder — RAG Module Builder (Phase 4)
modules/ — All modules (config files only)

Development Phases
Phase 1: Platform Core (Feature 001)

Bot engine, auth, RBAC, module loader
Section management, maintenance mode
Docker setup (PostgreSQL + Redis)
Basic notification system

Phase 2: Flow Engine (Feature 002)

All Flow Blocks implementation
Wizard Runner, List Engine, Report Engine
Search Engine

Phase 3: Test Module (Feature 003)

One complete HR module (e.g., Employee Registration)
Built entirely with Flow Blocks config
Proves the platform works end-to-end

Phase 4: AI Module Builder (Feature 004)

RAG knowledge base
Conversational module creation via bot
Auto-generation of config files

Governance

This constitution supersedes all other practices
Amendments require documentation with rationale and date
All code must comply with these principles
The AI agent must reference this constitution before any implementation decision
No module-specific code is allowed in the platform packages