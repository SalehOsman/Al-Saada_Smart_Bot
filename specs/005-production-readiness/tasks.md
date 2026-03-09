# Tasks: Production Readiness

**Input**: Design documents from `/specs/005-production-readiness/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), data-model.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- File paths are relative to repository root

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Install production dependencies: `@sentry/node`, `@grammyjs/ratelimiter`, `@grammyjs/auto-retry`, `node-cron`
- [X] T002 [P] Update `.env.example` with SENTRY_DSN, BACKUP_*, and RATE_LIMIT_* configurations
- [X] T003 [P] Create directory structure: `packages/core/src/bot/monitoring/`, `packages/core/src/bot/middleware/`, `packages/core/src/bot/services/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

- [X] T004 Add `BackupMetadata` model and `BackupStatus` enum to `prisma/schema/platform.prisma`
- [X] T005 [P] Implement PII filtering utility in `packages/core/src/bot/utils/pii-filter.ts`
- [X] T006 [P] Add i18n keys for production readiness in `packages/core/src/locales/ar.ftl` and `en.ftl` (Arabic/English)
- [X] T007 Run database migrations to apply `BackupMetadata` table

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Automated Database Backups (Priority: P1) 🎯 MVP

**Goal**: Implement daily encrypted database backups with local storage and SUPER_ADMIN management.

**Independent Test**: Trigger a manual backup via bot command, verify AES-256-GCM encrypted file exists, and successfully restore it via the two-step approval flow.

### Implementation for User Story 1

- [X] T008 [US1] Create unit tests for `BackupService` in `packages/core/tests/services/backup.service.test.ts` (Principle IV)
- [X] T009 [US1] Implement `BackupService` in `packages/core/src/bot/services/backup.service.ts` (pg_dump, AES-256-GCM encryption)
- [X] T010 [US1] Implement SUPER_ADMIN backup commands (`/backup`, `/backups`, `/restore`) in `packages/core/src/bot/handlers/backup.ts` (with two-step interactive approval for restore)
- [X] T011 [US1] Configure daily backup scheduling using `node-cron` in `packages/core/src/index.ts` (resolves I1)

**Checkpoint**: User Story 1 is functional and testable independently.

---

## Phase 4: User Story 2 - Error Monitoring & Alerting (Priority: P1)

**Goal**: Integrate Sentry for error tracking with PII filtering and Telegram alerts for SUPER_ADMINs.

**Independent Test**: Trigger a test error, verify it appears in Sentry with filtered PII, and confirm a Telegram alert is sent to SUPER_ADMIN for fatal/unhandled errors.

### Implementation for User Story 2

- [X] T012 [US2] Create unit tests for `SentryService` in `packages/core/tests/monitoring/sentry.service.test.ts` (Principle IV)
- [X] T013 [US2] Implement `SentryService` in `packages/core/src/bot/monitoring/sentry.service.ts` with beforeSend PII filtering
- [X] T014 [US2] Create unit tests for `ErrorAlertService` in `packages/core/tests/monitoring/error-alert.service.test.ts` (Principle IV)
- [X] T015 [US2] Implement `ErrorAlertService` in `packages/core/src/bot/monitoring/error-alert.service.ts` with alert throttling for SUPER_ADMIN
- [X] T016 [US2] Register Sentry middleware and global error handlers in bot initialization

**Checkpoint**: User Story 2 is functional and testable independently.

---

## Phase 5: User Story 3 - Rate Limiting & Automatic Retry (Priority: P2)

**Goal**: Protect system from abuse and handle transient failures using grammY middleware.

**Independent Test**: Verify rate limiting blocks rapid requests (except for SUPER_ADMIN) and auto-retry succeeds after simulated transient failure.

### Implementation for User Story 3

- [X] T017 [US3] Create unit tests for rate limiting logic in `packages/core/tests/middleware/rate-limit.test.ts` (Principle IV)
- [X] T018 [US3] Implement rate limiting middleware in `packages/core/src/bot/middleware/rate-limit.middleware.ts` (with SUPER_ADMIN bypass logic - resolves U1)
- [X] T019 [US3] Create unit tests for auto-retry logic in `packages/core/tests/middleware/auto-retry.test.ts` (Principle IV)
- [X] T020 [US3] Implement auto-retry middleware in `packages/core/src/bot/middleware/auto-retry.middleware.ts` (transient errors: ETIMEDOUT, ECONNRESET, 429, 502, 503, 504)

**Checkpoint**: User Story 3 is functional and testable independently.

---

## Phase 6: User Story 4 - Automated CI/CD Pipeline (Priority: P3)

**Goal**: Setup GitHub Actions for continuous quality gates (lint, test, prisma, GitNexus).

**Independent Test**: Create a PR with failing tests and verify CI blocks the merge.

### Implementation for User Story 4

- [X] T021 [P] [US4] Create ESLint check workflow in `.github/workflows/lint.yml`
- [X] T022 [P] [US4] Create Vitest check workflow in `.github/workflows/test.yml`
- [X] T023 [US4] Create main CI pipeline in `.github/workflows/ci.yml` (Prisma generate, GitNexus analysis)

**Checkpoint**: User Story 4 is functional and testable independently.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements and final validation

- [ ] T024 [P] Update `README.md` and `docs/developer/getting-started.md` with production setup details
- [ ] T025 Perform final validation of backup retention policy and error alert throttling
- [ ] T026 Run `quickstart.md` validation steps

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Can start immediately.
- **Foundational (Phase 2)**: Depends on Phase 1 completion.
- **User Stories (Phases 3-6)**: Depend on Phase 2 completion. US1 and US2 are top priority (P1).
- **Polish (Phase 7)**: Depends on all user stories being complete.

### Parallel Opportunities

- T002, T003, T005, T006 can run in parallel.
- Phases 3, 4, 5, 6 can run in parallel once Phase 2 is complete.
- T021, T022 can run in parallel within Phase 6.

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Setup and Foundational phases.
2. Implement User Story 1 (Backups) and User Story 2 (Monitoring).
3. Validate these P1 features immediately as they provide the most critical operational safety.

### Incremental Delivery

1. Foundation ready.
2. MVP delivered (Backups + Monitoring).
3. Add Resilience (Rate Limiting + Retry).
4. Add Automation (CI/CD Pipeline).
