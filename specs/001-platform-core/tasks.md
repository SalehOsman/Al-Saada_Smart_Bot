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

- [x] T005 [P] Create docker-compose.yml with PostgreSQL 16 + Redis 7 services. Redis MUST be configured with persistence enabled: set `--appendonly yes` (AOF) in the Redis command, and mount a named volume `redis_data` to `/data`. This ensures system settings (e.g., `system:defaultLanguage`, `system:activeNotificationTypes`) survive container restarts (required by T105, T106).
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
- [x] T020 Create error handling middleware (catches errors, sends message via i18n key `errors-system-internal`). Depends on T014 (Logger).
- [ ] T083 [P] Create input validation and sanitization utilities in `packages/validators/src/` (Zod schemas, XSS sanitization, and explicit `egyptianPhoneNumber`, `egyptianNationalId` extraction functions)
- [ ] T110 [P] Create global input sanitization middleware in `packages/core/src/bot/middlewares/sanitize.ts` — strips/escapes HTML entities from all incoming text fields before handlers process them (FR-033). Register in grammY middleware chain.
- [ ] T112 [P] Create unsupported message type handler in `packages/core/src/bot/handlers/fallback.ts` — for stickers, voice messages, photos, documents, locations, and other non-text messages received outside an active conversation flow, reply via i18n key `errors-unsupported-message` guiding user to supported commands (spec Edge Case + FR-033)

### Internationalization & Utilities

- [x] T021 Create i18n setup with Arabic .ftl files (basic messages: welcome, error, loading, etc.)
- [x] T082 [P] Create English .ftl locale files for all user-facing messages in `packages/core/src/locales/en/`
- [x] T076 Create graceful shutdown handler in `packages/core/src/utils/shutdown.ts`
- [x] T077 Create health check endpoints in `packages/core/src/server/health.ts` via Hono

### Notification Infrastructure (Prerequisite for US2)

- [ ] T053 [P] Setup BullMQ with Redis connection in `packages/core/src/services/queue.ts`
- [ ] T054 [P] Create notification service (queue-based message sending) in `packages/core/src/services/notifications.ts`
- [ ] T055 [P] Define notification types in `packages/core/src/types/notification.ts`. Use the 6 types from the Prisma `NotificationType` enum: `JOIN_REQUEST_NEW`, `JOIN_REQUEST_APPROVED`, `JOIN_REQUEST_REJECTED`, `USER_DEACTIVATED`, `MAINTENANCE_ON`, `MAINTENANCE_OFF`. Each type maps to i18n params passed via `params` field (JSONB) — no title/body fields. Re-export `NotificationType` from `@prisma/client` for use across the codebase.
- [ ] T057 [P] Create notification delivery worker in `packages/core/src/workers/notification.ts`. Configure BullMQ rate limiter at max 30 messages per 1000ms to comply with Telegram API flood control limits (FR-024).

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
- [x] T024 [US1] Create welcome message handler for existing users — reply via i18n key `welcome-user` (for EMPLOYEE/VISITOR) or `welcome-admin` (for ADMIN/SUPER_ADMIN). No hardcoded strings (Constitution Principle VII).

**Checkpoint**: User & Auth system complete - user registration flow functional

---

## Phase 4: Join Request Flow (US2)

**Purpose**: New user onboarding and admin approval (Priority P2)

### Join Request Implementation

- [x] T025 [US2] Create join request conversation flow in `packages/core/src/bot/conversations/join.ts` (Full Name, Phone, National ID)
- [x] T025-B [US2] Verify National ID extraction and validation (FR-035) and Phone validation (FR-034) with unit tests
- [x] T026 [US2] Save join request to database with PENDING status using `joinRequestService` in `packages/core/src/services/join-requests.ts`
- [ ] T027 [US2] Trigger notification to Super Admins about new join request — call `notifyAdmins()` from `packages/core/src/bot/utils/formatters.ts` (T090) with type `JOIN_REQUEST_NEW` and params `{ userName, requestCode }`. Do NOT call the Notification Service directly; always use the shared utility (Constitution Principle VIII — Shared-First).
- [x] T028 [US2] Implement "pending approval" response logic for returning visitors in `packages/core/src/bot/handlers/start.ts`
- [ ] T058 [US2] Write integration tests for join request flow covering all US2 acceptance scenarios: (1) new user submits full flow (Start → name → phone → ID → confirm → PENDING saved → admins notified), (1a) returning PENDING user sends /start again → sees pending message via i18n key `join-request-status-pending` with submission date, (2) Super Admin approves/rejects → user notified, (3) approved user sends /start → sees EMPLOYEE menu (not pending message)
- [ ] T097 [P] [US2] Integration test: user with PENDING join request sends /start again → system shows message via i18n key `errors-join-request-already-pending` AND does NOT create a duplicate request in the database
- [ ] T066-B [P] [US5] Implement audit logging for session events in audit service:
  - USER_LOGIN: log when a user sends a message and no active session exists (new session created after 24h expiry) — detected lazily on the NEXT user interaction.
  - USER_LOGOUT: log at the same lazy detection point (session was expired) — do NOT use Redis Keyspace Notifications (not configured). Both events are inferred from session absence, not from a TTL expiry event.

