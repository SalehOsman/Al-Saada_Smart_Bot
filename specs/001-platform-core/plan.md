# Implementation Plan: Platform Core (Layer 1)

**Branch**: `001-platform-core` | **Date**: 2026-02-17 | **Spec**: [spec.md](./spec.md) | **Constitution**: v2.0.0

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Platform Core (Layer 1) implementation for Al-Saada Smart Bot - the foundational Telegram bot platform with RBAC, section management, dynamic module loading, and comprehensive audit logging. This phase focuses on establishing the core infrastructure that all future modules will depend on.

## Technical Context

**Language/Version**: Node.js ≥20 with TypeScript 5.x (strict mode)
**Primary Dependencies**: grammY 1.x, @grammyjs/conversations, @grammyjs/hydrate, Hono, Prisma, ioredis, BullMQ, Pino, Zod, @grammyjs/i18n, nanoid, dayjs, node-cron

**ID Generation Strategy**: `cuid` is used for all primary database IDs (Section, Module, JoinRequest, AuditLog, Notification, AdminScope) via Prisma's `@default(cuid())`. `nanoid` is only used for generating short, user-friendly request codes (e.g., ticket/reference IDs displayed to users) where a human-readable format is needed.
**Storage**: PostgreSQL 16 (primary), Redis 7 (cache/sessions)
**Testing**: Vitest with 80% coverage requirement
**Target Platform**: Linux server with Docker Compose
**Project Type**: Monorepo - platform package in packages/core/
**Performance Goals**: ~200 concurrent users, 99.9% uptime, <500ms p95 response time
**Constraints**: Arabic-first UI, RTL support, 24-hour session expiry, audit logging
**Scale/Scope**: ~200 users initially, 4 RBAC roles, dynamic section/module system

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Task T114 (Zero-Defect Gate verification) MUST be completed before closing any phase.

### Al-Saada Smart Bot Principle Checks

1. **Platform-First Principle**: Platform Core (Layer 1) must be 100% complete and tested before any module is created. Modules are primarily configuration (Config-First). Optional lifecycle hooks (beforeSave, afterSave, etc.) are allowed for complex business logic that cannot be expressed as configuration. The 90/10 rule applies: 90% config, max 10% hook code. All logic lives in the Module Kit.

2. **Config-Driven Architecture (Config-First, Code-When-Needed)**: Everything that can be configuration MUST be configuration, not code. Module creation should primarily require: Defining flow steps (which Module Kit components in what order), Specifying database fields, Setting permissions. For complex business logic that cannot be expressed as configuration, use optional lifecycle hooks following the 90/10 rule (90% configuration, max 10% custom hook code).

3. **Module Kit Reusability**: Every Module Kit component must be: Self-contained and independently testable, Work with ANY module without modification, Handle its own validation, error messages, and UI, Support Arabic and English, Be configurable via parameters (label, field, validation rules, etc.).

4. **Test-First Development**: All Flow Blocks must have unit tests before implementation. All engine features must have integration tests. Red-Green-Refactor cycle enforced. Minimum 80% code coverage for engine code.

5. **Egyptian Business Context**: All validators must support Egyptian formats (national ID, phone numbers, tax IDs), Arabic name processing with compound name handling, Egyptian governorates as seed data, Currency defaults to EGP, Timezone defaults to Africa/Cairo, Calendar support for both Gregorian and Hijri.

6. **Security & Privacy**: No sensitive data in logs. All user actions audited. Session management via Redis. Maintenance mode for safe deployments. Input sanitization on all user inputs.

7. **Simplicity Over Cleverness**: Start simple, add complexity only when proven necessary. YAGNI principle strictly enforced. No premature optimization. Clear naming conventions (Arabic-friendly). Every file has a single clear purpose.

8. **Monorepo Structure**: The project uses a monorepo with clear package separation: packages/core — Platform Core (Layer 1), packages/module-kit — Module Kit (Layer 2), packages/validators — Egyptian validation library, packages/ai-assistant — AI Operational Assistant with RAG (Phase 4), modules/ — All modules (config files only).

