# Tasks: Hierarchical Sections & Advanced Module CLI

**Input**: Design documents from `/specs/006-hierarchical-sections/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Feature Branch**: `006-hierarchical-sections`

## Phase 1: Setup

- [x] T001 Verify `inquirer` dependency is present in `package.json`
- [x] T002 Verify `PrismaClient` is correctly configured for CLI usage in `scripts/module-create.ts`      
- [x] T003 [P] Initialize unit test file for hierarchical logic in `packages/core/tests/unit/services/sections.test.ts`

## Phase 2: Foundational (Blocking Prerequisites)

- [x] [VERIFY] T004 Verify existing Section model in prisma/schema/platform.prisma has parentId field and matches data-model.md hierarchy structure
- [x] [VERIFY] T005 [P] Run npx prisma generate to confirm client reflects current section hierarchy relations
- [x] T006 Implement `getMainSections` helper in `packages/core/src/services/sections.ts`
- [x] T007 [P] Implement `getSubSections(parentId: string)` helper in `packages/core/src/services/sections.ts`
## Phase 3: User Story 1 - Enhanced CLI Scaffolding (Priority: P1)

**Goal**: Developer can scaffold a new module into a main section or sub-section purely via CLI.

**Independent Test**: Run `npm run module:create test-hierarchical`, follow interactive prompts to create a new main section and sub-section, and verify `modules/test-hierarchical/config.ts` has correct `sectionSlug`.

- [ ] T008 [US1] Update `scripts/module-create.ts` to use `inquirer` for fetching and displaying main sections from database
- [ ] T009 [US1] Add "Create New Main Section" interactive flow in `scripts/module-create.ts`
- [ ] T010 [US1] Implement sub-section selection/creation flow (with skip option) in `scripts/module-create.ts`
- [ ] T011 [US1] Update scaffolding logic to use the resolved `sectionSlug` in `scripts/module-create.ts`
- [ ] T012 [US1] Add validation to ensure created section names/slugs are valid and unique in `scripts/module-create.ts`
- [ ] T013 [US1] Test full interactive CLI flow for SC-001 in `scripts/module-create.ts`

## Phase 4: User Story 2 - Hierarchical Telegram Navigation (Priority: P1)

**Goal**: Telegram bot displays multi-level hierarchy (Main Menu -> Main Section -> Sub-section -> Module).

**Independent Test**: Navigate through the bot menus: Main Menu -> Select Main Section -> Select Sub-section -> Open Module. Verify "Back" buttons work at each level.

- [ ] T014 [US2] Update `menuHandler` in `packages/core/src/bot/handlers/menu.ts` to list Main Sections as buttons for authorized users
- [ ] T015 [US2] Implement `showSubSectionsMenu` in `packages/core/src/bot/menus/sections.ts`
- [ ] T016 [US2] Update navigation routing logic to handle sub-section drill-down in `packages/core/src/bot/menus/sections.ts`
- [ ] T017 [US2] Update breadcrumb/back navigation to support 2-level hierarchy in `packages/core/src/bot/menus/sections.ts`
- [ ] T018 [US2] Ensure icons and i18n names are correctly displayed in bot menus in `packages/core/src/bot/menus/sections.ts`
- [ ] T019 [US2] Test hierarchical navigation for SC-002 in Telegram bot

## Phase 5: User Story 3 - Backwards Compatibility & Polish (Priority: P1)

**Goal**: Existing modules and AdminScopes remain functional without manual migration.

**Independent Test**: Log in as a user with existing AdminScope and verify access to modules assigned directly to main sections.

- [ ] T020 [US3] Verify `getAuthorizedModules` correctly resolves access for main sections containing both modules and sub-sections in `packages/core/src/bot/handlers/menu.ts`
- [ ] T021 [US3] Ensure existing `AdminScope` logic in `packages/core/src/services/rbac.ts` supports recursive access to sub-sections
- [ ] T022 [P] Run `npm run lint` and fix any issues in modified files
- [ ] T023 [P] Run full test suite `npm test` to ensure no regressions in Platform Core
- [ ] T024 Update `docs/module-development-guide.md` with new hierarchical scaffolding instructions

## Dependencies & Execution Order

1. **Foundational (Phase 2)** must be completed before any Story implementation.
2. **User Story 1 (Phase 3)** and **User Story 2 (Phase 4)** are independent and can be implemented in parallel.
3. **User Story 3 (Phase 5)** should be verified after both US1 and US2 are completed.

## Parallel Execution Examples

### User Story 1 (CLI)
```bash
# Developer A focuses on CLI interactivity
Task T008, T009, T010, T011, T012
```

### User Story 2 (Bot)
```bash
# Developer B focuses on bot menu routing
Task T014, T015, T016, T017, T018
```

## Implementation Strategy

- **MVP First**: Focus on T008-T011 (CLI) and T014-T016 (Bot) to achieve basic hierarchy support.
- **Incremental Delivery**: Start with CLI scaffolding to enable team productivity, then follow with Bot UI improvements.