# Note: Tasks T088-T091 are NOT duplicates — each adds a distinct shared utility required for Phase 5 RBAC flows: T088=conversation utils, T089=user input collectors, T090=formatters, T091=refactor join.ts to use them.

- [x] T088 [US2] Extract shared conversation utilities into `packages/core/src/bot/utils/conversation.ts`
      (createMessageTracker, trackMessage, deleteTrackedMessages, waitForTextOrCancel, waitForSkippable, waitForConfirm, sendCancelled)
- [x] T089 [US2] Extract shared user input collectors into `packages/core/src/bot/utils/user-inputs.ts`
      (askForArabicName, askForPhone, askForNationalId, generateNickname). ALL conversation prompts sent to users (e.g., "Enter your name", "Enter your phone") MUST use i18n keys via `ctx.t('key')` — no hardcoded Arabic or English strings (Constitution Principle VII).
- [x] T090 [US2] Extract shared formatters and admin notifier into `packages/core/src/bot/utils/formatters.ts`
      (formatArabicDate, formatGender, notifyAdmins)
- [x] T091 [US2] Refactor join.ts to use bot/utils — all flow messages deleted before final result
- [ ] T092 [US2] Complete T025-B verification: add unit tests for `approveJoinRequest()`, `rejectJoinRequest()`, `getJoinRequests()` once implemented in Phase 5 (T033)

**Checkpoint**: Join request system complete - users can apply to join

---

## Phase 5: RBAC & User Management (US1/US2)

**Purpose**: Role-based access control and user management (Priority P2)

### Core RBAC Infrastructure

- [ ] T029 [P] Create RBAC middleware in `packages/core/src/bot/middlewares/rbac.ts` and register it in the Grammy middleware chain for ALL handlers: /start, /sections, /maintenance, /audit, /users, and all conversation flows (FR-016)
- [ ] T030 [P] Implement `canAccess(userId, sectionId?, moduleId?)` in `packages/core/src/services/rbac.ts` with Redis caching
- [ ] T084 [P] Implement AdminScope authorization logic in `canAccess()` (FR-017, FR-029)
- [ ] T031 [P] Create AdminScope service (assign/revoke permissions) in `packages/core/src/services/admin-scope.ts`
- [ ] T034 [P] Write unit tests for RBAC middleware and canAccess function
- [ ] T111 [P] [US1] Implement `isActive` check middleware in `packages/core/src/bot/middlewares/rbac.ts` — on every incoming request, verify `user.isActive === true` before allowing any handler to process. If `isActive === false`, respond via i18n key `errors-account-deactivated` and halt. Ensure T032 (deactivation handler) also invalidates the user's Redis session immediately.

### User Management Handlers

- [ ] T032 [US1] Create user management handlers (List, Change Role, Activate/Deactivate) in `packages/core/src/bot/handlers/users.ts`. On deactivation: invalidate user's Redis session immediately and respond via i18n key `errors-account-deactivated`.
- [ ] T115 [P] [US2] Implement AdminScope assignment/revocation UI in `packages/core/src/bot/handlers/users.ts` — inline buttons under the Users menu allowing Super Admin to assign or revoke section/module scopes for Admin users (FR-017). Uses AdminScope service from T031. ALL button labels and messages MUST use i18n keys from `.ftl` files (Constitution Principle VII — i18n-Only). No hardcoded Arabic or English strings in source.
- [ ] T033 [US2] Create join request approval/rejection handlers in `packages/core/src/bot/handlers/approvals.ts`
- [ ] T102 [US2] Implement concurrent admin protection in approval/rejection handlers: atomic status check before any DB write — if request already handled, show error via i18n key `errors-join-request-already-handled` (see spec.md Edge Cases + Clarifications Session 2026-02-24)
- [ ] T103 [US2] Verify join request history retention: rejected requests are never overwritten — each new submission after rejection creates a new DB row. Add unit test to confirm (FR-012)

