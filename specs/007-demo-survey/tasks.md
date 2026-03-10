# Tasks: Demo Survey Module (demo-survey)

**Input**: User request to create a comprehensive test module
**Feature Branch**: `007-demo-survey`

## Phase 1: Scaffolding
- [ ] T001 Run CLI to create the basic module structure (`npm run module:create demo-survey`)
- [ ] T002 Verify generated files (`config.ts`, `schema.ts`, `handlers.ts`, `index.ts`)

## Phase 2: Configuration & Schemas
- [ ] T003 Update `config.ts` with required settings (enable/disable toggle, admin selection)
- [ ] T004 Define complex data gathering schema in `schema.ts` (text, numbers, dates, photos, location, enumerations)
- [ ] T005 Set up database persistence via Prisma (if needed, though Module Kit handles drafts, we need a table for final reports)

## Phase 3: Handlers & UI Flows
- [ ] T006 Implement Entry Point handler
- [ ] T007 Implement Summary/Confirmation screen logic
- [ ] T008 Implement Final Save & Processing logic

## Phase 4: Notifications & Reporting
- [ ] T009 Generate PDF/Text report of the survey
- [ ] T010 Send notification to assigned module admins upon completion

## Phase 5: Testing & Verification
- [ ] T011 Test standard flow completion
- [ ] T012 Test validation rejections
- [ ] T013 Test configuration toggles (enabling/disabling module)
