# Tasks: 003-module-kit (Layer 2 Module Kit)

**Input**: Design documents from `specs/003-module-kit/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Tests**: Test-First Development (Principle IV). Tests included where mandated by the constitution (80% minimum coverage).

**Organization**: Tasks organized by user story from spec.md. Each story is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Package scaffolding, Prisma multi-file schema migration, and monorepo configuration

- [x] T001 Create `packages/module-kit/` directory structure with `package.json` (`name: "@al-saada/module-kit"`), `tsconfig.json`, and `src/index.ts` entry point per `specs/003-module-kit/plan.md` Source Code structure
- [x] T002 [P] Create `packages/module-kit/src/types.ts` — export `ModuleDefinition`, `ValidateOptions<T>`, `ConfirmOptions<T>`, `SaveOptions<T>` interfaces per `specs/003-module-kit/contracts/module-definitions.md` and `specs/003-module-kit/contracts/helpers.md`. Include granular `permissions: { view: Role[], create: Role[], edit: Role[], delete: Role[] }`, i18n key fields (`name: string`, `nameEn: string`), `addEntryPoint`, `editEntryPoint?`, `orderIndex?`, `draftTtlHours?: number`, and `auditAction?: AuditAction` (defaults to MODULE_CREATE)
- [x] T003 [P] Create `modules/` directory at repo root for dynamic module discovery. Add a `.gitkeep` file to preserve empty directory in version control
- [x] T004 Migrate Prisma schema to Multi-File Schema structure: create `prisma/schema/` folder, split current `prisma/schema.prisma` into `prisma/schema/main.prisma` (datasource + generator + enums) and `prisma/schema/platform.prisma` (User, JoinRequest, Section, Module, AuditLog, Notification, AdminScope models). **Add `slug String @unique` field to Section model** (required for sectionSlug→AdminScope runtime resolution). Add `MODULE_CREATE`, `MODULE_UPDATE`, `MODULE_DELETE` values to `AuditAction` enum. Create empty `prisma/schema/modules/` directory. Update `package.json` with `"prisma": { "schema": "prisma/schema" }`. Run `prisma generate` to verify. Create migration with `prisma migrate dev`.
- [x] T005 [P] Register `@al-saada/module-kit` in root `package.json` workspaces array and configure internal dependency resolution so `modules/*/config.ts` can `import { defineModule } from '@al-saada/module-kit'`
- [x] T006 [P] Create `scripts/` directory at repo root with empty entry files: `scripts/module-create.ts`, `scripts/module-remove.ts`, `scripts/module-list.ts`. Add npm scripts to root `package.json`: `"module:create"`, `"module:remove"`, `"module:list"` per plan.md

**Checkpoint**: Package structure ready, Prisma multi-file schema working, monorepo dependencies configured

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities that ALL user stories depend on — defineModule, ModuleLoader, draft middleware

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Implement `defineModule()` utility in `packages/module-kit/src/define-module.ts` — accepts a `ModuleDefinition` config object (with granular permissions, i18n name keys, addEntryPoint/editEntryPoint), validates required fields (slug format, sectionSlug, name, nameEn, icon, permissions.view non-empty), and returns frozen config. Export from `packages/module-kit/src/index.ts`. Per FR-001
- [x] T008 Implement `ModuleLoader` in `packages/core/src/bot/module-loader.ts` — perform a **shallow scan of `modules/*/config.ts` (non-recursive, top-level only)** using `fs.readdirSync` + dynamic `import()`. Validate each exported config is a valid `ModuleDefinition`. Register valid modules. On error: catch, log via Pino, notify all SUPER_ADMINs via Telegram, skip broken module. Sort loaded modules by `orderIndex` then alphabetically. Must complete in < 5 seconds (QA-001). Per FR-014
- [x] T009 Implement i18n locale loader in `ModuleLoader` — for each loaded module, scan `modules/{slug}/locales/ar.ftl` and `modules/{slug}/locales/en.ftl`, merge into global Fluent translator. Validate all keys are prefixed with module slug (e.g., `fuel-entry-*`). If locale files missing: log warning, use key placeholder fallback `[key_name]`. Per FR-010
- [x] T010 Implement draft middleware in `packages/core/src/bot/middleware/draft.ts` — intercept every user input during active module conversation. Save conversation state to Redis at key `draft:{userId}:{moduleSlug}` with sliding TTL (`draftTtlHours` from module config, default 24h). Reset TTL on each interaction. Per FR-008
- [x] T011 Implement command interrupt handler in draft middleware (`packages/core/src/bot/middleware/draft.ts`) — detect `/cancel`, `/start`, `/menu` during active module conversation. On detect: preserve current draft in Redis (do NOT clear), exit conversation gracefully, return user to main menu. Detect `/help`: show step-specific contextual help from i18n key `module-kit-help-{step}` without exiting or clearing draft. Per FR-015, spec.md clarification
- [x] T012 [P] Write unit tests for `defineModule()` in `packages/module-kit/tests/define-module.test.ts` — test valid config, missing required fields, invalid slug format, empty permissions.view, frozen output. Per Principle IV
- [x] T013 [P] Write unit tests for `ModuleLoader` in `packages/core/tests/module-loader.test.ts` — test discovery, invalid config skip, SUPER_ADMIN notification on failure, startup < 5s with mock modules, orderIndex sorting. Per Principle IV

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 — Developer scaffolds a new module (Priority: P1) 🎯 MVP

**Goal**: Developers can scaffold a fully working module via CLI in under 1 minute (SC-001)

**Independent Test**: Run `npm run module:create fuel-entry`, answer prompts, verify folder structure matches plan.md, verify `prisma generate` succeeds

### Tests for User Story 1

- [x] T014 [P] [US1] Write integration test for `module:create` CLI in `scripts/tests/module-create.test.ts` — test: creates correct folder structure, copies schema to `prisma/schema/modules/{slug}.prisma`, runs `prisma generate`, rejects duplicate slug, rejects invalid slug format. Per spec.md US1 scenarios
- [x] T015 [P] [US1] Write integration test for `module:remove` CLI in `scripts/tests/module-remove.test.ts` — test: requires type-slug confirmation, deletes module folder, deletes `prisma/schema/modules/{slug}.prisma`, runs `prisma generate`, does NOT drop database tables, warns about manual table deletion, exits with error on non-existent slug. Per FR-012
- [x] T016 [P] [US1] Write integration test for `module:list` CLI in `scripts/tests/module-list.test.ts` — test: lists discovered modules with status (loaded/error), handles empty modules directory. Per FR-013

### Implementation for User Story 1

- [x] T017 [US1] Implement `npm run module:create {slug}` CLI in `scripts/module-create.ts` — interactive prompts: Arabic name i18n key, English name i18n key, section slug, icon emoji, include edit flow? (boolean), include hooks? (boolean). Generates folder structure under `modules/{slug}/` with template files. **Scaffold `package.json` with `@al-saada/module-{slug}` name and `workspace:*` dependency on `@al-saada/module-kit`.** Scaffold `config.ts` using `defineModule()`. Scaffold `add.conversation.ts` and optionally `edit.conversation.ts`. Scaffold `schema.prisma` with placeholder model. Scaffold `locales/ar.ftl` and `en.ftl` with slug-prefixed keys. Scaffold `tests/flow.test.ts`. Copy `schema.prisma` to `prisma/schema/modules/{slug}.prisma`. Run `prisma generate`. Run `npm install` to link the new workspace package in the monorepo. Validate: slug format (lowercase, hyphen-separated), no existing folder. **Validate sectionSlug against Section.slug in database; if validation fails or DB is unreachable, the CLI MUST fail and exit with an error.** Under 1 minute (SC-001). Per FR-011, spec.md US1, analyze D1, F1
- [x] T018 [US1] Implement `npm run module:remove {slug}` CLI in `scripts/module-remove.ts` — check module folder existence → if missing, exit with error. Display module info. Require user to type slug to confirm. Delete `modules/{slug}/` folder. Delete `prisma/schema/modules/{slug}.prisma`. Run `prisma generate`. Run `npm install` to clean stale workspace symlinks from node_modules. Display warning: database tables NOT dropped, manual `prisma migrate` needed. Per FR-012
- [x] T019 [US1] Implement `npm run module:list` CLI in `scripts/module-list.ts` — scan `modules/*/config.ts`, attempt dynamic import, display formatted table: slug, name keys, section, icon, status (✅ loaded / ❌ error + reason), total count. Per FR-013

**Checkpoint**: CLI tools fully functional — scaffold, remove, list modules. US1 independently testable

---

## Phase 4: User Story 2 — User interacts with a module (Data Collection & Validation) (Priority: P1)

**Goal**: Users can complete guided data entry with validation, inline editing from summary, and retry limits

**Independent Test**: Create a dummy module, run user through validate() → confirm() → edit cycle, verify retry logic and summary display

### Tests for User Story 2

- [x] T020 [P] [US2] Write unit tests for `validate()` in `packages/module-kit/tests/validation.test.ts` — test: prompts with i18n key, validates input, retries up to maxRetries (default 3), formats valid input, returns undefined on max retries exceeded (cancel + notify), handles command interrupts (/cancel preserves draft). Per FR-003, spec.md US2 scenarios
- [x] T021 [P] [US2] Write unit tests for `confirm()` in `packages/module-kit/tests/confirmation.test.ts` — test: displays summary with i18n labels, shows edit buttons for editableFields, re-asks specific field on edit click, returns to summary with original value on edit cancel, returns boolean (confirmed/rejected). Per FR-004, spec.md US2 scenarios

### Implementation for User Story 2

- [x] T022 [US2] Implement `validate<T>()` helper in `packages/module-kit/src/validation.ts` — prompt user with `ctx.t(promptKey)`, await text input via `conversation.waitFor('message:text')`, detect command interrupts (`/cancel`, `/start`, `/menu` → preserve draft, exit), run `validator()` function, on fail: reply with `ctx.t(errorKey)` and retry up to `maxRetries` (default 3), on success: apply `formatter()` if provided and return value, on max retries exceeded: cancel conversation, clear draft, notify user via i18n key `module-kit-max-retries-exceeded` with restart button. Export from `packages/module-kit/src/index.ts`. Per FR-003
- [x] T023 [US2] Implement `confirm<T>()` helper in `packages/module-kit/src/confirmation.ts` — build summary message from `data` using `labels` map (each label is an i18n key → `ctx.t(label)`). Display inline keyboard buttons for each field in `editableFields`. On edit button click: call `reAsk(field)` to re-collect that specific field. On reAsk cancel: return to summary with original value preserved. On confirm button (i18n key `module-kit-confirm-btn`): return `true`. On cancel button (i18n key `module-kit-cancel-btn`): return `false`. Export from `packages/module-kit/src/index.ts`. Per FR-004, Principle VII

**Checkpoint**: Data collection helpers fully functional — validate with retries, confirm with inline editing. US2 independently testable

---

## Phase 5: User Story 4 — Automatic Saving, Audit, and Notifications (Priority: P1)

**Goal**: 100% of data operations automatically generate audit logs and admin notifications (SC-002, QA-002)

**Independent Test**: Complete a module's confirm step, trigger save(), verify DB record + AuditLog entry (PII masked) + Telegram notifications to scoped admins

### Tests for User Story 4

- [x] T024 [P] [US4] Write unit tests for `save()` in `packages/module-kit/tests/persistence.test.ts` — test: executes Prisma action callback, creates AuditLog entry with full payload (PII masked), queries AdminScope for module's sectionSlug to find admins, notifies all matching ADMINs + all SUPER_ADMINs, clears Redis draft on success, preserves Redis draft on DB failure. Per FR-005, FR-006, FR-007, SC-002, QA-002

### Implementation for User Story 4

- [x] T025 [US4] Implement `save<T>()` helper in `packages/module-kit/src/persistence.ts` — execute `options.action(prisma)` inside try/catch. On success: (1) create AuditLog entry via `auditService.log()` with PII masking (via T026) and the **optional `auditAction: AuditAction` parameter from options (defaulting to MODULE_CREATE)**, (2) **directly use `sectionSlug` from the module configuration** to find authorized ADMINs, (3) fetch all SUPER_ADMINs, (4) send Telegram notification to all found admins via `notificationService`. **Notifications MUST contain FULL, UNMASKED data per FR-007 — PII masking applies ONLY to audit log entries (FR-006), NOT to admin notifications.** (5) delete Redis draft. On DB failure: preserve Redis draft, notify user of error with i18n key `module-kit-save-failed` with retry option. Export from `packages/module-kit/src/index.ts`. Per FR-005, FR-006, FR-007, spec.md clarification (resolution chain), analyze B1, E1
- [x] T026 [US4] Implement PII masking utility in `packages/module-kit/src/pii-masker.ts` — function `maskPII(data: Record<string, unknown>): Record<string, unknown>` that detects fields named `phone`, `nationalId`, `taxId` (case-insensitive) and masks them (e.g., `+20*******12`, `299*********`). Use in `save()` for audit log details. Per Principle VI, plan.md structure

**Checkpoint**: Persistence layer complete — save with auto audit, PII masking, auto notifications. US4 independently testable

---

## Phase 6: User Story 5 — Module Visibility and Access Control (Priority: P1)

**Goal**: 0% unauthorized access rate (SC-003) — modules invisible to users without `permissions.view`

**Independent Test**: Define module with specific permissions, test menu visibility with different user roles

### Tests for User Story 5

- [x] T027 [P] [US5] Write unit tests for menu visibility in `packages/core/tests/menu-visibility.test.ts` — test: module hidden from user without `view` permission, module visible to user with `view` permission, SUPER_ADMIN sees all modules, ADMIN with matching AdminScope sees module. Per FR-002, SC-003

### Implementation for User Story 5

- [x] T028 [US5] Implement menu visibility filter in `ModuleLoader` or menu handler (`packages/core/src/bot/handlers/menu.ts`) — when building user menu: (1) get user role from session, (2) if SUPER_ADMIN: show all loaded modules, (3) if ADMIN: show modules where user role is in `permissions.view` AND user has matching `AdminScope` for module's `sectionSlug`, (4) if EMPLOYEE: show modules where EMPLOYEE is in `permissions.view`. Group modules by section, sort by `orderIndex` then alphabetically. Per FR-002, SC-003
- [x] T029 [US5] Implement action-level permission checks — when user selects a module action: check `permissions.create` for "add" flows, `permissions.edit` for "edit" flows, `permissions.delete` for "delete" actions. If unauthorized: reply with i18n key `module-kit-unauthorized-action`. Per granular permissions

**Checkpoint**: RBAC fully enforced — menu visibility and action-level permissions. US5 independently testable

---

## Phase 7: User Story 3 — Draft Auto-Save and Recovery (Priority: P2)

**Goal**: Users can resume interrupted flows without data loss (SC-004)

**Independent Test**: Start module flow, answer some questions, send `/cancel`, re-enter module, verify resume prompt and correct restoration

### Tests for User Story 3

- [x] T030 [P] [US3] Write integration test for draft recovery in `packages/core/tests/draft-recovery.test.ts` — test: draft saved to Redis on each input, draft restored on re-entry with "Resume/Start Fresh" prompt, "Resume" restores to correct step, draft expires after TTL. Per FR-008, FR-009

### Implementation for User Story 3

- [x] T031 [US3] Implement draft resume prompt in module entry flow — before starting module conversation: check Redis for `draft:{userId}:{moduleSlug}`. If found: display i18n message `module-kit-draft-found` with two inline buttons: Resume (i18n key `module-kit-draft-resume-btn`) and Start Fresh (i18n key `module-kit-draft-fresh-btn`). On "Resume": restore conversation state. **Edge case: If user clicks Resume but draft has expired in the interim (Redis TTL elapsed between prompt display and button click), show i18n key module-kit-draft-expired and start fresh automatically.** On "Start Fresh": delete Redis draft, start conversation from beginning. Per FR-009, Principle VII
- [x] T032 [US3] Implement draft conversation state serialization/deserialization — **serialize: capture ONLY the collected data object and current stepKey/stepIndex, excluding volatile UI state (keyboard markup, pending message IDs)**. Deserialize: restore conversation state and jump to the correct step. Handle edge case: if user's permissions were revoked between abandonment and resume, fail with i18n key `module-kit-unauthorized-resume`.
**Draft serialization format: JSON object with structure { data: Record<string, any>, stepIndex: number, stepKey: string, moduleSlug: string, savedAt: string (ISO timestamp) }. Excludes volatile UI state: grammY keyboard markup, pending message IDs, conversation context references.**

**Checkpoint**: Draft recovery system complete — auto-save, resume/fresh choice, permission re-validation. US3 independently testable

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, data-model sync, integration verification, and quality assurance

- [x] T033 [P] Update `specs/003-module-kit/data-model.md` to reflect corrected interfaces
- [x] T034 [P] Create i18n locale entries for module-kit system messages: module-kit-max-retries-exceeded, module-kit-confirm-btn, module-kit-cancel-btn, module-kit-save-failed, module-kit-unauthorized-action, module-kit-draft-found, module-kit-draft-resume-btn, module-kit-draft-fresh-btn, module-kit-draft-expired, module-kit-unauthorized-resume, module-kit-help-{step} pattern, module-kit-conversation-timeout, module-kit-draft-save-unavailable
- [SKIPPED] T035 — Intentionally removed during task refinement. Task IDs are not renumbered to preserve traceability with previous analysis reports.
- [x] T036 Run end-to-end verification: (1) scaffold test module via module:create, (2) verify folder structure + prisma generate, (3) simulate validate→confirm→save flow, (4) verify AuditLog with PII masking, (5) verify admin notifications, (6) verify draft save/restore cycle, (7) remove test module via module:remove, (8) run full test suite — all 100% passing
- [x] T037 Run `/speckit.analyze`

**Checkpoint**: Feature complete — all user stories working, data-model synced, i18n keys created, end-to-end verified

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - US1 (CLI), US2 (Validation/Confirm), US4 (Save/Audit), US5 (Access Control) are P1 — do sequentially or in parallel
  - US3 (Draft Recovery) is P2 — do after all P1 stories
- **Polish (Phase 8)**: Depends on all user stories being complete

### User Story Dependencies

- **US1 (CLI Scaffolding)**: Can start after Phase 2 - No dependencies on other stories
- **US2 (Data Collection)**: Can start after Phase 2 - No dependencies on other stories
- **US4 (Save/Audit/Notify)**: Can start after Phase 2 - Depends on US2 for full flow verification
- **US5 (Access Control)**: Can start after Phase 2 - Depends on ModuleLoader (Phase 2)
- **US3 (Draft Recovery)**: Can start after Phase 2 - Depends on US2 for state serialization testing

---

## Parallel Example: User Story 2

```bash
# Launch all tests for US2 together:
Task T020: "Unit tests for validate() in packages/module-kit/tests/validation.test.ts"
Task T021: "Unit tests for confirm() in packages/module-kit/tests/confirmation.test.ts"

# Then implement sequentially:
Task T022: "validate() helper in packages/module-kit/src/validation.ts"
Task T023: "confirm() helper in packages/module-kit/src/confirmation.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US4 Only)

1. Complete Phase 1: Setup (T001-T006)
2. Complete Phase 2: Foundational (T007-T013)
3. Complete Phase 3: US1 — CLI Scaffolding (T014-T019)
4. Complete Phase 4: US2 — Data Collection (T020-T023)
5. Complete Phase 5: US4 — Save/Audit/Notify (T024-T026)
6. **STOP and VALIDATE**: End-to-end data entry → save → audit → notification

### Incremental Delivery

1. Foundation ready
2. Add US1 → CLI tools working
3. Add US2 → Data collection working
4. Add US4 → Persistence working (Audit/Notifications)
5. Add US5 → Access control working
6. Add US3 → Draft recovery working
7. Polish → Documentation synced, e2e verified, analyze clean

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Principle VII strictly enforced: i18n keys for all user-facing text (buttons, prompts, errors)
- PII masking applies to AuditLog only via `pii-masker.ts`
- `save()` resolution chain: `sectionSlug` → `Section.slug` → `Section.id` → `AdminScope.sectionId`
- Draft serialization: data + step index ONLY
- ModuleLoader scan: shallow only (`modules/*/config.ts`)
