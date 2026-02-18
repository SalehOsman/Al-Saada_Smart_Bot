# Tasks: Platform Core (Layer 1)

**Input**: Design documents from `/specs/001-platform-core/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md (required), research.md (optional)

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/`, `tests/` at repository root
- Web app: `backend/src/`, `frontend/src/`
- Mobile: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

---

## Phase 1: Project Scaffolding (must be first — everything depends on this)

**Purpose**: Initialize monorepo structure and foundational project setup

**⚠️ BLOCKING**: No other work can begin until this phase is complete

### Project Initialization

- [X] T001 [P] Create root package.json with Node.js ≥20, TypeScript 5.x, and essential scripts
- [X] T002 [P] Create root tsconfig.json with strict mode configuration
- [X] T003 [P] Create root .gitignore, .eslintrc, and .prettierrc configuration files
- [X] T004 [P] Initialize packages/core/ with its own package.json and tsconfig

### Docker Configuration

- [X] T005 [P] Create docker-compose.yml with PostgreSQL 16 + Redis 7 services
- [X] T006 [P] Create .env.example with Zod validation schema for environment variables

### Database Setup

- [X] T007 [P] Setup Prisma with initial schema (all 7 tables from data-model.md)
- [X] T008 [P] Create prisma/schema.prisma with complete database schema
- [X] T009 [P] Create database migrations directory structure
- [X] T010 [P] Run first migration to create database tables
- [X] T011 [P] Generate Prisma client for TypeScript types

### Testing Infrastructure

- [X] T012 [P] Setup Vitest configuration with TypeScript support
- [X] T013 [P] Create tests/ directory structure (unit/, integration/, e2e/)

### Core Infrastructure

- [X] T014 [P] Setup Pino logger with Arabic-friendly formatting
- [X] T015 [P] Create root package.json scripts for development, testing, and deployment

**Checkpoint**: Project scaffolding complete - all foundational infrastructure in place

---

## Phase 2: Bot Foundation (depends on Group 1)

**Purpose**: Initialize bot framework and core infrastructure services

**⚠️ BLOCKING**: User story development cannot begin until this phase is complete

### Core Bot Setup

- [X] T016 Initialize grammY bot with Hono webhook server in packages/core/src/
- [X] T017 Create Redis connection (ioredis singleton) in packages/core/src/cache/
- [X] T018 Create Prisma client singleton in packages/core/src/database/
- [X] T019 Create grammY session storage adapter using Redis. Depends on T017 (Redis) and T021 (i18n setup).
- [X] T020 Create error handling middleware (catches errors, sends Arabic message). Depends on T014 (Logger).
- [ ] T083 [P] Create input validation and sanitization utilities in `packages/validators/src/`.

### Internationalization

- [X] T021 Create i18n setup with Arabic .ftl files (basic messages: welcome, error, loading, etc.)
- [X] T082 [P] Create English .ftl locale files for all user-facing messages (mirrors Arabic .ftl files) in packages/core/src/locales/en/
- [X] T076 Create graceful shutdown handler in packages/core/src/utils/shutdown.ts - Handle SIGTERM/SIGINT, close Prisma, disconnect Redis, stop bot. Done when: Bot shuts down cleanly without orphaned connections.
- [X] T077 Create health check endpoints in packages/core/src/server/health.ts via Hono - GET /health returns {status: ok, db: connected, redis: connected}. Done when: Health endpoint responds with service status.

**Checkpoint**: Bot foundation complete - core infrastructure services ready

---

## Phase 3: User & Auth System (depends on Phase 2)

**Purpose**: User authentication, registration, and initial bot experience

### Bootstrap System

- [ ] T022 [US1] Create /start command handler with user lookup logic in packages/core/src/handlers/
- [ ] T023 [US1] Implement first-user-becomes-Super-Admin bootstrap logic
- [ ] T024 [US1] Create welcome message handler for existing users

### Join Request Flow

- [ ] T025 [US2] Create join request conversation flow (name + phone input with Egyptian validation)
- [ ] T026 [US2] Save join request to database with PENDING status
- [ ] T027 [P] [US2] Create notification to admins about new join request
- [ ] T028 [US2] Create "pending approval" response for returning visitors

**Checkpoint**: User & Auth system complete - user registration flow functional

---

