# Tasks: Platform Core (Layer 1)

**Input**: Design documents from `/specs/001-platform-core/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md (required)

**Organization**: Tasks are organized by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Project Scaffolding (foundational)

**Purpose**: Initialize monorepo structure and foundational project setup

**⚠️ BLOCKING**: No other work can begin until this phase is complete

### Project Initialization

- [x] T001 [P] Create root package.json with Node.js ≥20, TypeScript 5.x, and essential scripts
- [x] T002 [P] Create root tsconfig.json with strict mode configuration
- [x] T003 [P] Create root .gitignore, .eslintrc, and .prettierrc configuration files
- [x] T004 [P] Initialize packages/core/ with its own package.json and tsconfig

### Docker Configuration

- [x] T005 [P] Create docker-compose.yml with PostgreSQL 16 + Redis 7 services
- [x] T006 [P] Create .env.example with Zod validation schema for environment variables

### Database Setup

- [x] T007 [P] Setup Prisma with initial schema (all 7 tables from data-model.md)
- [x] T008 [P] Create prisma/schema.prisma with complete database schema
- [x] T009 [P] Create database migrations directory structure
- [x] T010 [P] Run first migration to create database tables
- [x] T011 [P] Generate Prisma client for TypeScript types

### Testing Infrastructure

- [x] T012 [P] Setup Vitest configuration with TypeScript support
- [x] T013 [P] Create tests/ directory structure (unit/, integration/, e2e/)

### Core Infrastructure

- [x] T014 [P] Setup Pino logger with Arabic-friendly formatting
- [x] T015 [P] Create root package.json scripts for development, testing, and deployment

**Checkpoint**: Project scaffolding complete - all foundational infrastructure in place

---

## Phase 2: Bot Foundation (foundational)

**Purpose**: Initialize bot framework and core infrastructure services

**⚠️ BLOCKING**: User story development cannot begin until this phase is complete

### Core Bot Setup

- [x] T016 Initialize grammY bot with Hono webhook server in `packages/core/src/`
- [x] T017 Create Redis connection (ioredis singleton) in `packages/core/src/cache/`
- [x] T018 Create Prisma client singleton in `packages/core/src/database/`
- [x] T019 Create grammY session storage adapter using Redis. Depends on T017 (Redis).
- [x] T020 Create error handling middleware (catches errors, sends Arabic message). Depends on T014 (Logger).
- [ ] T083 [P] Create input validation and sanitization utilities in `packages/validators/src/` (Zod schemas, XSS sanitization)

### Internationalization & Utilities

- [x] T021 Create i18n setup with Arabic .ftl files (basic messages: welcome, error, loading, etc.)
- [x] T082 [P] Create English .ftl locale files for all user-facing messages in `packages/core/src/locales/en/`
- [x] T076 Create graceful shutdown handler in `packages/core/src/utils/shutdown.ts`
- [x] T077 Create health check endpoints in `packages/core/src/server/health.ts` via Hono

### Notification Infrastructure (Prerequisite for US2)

- [ ] T053 [P] Setup BullMQ with Redis connection in `packages/core/src/services/queue.ts`
- [ ] T054 [P] Create notification service (queue-based message sending) in `packages/core/src/services/notifications.ts`
- [ ] T055 [P] Define notification types enum (SYSTEM, JOIN_REQUEST, etc.) in `packages/core/src/types/notification.ts`
- [ ] T057 [P] Create notification delivery worker in `packages/core/src/workers/notification.ts`

**Checkpoint**: Bot foundation complete - core infrastructure services ready

---

## Phase 3: User & Auth System (US1)

**Purpose**: User authentication, registration, and initial bot experience (Priority P1)

### Bootstrap System

- [x] T022-A [US1] Update prisma/schema.prisma logic for User and JoinRequest based on the new spec (FR-014, FR-035)
- [x] T022 [US1] Create /start command handler with user lookup logic in `packages/core/src/bot/handlers/start.ts`
- [x] T022-B [US1] Implement FR-014 Bootstrap Lock security logic inside `joinRequestService.createOrBootstrap()` (check 0 admins + env var)
- [x] T023 [US1] Implement .env-based Super Admin bootstrap logic using `INITIAL_SUPER_ADMIN_ID`
- [x] T023-B [US1] Bootstrap logic moved to `joinRequestService.createOrBootstrap()` — no separate bootstrap conversation needed. Unified join conversation handles both bootstrap and regular join request cases.
- [x] T024 [US1] Create welcome message handler for existing users

**Checkpoint**: User & Auth system complete - user registration flow functional

---

## Phase 4: Join Request Flow (US2)

**Purpose**: New user onboarding and admin approval (Priority P2)

### Join Request Implementation

- [x] T025 [US2] Create join request conversation flow in `packages/core/src/bot/conversations/join.ts` (Full Name, Phone, National ID)
- [x] T025-B [US2] Verify National ID extraction and validation (FR-035) and Phone validation (FR-034) with unit tests
- [x] T026 [US2] Save join request to database with PENDING status using `joinRequestService` in `packages/core/src/services/join-requests.ts`
- [ ] T027 [US2] Trigger notification to Super Admins about new join request (uses Notification Service)
- [x] T028 [US2] Implement "pending approval" response logic for returning visitors in `packages/core/src/bot/handlers/start.ts`
- [ ] T058 [US2] Write integration test for full join request flow (Start -> Submit -> DB -> Notify)
- [ ] T066-B [P] [US5] Implement audit logging for session events (USER_LOGIN = new session after 24h expiry, USER_LOGOUT = session expiry) in audit service

**Checkpoint**: Join request system complete - users can apply to join

---

## Phase 5: RBAC & User Management (US1/US2)

**Purpose**: Role-based access control and user management (Priority P2)

### Core RBAC Infrastructure

- [ ] T029 [P] Create RBAC middleware in `packages/core/src/bot/middlewares/rbac.ts`
- [ ] T030 [P] Implement `canAccess(userId, sectionId?, moduleId?)` in `packages/core/src/services/rbac.ts` with Redis caching
- [ ] T084 [P] Implement AdminScope authorization logic in `canAccess()` (FR-017, FR-029)
- [ ] T031 [P] Create AdminScope service (assign/revoke permissions) in `packages/core/src/services/admin-scope.ts`
- [ ] T034 [P] Write unit tests for RBAC middleware and canAccess function

### User Management Handlers

- [ ] T032 [US1] Create user management handlers (List, Change Role, Activate/Deactivate) in `packages/core/src/bot/handlers/users.ts`
- [ ] T033 [US2] Create join request approval/rejection handlers in `packages/core/src/bot/handlers/approvals.ts`

**Checkpoint**: RBAC system complete - permission management functional

---

## Phase 6: Section & Module Management (US3)

**Purpose**: Dynamic section and module organization (Priority P3)

### Section Management

- [ ] T035 [P] [US3] Create section CRUD service in `packages/core/src/services/sections.ts`
- [ ] T036 [P] [US3] Create section management handlers for Super Admin in `packages/core/src/bot/handlers/sections.ts`
- [ ] T037 [P] [US3] Create section menu display (list active sections) in `packages/core/src/bot/menus/sections.ts`
- [ ] T038 [P] [US3] Create "empty section" message logic
- [ ] T039 [P] [US3] Create section enable/disable toggle handler
- [ ] T040 [P] Write integration tests for section CRUD

### Module Discovery & Loading

- [ ] T041 [P] Define ModuleConfig type in `packages/core/src/types/module.ts`
- [ ] T042 [P] Create module discovery service in `packages/core/src/services/modules.ts` (scans `modules/`)
- [ ] T043 [P] Implement module registry (Map<string, ModuleConfig>)
- [ ] T044 [P] Implement module validation (skip invalid configs with warning)
- [ ] T045 [P] Create `registerModule()` and `getModulesBySection()` APIs
- [ ] T085 [P] Implement `unregisterModule()` API function
- [ ] T046 [P] Create module list display within sections
- [ ] T047 [P] Write unit tests for module loader

**Checkpoint**: Section & Module system complete - dynamic structure functional

---

## Phase 7: Maintenance Mode (US4)

**Purpose**: System maintenance control (Priority P3)

### Maintenance Implementation

- [ ] T048 [P] [US4] Create maintenance mode middleware in `packages/core/src/bot/middlewares/maintenance.ts`
- [ ] T049 [P] [US4] Create maintenance toggle command (Super Admin only)
- [ ] T050 [P] [US4] Create Arabic maintenance message for blocked users
- [ ] T051 [P] Store maintenance status in Redis
- [ ] T086 [P] Implement Redis pub/sub for maintenance mode propagation (NFR-002)
- [ ] T052 [P] Write unit test for maintenance middleware

**Checkpoint**: Maintenance mode complete - system control functional

---

## Phase 8: Audit & Session Management (US5)

**Purpose**: Comprehensive audit trail and session persistence (Priority P2)

### Audit Infrastructure

- [ ] T059 [P] [US5] Create audit log service in `packages/core/src/services/audit.ts`
- [ ] T060 [P] [US5] Create audit middleware (auto-logs actions) in `packages/core/src/bot/middlewares/audit.ts`
- [ ] T061 [P] [US5] Define and implement auditable actions list (FR-026)
- [ ] T062 [P] [US5] Create audit log viewer for Super Admin in `packages/core/src/bot/handlers/audit.ts`
- [ ] T063 [P] [US5] Ensure NO sensitive data is logged (filter/sanitize)
- [ ] T064 [P] Write unit tests for audit service

### Session Management

- [ ] T065 [P] [US5] Create Redis session service with 24-hour TTL
- [ ] T087 [P] [US5] Implement Redis fallback to in-memory sessions (edge case handling)
- [ ] T066 [P] [US5] Create session middleware (load/save) in `packages/core/src/bot/middlewares/session.ts`
- [ ] T067 [P] [US5] Store navigation state (currentSection, currentModule)
- [ ] T068 [P] [US5] Handle session expiry gracefully
- [ ] T069 [P] Write unit tests for session service

**Checkpoint**: Audit & Session system complete

---

## Phase 9: Integration & Polish

**Purpose**: End-to-end testing and final cleanup

### Final Verification

- [ ] T056 [P] Implement notification history storage in `packages/core/src/services/notifications.ts`
- [ ] T081 [P] Create notification cleanup cron job (90 days retention)
- [ ] T070 [US1] End-to-end test: complete user journey (Bootstrap -> Join -> Approve -> Menu)
- [ ] T071 [US3] End-to-end test: Super Admin journey (Sections -> Modules -> Users)
- [ ] T072 Verify 80% code coverage across all packages
- [ ] T073 Code cleanup, formatting, and final linting
- [ ] T074 Update quickstart.md with actual commands and verification steps
- [ ] T075 Final commit and tag v0.1.0
- [ ] T078 Verify SC-002: Load test with ~200 concurrent simulated users
- [ ] T079 Verify FR-015: Confirm all 4 roles display correct menus
- [ ] T080 Verify SC-003: Confirm audit logs capture 100% of defined actions

**Checkpoint**: Platform Core complete - ready for production deployment
