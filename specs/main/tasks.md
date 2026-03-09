# Tasks: CI Fixes

**Input**: User directive for CI test failures
**Prerequisites**: plan.md (required)

## Phase 1: Verification & Setup

- [X] T001 Verify `packages/validators/package.json` exports and main field (FIX 1)
- [X] T002 Verify project ignore files (.gitignore, .dockerignore, etc.)

## Phase 2: Redis Mocks (FIX 2)

- [X] T003 [P] Add Redis and Maintenance mocks to `packages/core/tests/e2e/user-journey.test.ts`
- [X] T004 [P] Add Redis and Maintenance mocks to `packages/core/tests/menu-visibility.test.ts`

## Phase 3: CLI Test Platform Compatibility (FIX 3)

- [X] T005 Update `scripts/tests/module-create.test.ts` to handle `execSync` differences between Windows and Linux CI

## Phase 4: Validation & Commit

- [X] T006 Run local typecheck, lint, and tests
- [X] T007 Commit changes with requested message: "fix(ci): resolve test failures in GitHub Actions (validators resolution, Redis mocks, CLI tests)"