## Phase 4: RBAC System (depends on Phase 3)

**Purpose**: Role-based access control and user management

### Core RBAC Infrastructure

- [ ] T029 [P] Create RBAC middleware (checks role on every update)
- [ ] T030 [P] Implement canAccess(userId, sectionId?, moduleId?) function in packages/core/src/services/
- [ ] T084 [P] Implement AdminScope authorization logic in canAccess()
- [ ] T031 [P] Create AdminScope service (assign/revoke admin permissions)

### User Management

- [ ] T032 [US1] Create user management handlers (Super Admin: list users, change role, activate/deactivate)
- [ ] T033 [US2] Create join request approval/rejection flow (Admin/Super Admin)

### Unit Tests

- [ ] T034 [P] Write unit tests for RBAC middleware and canAccess function, covering roles, AdminScope, and caching.

**Checkpoint**: RBAC system complete - permission management functional

---

## Phase 5: Section Management (depends on Phase 4)

**Purpose**: Dynamic section creation and management system

### Section CRUD Operations

- [ ] T035 [P] [US3] Create section CRUD service (create, read, update, delete, reorder) in packages/core/src/services/
- [ ] T036 [P] [US3] Create section management handlers for Super Admin
- [ ] T037 [P] [US3] Create section menu display (list active sections as buttons)

### Section Features

- [ ] T038 [P] [US3] Create "empty section" message when no modules exist
- [ ] T039 [P] [US3] Create section enable/disable toggle
- [ ] T040 [P] Write integration tests for section CRUD

**Checkpoint**: Section management complete - dynamic sections functional

---

## Phase 6: Module Loader (depends on Phase 5)

**Purpose**: Dynamic module discovery and loading system

### Module Discovery

- [ ] T041 [P] Create ModuleConfig TypeScript type/interface in packages/core/src/types/. Based on ModuleConfig definition added to spec.md.
- [ ] T042 [P] Create module discovery service (scans modules/ directory)
- [ ] T043 [P] Create module registry (Map<string, ModuleConfig>)
- [ ] T044 [P] Create module validation (skip invalid configs with warning log)

### Module API

- [ ] T045 [P] Create registerModule() and getModulesBySection() API in packages/core/src/services/
- [ ] T085 [P] Implement unregisterModule() API function.
- [ ] T046 [P] Create module list display within sections
- [ ] T047 [P] Write unit tests for module loader

**Checkpoint**: Module loader complete - dynamic module discovery functional

---

## Phase 7: Maintenance Mode (depends on Phase 2)

**Purpose**: System maintenance control and user experience

### Maintenance Infrastructure

- [ ] T048 [P] [US4] Create maintenance mode middleware (checks Redis flag)
- [ ] T049 [P] [US4] Create maintenance toggle command (Super Admin only)
- [ ] T050 [P] [US4] Create Arabic maintenance message for blocked users
- [ ] T051 [P] Store maintenance status in Redis
- [ ] T086 [P] Implement Redis pub/sub for maintenance mode propagation.
- [ ] T052 [P] Write unit test for maintenance middleware

**Checkpoint**: Maintenance mode complete - system control functional

---

## Phase 8: Notification System (depends on Phase 2)

**Purpose**: Queue-based notification delivery system

### Queue Infrastructure

- [ ] T053 [P] Setup BullMQ with Redis connection in packages/core/src/
- [ ] T054 [P] Create notification service (queue-based message sending)
- [ ] T055 [P] Create notification types enum (SYSTEM, JOIN_REQUEST, APPROVAL, REJECTION, ANNOUNCEMENT)
- [ ] T056 [P] Create notification history storage in database
- [ ] T057 [P] Create notification delivery worker
- [ ] T058 [P] Write integration test for notification flow
- [ ] T081 [P] Create notification cleanup cron job in packages/core/src/services/notification-cleanup.ts - Runs daily, deletes notifications older than 90 days. Done when: Old notifications are purged automatically.

**Checkpoint**: Notification system complete - queue-based messaging functional

---

## Phase 9: Audit Logging (depends on Phase 2)

**Purpose**: Comprehensive system audit trail

### Audit Infrastructure