**Checkpoint**: RBAC system complete - permission management functional

---

## Phase 6: Section & Module Management (US3)

**Purpose**: Dynamic section and module organization (Priority P3)

### Section Management

- [ ] T035 [P] [US3] Create section CRUD service in `packages/core/src/services/sections.ts`
- [ ] T036 [P] [US3] Create section management handlers for Super Admin in `packages/core/src/bot/handlers/sections.ts` — includes: (1) deletion constraint: reject delete if section has active modules, show error via i18n key `errors-section-has-active-modules` (FR-018), (2) input validation via Zod: section name must be 2-50 characters, icon must be exactly one Unicode emoji character — reject invalid input with i18n key `errors-validation-section-name` and `errors-validation-section-icon` respectively (FR-018).
- [ ] T037 [P] [US3] Create section menu display (list active sections) in `packages/core/src/bot/menus/sections.ts`
- [ ] T038 [P] [US3] Create "empty section" message logic — reply via i18n key `section-empty-modules` when a section has no active modules. Add key to both `ar.ftl` and `en.ftl`.
- [ ] T039 [P] [US3] Create section enable/disable toggle handler
- [ ] T040 [P] Write integration tests for section CRUD including: create, edit, enable/disable, delete empty section (success), delete non-empty section (must fail with i18n error `errors-section-has-active-modules`)

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
- [ ] T049 [P] [US4] Create maintenance toggle command (Super Admin only) — implement as `toggleMaintenance()` utility function in `packages/core/src/services/maintenance.ts`. This function is shared with T104 (Settings > Maintenance Toggle) to avoid duplication (FR-022 + FR-036 alias).
- [ ] T050 [P] [US4] Create maintenance message for blocked users via i18n key `maintenance-active-message`
- [ ] T051 [P] Store maintenance status in Redis
- [ ] T086 [P] Implement Redis pub/sub for maintenance mode propagation (NFR-002)
- [ ] T052 [P] Write unit test for maintenance middleware

**Checkpoint**: Maintenance mode complete - system control functional

---

## Phase 7b: Settings Menu (FR-036)

**Purpose**: Super Admin bot settings interface

### Settings Implementation

- [ ] T104 [P] [US6] Create settings menu handler in `packages/core/src/bot/handlers/settings.ts` — main menu with 5 sub-items (Maintenance Toggle, Default Language, Notification Preferences, System Info, Backup)
- [ ] T105 [P] [US6] Implement Default Language setting: bot-level default language (AR/EN) for new users. Store in Redis as a persistent key `system:defaultLanguage` (survives restarts via Redis persistence). On bot restart, read this key to restore the setting. Does NOT affect existing users — only applied when creating new User records (User.language field default).
- [ ] T106 [P] [US6] Implement Notification Preferences: Super Admin can mute/unmute each of the 6 NotificationType values (`JOIN_REQUEST_NEW`, `JOIN_REQUEST_APPROVED`, `JOIN_REQUEST_REJECTED`, `USER_DEACTIVATED`, `MAINTENANCE_ON`, `MAINTENANCE_OFF`). "Delivery settings" in FR-036 means mute/unmute toggle only — no email/SMS (bot-only in Phase 1). Store active types as a Redis set `system:activeNotificationTypes`. Default: all 6 types active.
- [ ] T107 [P] [US6] Implement System Info Display: read-only view (bot version, uptime, connected services status, environment)
- [ ] T113 [P] [US6] Configure Docker for backup support (prerequisite for T108): (1) add `backup_data` named volume to `docker-compose.yml` mounted at `/backups` in the bot service, (2) ensure `postgresql-client` is installed in the bot's Dockerfile so `pg_dump`/`pg_restore` binaries are available at runtime.
- [ ] T108 [P] [US6] Implement Backup (Full Control): trigger DB backup (pg_dump), download, view history, restore. The double-confirmation prompt for restore MUST use i18n key `backup-restore-confirm` (NOT hardcoded text). The confirmation keyword the user must type MUST be read from i18n key `backup-restore-confirm-keyword` — this allows Arabic/English versions (e.g., "تأكيد" / "CONFIRM") without hardcoded strings (Constitution Principle VII).
- [ ] T116 [P] [US6] Manual verification: confirm Docker backup/restore works end-to-end — (1) trigger `pg_dump` from within the bot container, verify `.sql` file appears in `/backups` volume, (2) trigger `pg_restore` from the same file, verify data integrity after restore. Document verification steps in `quickstart.md` under a "Backup & Restore" section (FR-036).
- [ ] T109 [P] Write unit tests for settings handlers