## Project Structure

### Documentation (this feature)

```text
specs/001-platform-core/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── contracts/           # Phase 1 output (/speckit.plan command)
    ├── api.yaml         # Bot webhook API contracts
    └── internal.yaml    # Internal service contracts
```

### Source Code (repository root)

```text
# Monorepo structure for Platform Core
packages/
├── core/
│   ├── src/
│   │   ├── main.ts         # Application entry point
│   │   ├── bot/
│   │   │   ├── index.ts    # Bot setup and configuration
│   │   │   ├── middlewares/ # RBAC, maintenance, session middleware
│   │   │   ├── handlers/   # Command handlers (/start, /sections, etc.)
│   │   │   └── menus/      # Menu generation logic
│   │   ├── services/
│   │   │   ├── auth.ts     # Authentication service
│   │   │   ├── rbac.ts     # Role-based access control
│   │   │   ├── sections.ts # Section management
│   │   │   ├── modules.ts  # Module discovery and loading
│   │   │   ├── notifications.ts # BullMQ notification service
│   │   │   └── audit.ts    # Audit logging service
│   │   ├── database/
│   │   │   ├── prisma.ts   # Prisma client singleton
│   │   │   └── migrations/ # Database migrations
│   │   ├── cache/
│   │   │   └── redis.ts    # ioredis client singleton
│   │   ├── types/
│   │   │   ├── user.ts     # User-related types
│   │   │   ├── section.ts  # Section-related types
│   │   │   ├── module.ts   # Module-related types
│   │   │   └── common.ts  # Shared types
│   │   └── utils/
│   │       ├── logger.ts   # Pino logger setup
│   │       └── errors.ts   # Custom error classes
│   ├── tests/
│   │   ├── unit/           # Unit tests
│   │   │   ├── rbac.test.ts
│   │   │   ├── session.test.ts
│   │   │   ├── modules.test.ts
│   │   │   └── audit.test.ts
│   │   ├── integration/    # Integration tests
│   │   │   ├── user-flow.test.ts
│   │   │   ├── join-request.test.ts
│   │   │   └── sections.test.ts
│   │   └── e2e/           # End-to-end tests
│   └── package.json        # Package dependencies and scripts
├── validators/             # Egyptian format validators (packages/validators/)
# Infrastructure
├── docker-compose.yml # PostgreSQL + Redis + Bot services
├── prisma/
│   └── schema.prisma  # Database schema (shared across packages)
└── modules/           # Empty directory for future modules
```

**Structure Decision**: Monorepo with `packages/core/` as the Platform Core package and `packages/validators/` for Egyptian format validators. Note: the tree above shows `validators/` as a shorthand — the actual path is `packages/validators/`. All source code follows the specified architecture with clear separation of concerns.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [No violations - all constitutional principles are satisfied] | [N/A] | [N/A] |

## Phase 0: Research & Technical Decisions

### Research Findings

**1. Tech Stack Validation**
- **Decision**: Use grammY 1.x with Hono webhook server
- **Rationale**: grammY is the most mature Telegram bot framework for TypeScript. Hono provides lightweight HTTP server for webhook handling.
- **Alternatives**: Telegraf (more complex), BotKit (less maintainable)

**2. Database Design**
- **Decision**: PostgreSQL with Prisma ORM
- **Rationale**: Strong typing, migrations, and excellent TypeScript support. Required for audit trail and user management.
- **Alternatives**: MongoDB (weaker typing), SQLite (not suitable for production)

**3. Session Management**
- **Decision**: Redis with grammY session storage adapter
- **Rationale**: Fast session access, 24-hour TTL support, required for bot state persistence.
- **Alternatives**: In-memory (lost on restart), Database (slower performance)

**4. RBAC Implementation**
- **Decision**: Role-based access with AdminScope table for section/module permissions
- **Rationale**: Fine-grained access control required for admin scoping in Egyptian business context.
- **Alternatives**: Simple role-only (insufficient for scoped admin access)