- [ ] T059 [P] Create audit log service in packages/core/src/services/
- [ ] T060 [P] Create audit middleware (auto-logs significant actions)
- [ ] T061 [P] Define auditable actions list to match FR-026.
- [ ] T062 [P] Create audit log viewer for Super Admin (recent logs via bot command)
- [ ] T063 [P] Ensure NO sensitive data is logged
- [ ] T064 [P] Write unit tests for audit service

**Checkpoint**: Audit logging complete - comprehensive tracking functional

---

## Phase 10: Session Management (depends on Phase 2)

**Purpose**: User session persistence and navigation state

### Session Infrastructure

- [ ] T065 [P] Create Redis session service with 24-hour TTL in packages/core/src/services/
- [ ] T087 [P] Implement Redis fallback to in-memory sessions.
- [ ] T066 [P] Create session middleware (load/save on every message)
- [ ] T067 [P] Store navigation state (currentSection, currentModule, currentStep)
- [ ] T068 [P] Handle session expiry gracefully
- [ ] T069 [P] Write unit tests for session service

**Checkpoint**: Session management complete - navigation persistence functional

---

## Phase 11: Integration & Polish (depends on all above)

**Purpose**: End-to-end testing and final polish

### End-to-End Testing

- [ ] T070 [US1] End-to-end test: complete user journey (new user → join request → approval → employee menu)
- [ ] T071 [US3] End-to-end test: Super Admin journey (bootstrap → create section → manage users)
- [ ] T072 Verify 80% code coverage
- [ ] T073 Code cleanup and final linting
- [ ] T074 Update quickstart.md with actual commands
- [ ] T075 Final commit and tag v0.1.0
- [ ] T078 Verify SC-002: Load test with ~200 concurrent simulated users, response time <500ms p95
- [ ] T079 Verify SC-005: Confirm all 4 roles display correct menus and access levels
- [ ] T080 Verify SC-008: Confirm audit logs capture 100% of defined auditable actions

**Checkpoint**: Platform Core complete - ready for production deployment

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1**: No dependencies - can start immediately
- **Phase 2**: Depends on Phase 1 completion - BLOCKS all bot functionality
- **Phase 3**: Depends on Phase 2 completion
- **Phase 4**: Depends on Phase 3 completion
- **Phase 5**: Depends on Phase 4 completion
- **Phase 6**: Depends on Phase 5 completion
- **Phase 7-10**: Depend on Phase 2 completion - Can run in parallel with user stories
- **Phase 11**: Depends on all above phases being complete

### Constitutional Constraints

- **Platform-First**: Phase 1-2 MUST be 100% complete before any user story work
- **Config-Driven**: Module discovery system loads configuration only (no business logic)
- **Test-First**: All services must have unit tests before implementation
- **Egyptian Context**: All validators MUST support Egyptian formats and Arabic UI
- **Security**: Audit logging excludes sensitive data, Redis sessions secure

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel
- All Phase 2 tasks marked [P] can run in parallel
- All Phase 7, 8, 9, 10 tasks can run in parallel with each other

---

## Implementation Strategy

### Constitutional Compliance Strategy

1. **Platform-First**: Phase 1-2 (Infrastructure) MUST be complete before any user stories
2. **RBAC System**: Complete permission system before implementing user-facing features
3. **Config-Driven**: Module discovery system loads configuration only
4. **Test Coverage**: Maintain 80% code coverage for all core services
5. **Egyptian Context**: All components support Arabic and Egyptian formats

### Incremental Delivery (Aligned with User Stories)

1. **MVP**: Phase 1-2-3 → Core user registration and authentication
2. **Extended**: Phase 4-5 → RBAC and section management
3. **Platform**: Phase 6-10 → Full platform infrastructure
4. **Final**: Phase 11 → Testing and polish

### Team Strategy

With multiple developers:

1. **Phase 1**: All developers collaborate on project scaffolding
2. **Phase 2**: Developers split between bot setup and infrastructure services
3. **Phase 3-6**: These phases are sequential. A developer can work on a phase once the previous one is complete.
4. **Phase 7-10**: Developers work independently on parallel infrastructure systems
5. **Phase 11**: All developers collaborate on testing and polish

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to verify story independently
- Tasks sized for 1-4 hour completion each
- Every task results in exactly ONE commit
- The modules/ directory should be created but left EMPTY
- All user-facing messages must be in Arabic
- All error messages must be user-friendly Arabic (never show raw errors)
