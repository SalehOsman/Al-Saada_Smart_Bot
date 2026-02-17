Read the current constitution at .specify/memory/constitution.md and add the following three missing sections. Insert them BEFORE the "Core Principles" section. Keep all existing content unchanged. Update the version to 1.1.0 and Last Amended date to today.

## Section 1: Project Identity (insert at the very top after the title)

### Project Identity
- **Name (EN):** Al-Saada Smart Bot
- **Name (AR):** بوت السعادة الذكي
- **Description:** An intelligent, modular platform for Egyptian business management through Telegram. Designed as an empty engine that dynamically loads config-driven modules built using reusable Flow Blocks.
- **Target Audience:** Any Egyptian organization (construction, maintenance, transport, general business)
- **Expected Users:** ~200 users
- **Primary Language:** Arabic (RTL), with English support
- **Bot Type:** Telegram Bot (single bot, multi-company ready in future)

## Section 2: Three-Layer Architecture (insert after Project Identity, before Core Principles)

### Three-Layer Architecture

#### Layer 1: Platform Core (Fixed — Never changes per business)
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

#### Layer 2: Flow Engine (Fixed — The brain of the platform)
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

#### Layer 3: Modules (Variable — Config only, NO code!)
Each module consists of configuration files only:
- module.config.ts — Module definition (name, section, permissions, icon, menu order)
- add.flow.ts — Add record flow (ordered array of Flow Block steps)
- edit.flow.ts — Edit record flow
- view.config.ts — Single record view configuration
- list.config.ts — List display configuration (columns, filters, sort)
- report.config.ts — Report generation configuration
- schema.prisma — Database table definition for this module

Key rules:
- Modules are NEVER hardcoded — discovered dynamically at startup
- Sections (departments) are dynamic — created/deleted/renamed by Super Admin
- A module belongs to exactly one section
- Modules contain ZERO TypeScript logic — all behavior comes from Flow Engine

## Section 3: Roles & Permissions (insert after Three-Layer Architecture, before Core Principles)

### Roles & Permissions (RBAC)

#### Super Admin
- Full control over the entire platform
- Create, edit, delete sections (departments)
- Create, enable, disable modules within any section
- Manage all users: assign roles, activate, deactivate
- Access all data across all sections and modules
- System settings: maintenance mode, bot configuration
- View audit logs
- Use AI Module Builder (Phase 4)
- Receive all system-level notifications

#### Admin
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

#### Employee
- View own personal data only (profile, salary, leaves, attendance)
- Receive notifications relevant to them only
- Submit requests: leave requests, advance requests, complaints, etc.
- View status of their submitted requests
- Cannot view other employees' data
- Cannot access any admin functions
- Menu shows only modules they have permission to interact with

#### Visitor
- Can only submit a join request (name, phone, message)
- Sees a single welcome screen with join request option
- Cannot access any other part of the bot
- Becomes Employee after Super Admin or Admin approval
- Join request notification sent to relevant admins

#### Permission Resolution Rules
- Super Admin: bypasses all permission checks
- Admin: checked against assigned sections/modules list
- Employee: checked against their own employee ID only
- Visitor: hardcoded to join-request flow only
- If a user has no role assigned: treated as Visitor
- Role assignment is done by Super Admin only