**Checkpoint**: Settings menu complete - Super Admin configuration functional

---

## Phase 8: Audit & Session Management (US5)

**Purpose**: Comprehensive audit trail and session persistence (Priority P2)

### Audit Infrastructure

- [ ] T059 [P] [US5] Create audit log service in `packages/core/src/services/audit.ts` implementing ALL 23 auditable actions defined in spec.md FR-026. Each log entry: `{ userId: bigint, action: AuditAction, targetType?: string, targetId?: string, details?: Json }`. Complete action list: `USER_BOOTSTRAP`, `USER_LOGIN`, `USER_LOGOUT`, `ROLE_CHANGE`, `USER_APPROVE`, `USER_REJECT`, `USER_ACTIVATE`, `USER_DEACTIVATE`, `JOIN_REQUEST_SUBMIT`, `SECTION_CREATE`, `SECTION_UPDATE`, `SECTION_DELETE`, `SECTION_ENABLE`, `SECTION_DISABLE`, `MODULE_REGISTER`, `MODULE_UNREGISTER`, `MODULE_ENABLE`, `MODULE_DISABLE`, `MAINTENANCE_ON`, `MAINTENANCE_OFF`, `PERMISSION_CHANGE`, `ADMIN_SCOPE_ASSIGN`, `ADMIN_SCOPE_REVOKE`
- [ ] T060 [P] [US5] Create audit middleware (auto-logs actions) in `packages/core/src/bot/middlewares/audit.ts`
- [x] T061 [P] [US5] ~~Define `AuditAction` in `packages/core/src/types/audit.ts`~~ — SUPERSEDED: `AuditAction` enum is already defined directly in `prisma/schema.prisma` with all 23 actions (migration `20260224231434`). Import via `import { AuditAction } from '@prisma/client'` across the codebase. No separate types file needed.
- [ ] T062 [P] [US5] Create audit log viewer for Super Admin in `packages/core/src/bot/handlers/audit.ts`
- [ ] T063 [P] [US5] Ensure NO sensitive data is logged in AuditLog.details (FR-027). Explicitly NEVER log the following fields in any audit entry: `nationalId`, `phone`, `password`, `token`, API keys. These fields must be stripped or replaced with `[REDACTED]` before writing to AuditLog. `userId` (telegramId) and `fullName` are acceptable in audit logs. Add unit test to verify redaction.
- [ ] T064 [P] Write unit tests for audit service

### Session Management

- [ ] T065 [P] [US5] Create Redis session service with 24-hour TTL
- [ ] T087 [P] [US5] Implement Redis fallback to in-memory sessions: if Redis is unavailable, fall back to in-memory Map for the current request session. Log CRITICAL warning via Pino. On every subsequent request, attempt Redis reconnection with exponential backoff (1s → 2s → 4s). Resume Redis sessions automatically once connection is restored.
- [ ] T066 [P] [US5] Create session middleware (load/save) in `packages/core/src/bot/middlewares/session.ts`. On new session creation (no existing session found), initialize `locale` from `User.language` field (DB lookup by telegramId). If user not found in DB (e.g., first-ever request before bootstrap), default `locale` to `'ar'`.
- [ ] T067 [P] [US5] Store navigation state as `currentMenu` array (navigation breadcrumb stack) in Redis session — aligns with FR-028 session contract. Example: `['sections', 'section-id-123']`. Do NOT use separate currentSection/currentModule fields.
- [ ] T068 [P] [US5] Handle session expiry gracefully — when a session expires after 24h inactivity, clear session state and redirect user to /start flow. No i18n message needed (user simply restarts); log expiry via Pino at debug level.
- [ ] T069 [P] Write unit tests for session service

**Checkpoint**: Audit & Session system complete

---

## Phase 9: Integration & Polish

**Purpose**: End-to-end testing and final cleanup

### Final Verification