**5. Module Discovery**
- **Decision**: Runtime scanning of modules/ directory with config validation
- **Rationale**: Dynamic module loading required for platform extensibility without code changes.
- **Alternatives**: Hardcoded modules (violates config-driven principle)

**6. Error Handling**
- **Decision**: Global error middleware with Arabic error messages
- **Rationale**: User experience requires Arabic error messages. Graceful error handling prevents bot crashes.
- **Alternatives**: English-only errors (poor user experience)

## Phase 1: Data Model & Contracts

### Database Schema (`data-model.md`)

#### Core Tables

<!-- Source of truth for all entity definitions is spec.md > Key Entities. This section is for implementation reference only. If conflict exists, spec.md takes precedence. -->

**User** - Telegram bot users
- `telegramId` BIGINT PRIMARY KEY (Telegram user ID — no separate auto-generated id)
- `fullName` VARCHAR(100) NOT NULL
- `nickname` VARCHAR(100) NULL (optional field — auto-generated if empty)
- `phone` VARCHAR(20) UNIQUE (Egyptian format)
- `nationalId` VARCHAR(14) UNIQUE (Egyptian format — one real-world identity per account)
- `telegramUsername` VARCHAR(100)
- `role` ENUM('SUPER_ADMIN', 'ADMIN', 'EMPLOYEE', 'VISITOR') DEFAULT 'VISITOR'
- `isActive` BOOLEAN DEFAULT true
- `lastActiveAt` TIMESTAMP
- `language` VARCHAR(2) DEFAULT 'ar' (user language preference — 'ar' or 'en'; persists across sessions independently of Redis TTL)
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**JoinRequest** - Pending user registrations
- `id` STRING PRIMARY KEY (cuid)
- `telegramId` BIGINT NOT NULL (not unique — rejected users can re-apply with new row)
- `fullName` VARCHAR(100) NOT NULL
- `nickname` VARCHAR(100) NULL (optional field — auto-generated if empty)
- `phone` VARCHAR(20) NOT NULL (Egyptian format)
- `nationalId` VARCHAR(14) NOT NULL (Egyptian format)
- `status` ENUM('PENDING', 'APPROVED', 'REJECTED') DEFAULT 'PENDING'
- `reviewedBy` BIGINT REFERENCES User(telegramId)
- `reviewedAt` TIMESTAMP
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Section** - Dynamic departments/containers with two-level hierarchy support
- `id` STRING PRIMARY KEY (cuid)
- `name` VARCHAR(100) NOT NULL (Arabic)
- `nameEn` VARCHAR(100) NOT NULL (English)
- `icon` VARCHAR(10) NOT NULL (emoji)
- `parentId` STRING REFERENCES Section(id) NULL (self-referential FK — nullable for main sections; when set, defines sub-section)
- `isActive` BOOLEAN DEFAULT true
- `orderIndex` INTEGER DEFAULT 0
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `createdBy` BIGINT REFERENCES User(telegramId)
- **Relations**:
  - `parent`: Optional reference to parent Section (main section only, where parentId is NULL)
  - `children`: List of sub-sections (sections where parentId references this section's id)
- **Constraint**: Maximum 2 levels enforced — if parentId is set, the referenced section MUST have parentId = NULL (main section cannot have children)

**Module** - Discovered module configurations
- `id` STRING PRIMARY KEY (cuid)
- `name` VARCHAR(100) NOT NULL
- `nameEn` VARCHAR(100) NOT NULL
- `sectionId` STRING REFERENCES Section(id)
- `icon` VARCHAR(10) NOT NULL
- `isActive` BOOLEAN DEFAULT true
- `orderIndex` INTEGER DEFAULT 0
- `configPath` VARCHAR(255) NOT NULL (relative path to module.config.ts)
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**AuditLog** - System audit trail
- `id` STRING PRIMARY KEY (cuid)
- `userId` BIGINT REFERENCES User(telegramId)
- `action` VARCHAR(50) NOT NULL (action type)
- `targetType` VARCHAR(50) (e.g., 'User', 'Section', 'Module')
- `targetId` STRING (target identifier — stores cuid for Section/Module/JoinRequest, or BigInt cast to string for User telegramId)
- `details` JSONB (additional context)
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**Notification** - Queue notifications (i18n-compliant: type maps to .ftl key pattern)
- `id` STRING PRIMARY KEY (cuid)
- `targetUserId` BIGINT REFERENCES User(telegramId)
- `type` ENUM('JOIN_REQUEST_NEW', 'JOIN_REQUEST_APPROVED', 'JOIN_REQUEST_REJECTED', 'USER_DEACTIVATED', 'MAINTENANCE_ON', 'MAINTENANCE_OFF') NOT NULL
- `params` JSONB (i18n template parameters, e.g. { "userName": "...", "requestCode": "..." })
- `isRead` BOOLEAN DEFAULT false
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP

**AdminScope** - Admin permissions (section-level or module-level scoping)
- `id` STRING PRIMARY KEY (cuid)
- `userId` BIGINT REFERENCES User(telegramId)
- `sectionId` STRING REFERENCES Section(id) ON DELETE CASCADE (FR-037: when section is deleted, its AdminScope records are automatically removed, and user loses access to all descendant sub-sections and modules)
- `moduleId` STRING REFERENCES Module(id) (nullable — when null, grants access to entire section; when set, grants access to specific module only)
- `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
- `createdBy` BIGINT REFERENCES User(telegramId) (the Super Admin who assigned the scope)

### API Contracts

#### Internal Service Contracts (`contracts/internal.yaml`)

**Session Service**
```yaml
paths:
  /session/{telegramId}:
    get:
      summary: Get user session
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  role: string
                  currentMenu: array    # navigation breadcrumb stack
                  telegramId: bigint
                  locale: string        # ar/en
    put:
      summary: Update user session
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                currentMenu: array
                locale: string
```

**RBAC Service**
```yaml
paths:
  /rbac/can-access:
    post:
      summary: Check user permissions
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                userId: bigint    # telegramId (BigInt PK)
                sectionId: string
                moduleId: string
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  canAccess: boolean
```

**Notification Queue**
```yaml
paths:
  /notifications/queue:
    post:
      summary: Add notification to queue
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                targetUserId: bigint    # telegramId (BigInt PK)
                type: string
                params: object    # i18n template parameters (JSONB)
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  queueId: string
```

**Module Registry**
```yaml
paths:
  /modules/register:
    post:
      summary: Register a discovered module
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                sectionId: string
                name: string
                nameEn: string
                icon: string
                configPath: string
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  moduleId: string
  /modules/unregister:
    post:
      summary: Unregister a module
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                moduleId: string
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  success: boolean
  /modules/by-section/{sectionId}:
    get:
      summary: Get active modules for a section
      responses:
        200:
          content:
            application/json:
              schema:
                type: array
                items:
                  type: object
                  properties:
                    moduleId: string
                    name: string
                    nameEn: string
                    icon: string
                    isActive: boolean
```

## Phase 2: Quick Start & Validation

### Quick Start (`quickstart.md`)

```markdown
# Platform Core Quick Start

## Prerequisites
- Node.js ≥20
- Docker & Docker Compose
- PostgreSQL 16 (via Docker)
- Redis 7 (via Docker)

## Setup Instructions

### 1. Clone & Install
```bash
git checkout 001-platform-core
cd packages/core
npm install
```

### 2. Environment Configuration
```bash
cp .env.example .env
# Edit .env with your bot token and database credentials
```

### 3. Database Setup
```bash
# Start services
docker-compose up -d postgres redis

# Run migrations
npx prisma migrate dev

# Generate Prisma client
npx prisma generate
```

### 4. Development Mode
```bash
# Start in development mode
npm run dev

# Bot will be available at webhook URL
# Ensure INITIAL_SUPER_ADMIN_ID is set in .env
# Send /start from that Telegram ID's account to begin bootstrap process
```

### 5. Testing
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage
```

## Key Commands
- `/start` - Bootstrap new user or show menu
- `/sections` - View/manage sections (Super Admin only)
- `/maintenance on|off` - Toggle maintenance mode (Super Admin only)
- `/audit` - View recent audit logs (Super Admin only)
- `/settings` - Bot settings: language, notifications, system info, backup (Super Admin only)
```

## Phase 9: Integration & Polish

**Purpose**: End-to-end testing, final verification, and production readiness

### Phase Gate - Zero-Defect Gate (NON-NEGOTIABLE)

**CRITICAL BLOCKING REQUIREMENT**: Before Phase 9 can be considered complete, the following conditions MUST be met:

1. **100% Test Coverage**: All unit tests, integration tests, and end-to-end tests MUST pass with zero failures
2. **Zero Spec Issues**: `/speckit.analyze` MUST return zero issues (CRITICAL, HIGH, MEDIUM, LOW)
3. **Zero Lint Errors**: All TypeScript compilation and ESLint checks MUST pass without errors
4. **Spec Alignment**: All three artifacts (spec.md, plan.md, tasks.md) MUST be fully aligned with no contradictions
5. **Constitution Compliance**: All 10 constitutional principles MUST be verified as satisfied

**Enforcement**: Task T114 (Zero-Defect Gate verification) is MANDATORY and BLOCKING. No phase advancement, tagging, or production deployment is permitted until T114 passes with all criteria satisfied.

### Verification Activities
- Load testing with ~200 concurrent users (NFR-002/005 verification)
- Redis fallback behavior testing (NFR-003 verification)
- End-to-end user journey testing across all roles
- Manual verification of all success criteria (SC-001 through SC-010)
- Platform-First Gate verification (no modules in `modules/` directory)
- Code coverage verification (minimum 80% across all packages)

### Agent Context Update

Technical decisions incorporated: grammY 1.x webhook mode via Hono, Redis session adapter, RBAC with AdminScope, runtime module discovery. Constitution version: 2.0.0.

## Constitution Re-check

*GATE: Must pass after Phase 1 design. ERROR if violations exist.*

### Verified Principles
✅ **Platform-First**: Core platform infrastructure will be complete before any modules
✅ **Config-Driven**: Module discovery system loads configuration with optional hooks (90/10 rule)
✅ **Egyptian Context**: All validators support Egyptian phone formats and Arabic UI
✅ **Security & Privacy**: Audit logging excludes sensitive data, Redis sessions secure
✅ **i18n-Only User Text**: All user-facing text via .ftl locale files, no hardcoded strings in source
✅ **Monorepo Structure**: Clear package separation in packages/core/
✅ **Zero-Defect Gate**: /speckit.analyze must pass with zero issues before implementation proceeds

## Post-Plan Additions (Tasks added after initial plan)

> These tasks were identified during implementation and added to `tasks.md` after the initial plan was created.

| Task | Phase | Description | Reason Added |
|------|-------|-------------|--------------|
| T083 | 2 | Create input validation and sanitization utilities in `packages/validators/src/` | FR-033 coverage gap discovered during Phase 2 |
| T084 | 4 | Implement AdminScope authorization logic in `canAccess()` | FR-029 required explicit AdminScope handling beyond basic RBAC |
| T085 | 6 | Implement `unregisterModule()` API function | FR-030 explicitly requires this function alongside registerModule() |
| T086 | 7 | Implement Redis pub/sub for maintenance mode propagation | NFR-002 requires 5-second propagation across all instances |
| T087 | 10 | Implement Redis fallback to in-memory sessions | Edge case defined in spec (Redis unavailability fallback) |

---

## Next Steps

After plan approval:
1. Use `/speckit.tasks` to generate detailed task list
2. Use `/speckit.implement` to execute the implementation plan
3. Use `/speckit.checklist` to create quality assurance checklist