- [ ] T056 [P] Implement notification history storage in `packages/core/src/services/notifications.ts`
- [ ] T081 [P] Create notification cleanup cron job: delete notifications older than 90 days (retention policy per FR-032). Schedule: runs daily at 02:00 AM Africa/Cairo timezone using node-cron.
- [ ] T099 [P] [US2] Integration test: verify SC-009 — send join request, confirm 95%+ of Super Admins receive Telegram notification within 30 seconds (FR-013, SC-009)
- [ ] T100 [P] Verify SC-008: confirm Docker health checks are configured for all services (PostgreSQL, Redis, Bot) in docker-compose.yml
- [ ] T101 [P] Document uptime monitoring approach: add note in quickstart.md recommending UptimeRobot or similar tool for production deployment
- [ ] T070 [US1] End-to-end test: complete user journey covering US1 acceptance scenarios: (1) INITIAL_SUPER_ADMIN_ID user sends /start → completes join flow → receives Super Admin welcome, (2) each of the 4 roles (SUPER_ADMIN, ADMIN, EMPLOYEE, VISITOR) sends /start → sees the correct role-appropriate menu with no cross-role leakage
- [ ] T071 [US3] End-to-end test: Super Admin journey (Sections -> Modules -> Users)
- [ ] T072 Verify 80% code coverage across all packages
- [ ] T073 Code cleanup, formatting, and final linting
- [ ] T074 Update quickstart.md with actual commands and verification steps
- [ ] T098 [P] Verify Platform-First Gate: confirm `modules/` directory contains ZERO implemented module files. Run: `find modules/ -name '*.ts' | grep -v '.gitkeep'` — must return empty output. Document result in commit message.
- [ ] T114 [P] Run final `/speckit.analyze` and confirm zero issues before tagging — Constitution Principle X Zero-Defect Gate. Do NOT proceed to T075 if any issues are found.
- [ ] T075 Final commit and tag v0.1.0. **Note (M1):** The 90/10 rule (90% config, max 10% hook code per module) cannot be verified until Phase 3 (first business module). Add compliance verification to Phase 3 tasks.
- [ ] T078 Verify SC-002: Load test with ~200 concurrent simulated users
- [ ] T079 Verify FR-015: Confirm all 4 roles (SUPER_ADMIN, ADMIN, EMPLOYEE, VISITOR) display correct menus and access levels
- [ ] T080 Verify SC-003: Confirm audit logs capture 100% of 23 defined actions from FR-026 (no gaps)
- [ ] T093 Verify SC-001: Manual test — first-time bootstrap user completes full flow (name → phone → national ID → confirm → Super Admin welcome) in ≤ 30 seconds
- [ ] T094 Verify SC-004: Manual test — session state (current section, navigation) persists correctly across bot interactions within a 24-hour window; new session starts after 24hr inactivity
- [ ] T095 Verify SC-005 + SC-006: Manual test — maintenance mode toggle propagates to all non-Super Admin users within 5 seconds; module discovery completes within 10 seconds of bot startup
- [ ] T096 Verify SC-007 + SC-010: Manual test — all user-facing messages are in Arabic with no hardcoded strings; Super Admin can create, rename, reorder, and delete sections without any developer intervention

**Checkpoint**: Platform Core complete - ready for production deployment

---

## مهام تحضير AI الموازية (Parallel AI Prep)

> تُنفَّذ بالتوازي مع التطوير الرئيسي — لا تتعارض مع أي Phase
> التفاصيل الكاملة في `specs/002-ai-assistant/tasks.md`

### المرحلة A — يوازي Phase 6-7

- [ ] T-AI-01 [P] تحديث docker-compose.yml: استبدال `postgres:16` بـ `pgvector/pgvector:pg16` + إضافة Ollama service
- [ ] T-AI-02 [P] إنشاء هيكل `packages/ai-assistant/` (package.json, tsconfig.json, مجلدات فارغة)
- [ ] T-AI-03 [P] تحديث .env.example بمتغيرات AI (OLLAMA_BASE_URL, AI_EMBEDDING_MODEL, AI_LLM_MODEL)
- [ ] T-AI-04 [P] توثيق أوامر تحميل النماذج في quickstart.md

### المرحلة B — يوازي Phase 8-9

- [ ] T-AI-05 [P] إضافة جدول `Embedding` لـ Prisma Schema + migration
- [ ] T-AI-06 [P] إنشاء Embedding Service + LLM Client + RAG Service + RBAC Filter

### المرحلة C — بعد Phase 11

- [ ] T-AI-07 تكامل كامل — انظر `specs/002-ai-assistant/tasks.md` للتفاصيل
