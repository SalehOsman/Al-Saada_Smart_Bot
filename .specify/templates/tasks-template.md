---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root
- **Web app**: `backend/src/`, `frontend/src/`
- **Mobile**: `api/src/`, `ios/src/` or `android/src/`
- Paths shown below assume single project - adjust based on plan.md structure

<!-- 
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.
  
  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/
  
  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment
  
  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Platform Core (Feature 001) ⚠️ CRITICAL

**Purpose**: Platform Core (Layer 1) MUST be complete before any Flow Blocks or modules

**⚠️ BLOCKING**: No Flow Block or module development can begin until this phase is complete

### Core Infrastructure

- [ ] T001 Create monorepo structure: packages/core, packages/flow-engine, packages/validators, packages/ai-builder, modules/
- [ ] T002 Initialize Node.js ≥20 project with TypeScript 5.x (strict mode)
- [ ] T003 [P] Setup grammY bot framework with @grammyjs/conversations + @grammyjs/hydrate
- [ ] T004 [P] Implement RBAC system with 4 roles: Super Admin, Admin, Employee, Visitor
- [ ] T005 [P] Create dynamic module loader that discovers modules at startup
- [ ] T006 [P] Implement section (department) management system
- [ ] T007 Setup PostgreSQL + Redis with Docker Compose
- [ ] T008 [P] Create audit logging system
- [ ] T009 [P] Implement notification system
- [ ] T010 [P] Create maintenance mode functionality

**Checkpoint**: Platform Core complete - Flow Engine development can now begin

---

## Phase 2: Flow Engine (Feature 002) 🧠

**Purpose**: Flow Engine (Layer 2) converts config files into working Telegram bot screens

**⚠️ BLOCKING**: No modules can be created until Flow Engine is complete

### Flow Blocks Development

**Flow Block Requirements** (must be self-contained, work with any module, support Arabic/English):
- [ ] T011 [P] Create text_input Flow Block with Egyptian character support
- [ ] T012 [P] Create number_input Flow Block with Arabic number formatting
- [ ] T013 [P] Create date_input Flow Block with Gregorian + Hijri calendar
- [ ] T014 [P] Create phone_input Flow Block with Egyptian number validation
- [ ] T015 [P] Create national_id Flow Block with auto-extraction (birthdate, gender)
- [ ] T016 [P] Create email_input Flow Block with Arabic domain support
- [ ] T017 [P] Create currency_input Flow Block (EGP default)
- [ ] T018 [P] Create location_input Flow Block with Egyptian governorates
- [ ] T019 [P] Create select_from_db Flow Block with dynamic table loading
- [ ] T020 [P] Create select_enum Flow Block with static options
- [ ] T021 [P] Create file_upload and photo_upload Flow Blocks
- [ ] T022 [P] Create confirm Flow Block (summary + save + notifications)
- [ ] T023 [P] Create approval Flow Block (manager approval workflow)

### Core Engines

- [ ] T024 Create Wizard Runner that executes flow steps sequentially
- [ ] T025 Create List Engine with pagination, filtering, searching
- [ ] T026 Create Report Engine (Excel/PDF from any data)
- [ ] T027 Create Search Engine for cross-module data
- [ ] T028 [P] Setup @grammyjs/i18n with Arabic primary + English secondary
- [ ] T029 [P] Create Zod validation schemas for all input types
- [ ] T030 [P] Setup dayjs with Africa/Cairo timezone and Hijri support

**Checkpoint**: Flow Engine complete - Modules can now be created

---

## Phase 3: Test Module (Feature 003) 🎯 MVP

**Purpose**: One complete HR module to prove the platform works end-to-end

**Note**: Built entirely with Flow Blocks config - ZERO business logic code

### Module Structure

- [ ] T031 Create modules/hr-employee-registration/ directory structure
- [ ] T032 Create module.config.ts (name, section, permissions, icon)
- [ ] T033 Create schema.prisma (employee table definition)
- [ ] T034 Create add.flow.ts (employee registration flow steps)
- [ ] T035 Create edit.flow.ts (employee profile edit)
- [ ] T036 Create list.config.ts (employee list display)
- [ ] T037 Create report.config.ts (employee reports)

### Testing Requirements

**80% code coverage required for engine code**:
- [ ] T038 [P] Write unit tests for all Flow Blocks before implementation
- [ ] T039 [P] Write integration tests for Wizard Runner
- [ ] T040 [P] Write integration tests for List Engine
- [ ] T041 [P] Write integration tests for Report Engine
- [ ] T042 Write end-to-end test for complete employee registration flow

**Checkpoint**: Test module complete - Platform is proven functional

---

## Phase 4: AI Module Builder (Feature 004) 🚀

**Purpose**: AI-powered module creation (future enhancement)

### Infrastructure Setup

- [ ] T043 Setup pgvector (Prisma extension) for vector storage
- [ ] T044 [P] Setup Vercel AI SDK or LangChain.js
- [ ] T045 [P] Create RAG knowledge base of Egyptian business rules
- [ ] T046 [P] Build conversational module creation interface via bot

### AI Features

- [ ] T047 Auto-generate module.config.ts from natural language
- [ ] T048 Auto-generate schema.prisma from requirements
- [ ] T049 Auto-generate flow.ts files from workflows
- [ ] T050 Auto-generate list.config.ts and report.config.ts

**Checkpoint**: AI module builder complete - Full automation capability

---

## Phase 5: Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple phases

### Testing & Quality

- [ ] TXXX [P] Additional unit tests to maintain 80% coverage
- [ ] TXXX Performance optimization across all engines
- [ ] TXXX Security hardening and input sanitization

### Documentation

- [ ] TXXX Update documentation with Egyptian business context
- [ ] TXXX Create Flow Block developer guide
- [ ] TXXX Create module configuration guide

### Polish

- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Run quickstart.md validation

---

## Phase 3: User Story 1 - [Title] (Priority: P1) 🎯 MVP

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T011 [P] [US1] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 1

- [ ] T012 [P] [US1] Create [Entity1] model in src/models/[entity1].py
- [ ] T013 [P] [US1] Create [Entity2] model in src/models/[entity2].py
- [ ] T014 [US1] Implement [Service] in src/services/[service].py (depends on T012, T013)
- [ ] T015 [US1] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T016 [US1] Add validation and error handling
- [ ] T017 [US1] Add logging for user story 1 operations

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - [Title] (Priority: P2)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T019 [P] [US2] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 2

- [ ] T020 [P] [US2] Create [Entity] model in src/models/[entity].py
- [ ] T021 [US2] Implement [Service] in src/services/[service].py
- [ ] T022 [US2] Implement [endpoint/feature] in src/[location]/[file].py
- [ ] T023 [US2] Integrate with User Story 1 components (if needed)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - [Title] (Priority: P3)

**Goal**: [Brief description of what this story delivers]

**Independent Test**: [How to verify this story works on its own]

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Contract test for [endpoint] in tests/contract/test_[name].py
- [ ] T025 [P] [US3] Integration test for [user journey] in tests/integration/test_[name].py

### Implementation for User Story 3

- [ ] T026 [P] [US3] Create [Entity] model in src/models/[entity].py
- [ ] T027 [US3] Implement [Service] in src/services/[service].py
- [ ] T028 [US3] Implement [endpoint/feature] in src/[location]/[file].py

**Checkpoint**: All user stories should now be independently functional

---

[Add more user story phases as needed, following the same pattern]

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in docs/
- [ ] TXXX Code cleanup and refactoring
- [ ] TXXX Performance optimization across all stories
- [ ] TXXX [P] Additional unit tests (if requested) in tests/unit/
- [ ] TXXX Security hardening
- [ ] TXXX Run quickstart.md validation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Platform Core)**: No dependencies - can start immediately
- **Phase 2 (Flow Engine)**: Depends on Phase 1 completion - BLOCKS all modules
- **Phase 3 (Test Module)**: Depends on Phase 2 completion - PROVES platform works
- **Phase 4 (AI Module Builder)**: Depends on Phase 3 completion - FUTURE enhancement
- **Phase 5 (Polish)**: Depends on all core phases being complete

### Constitutional Constraints

- **Platform-First**: Phase 1 MUST be 100% complete before any Phase 2 work
- **Config-Driven**: ALL modules MUST be pure configuration - ZERO business logic code
- **Test-First**: ALL Flow Blocks MUST have unit tests before implementation
- **Egyptian Context**: ALL validators MUST support Egyptian formats and timezone
- **Reusability**: Flow Blocks MUST work with ANY module without modification

### Parallel Opportunities

- All Phase 1 tasks marked [P] can run in parallel
- All Phase 2 Flow Block tasks marked [P] can run in parallel
- All Flow Block tests marked [P] can run in parallel
- Phase 3 module can only start after Phase 2 complete
- Phase 4 AI features can only start after Phase 3 complete

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Contract test for [endpoint] in tests/contract/test_[name].py"
Task: "Integration test for [user journey] in tests/integration/test_[name].py"

# Launch all models for User Story 1 together:
Task: "Create [Entity1] model in src/models/[entity1].py"
Task: "Create [Entity2] model in src/models/[entity2].py"
```

---

## Implementation Strategy

### Constitutional Compliance Strategy

1. **Platform-First**: Phase 1 (Platform Core) MUST be complete before any other work
2. **Flow Block Development**: Phase 2 Flow Blocks MUST be fully tested before any module creation
3. **Config-Driven Verification**: Phase 3 MUST use ONLY configuration files to prove platform works
4. **Test Coverage**: Maintain 80% code coverage for ALL engine code
5. **Egyptian Context**: ALL components MUST support Arabic, Egyptian formats, and Africa/Cairo timezone

### Incremental Delivery (Aligned with Phases)

1. **MVP**: Complete Phase 1 + Phase 2 + Phase 3 → Test module proves platform works
2. **Enhancement**: Add Phase 4 AI features → Deploy automation capability
3. **Polish**: Phase 5 improvements → Final production quality

### Team Strategy

With multiple developers:

1. **Phase 1**: All developers collaborate on core infrastructure
2. **Phase 2**: Developers can work on different Flow Blocks in parallel
3. **Phase 3**: One developer focuses on the test module
4. **Phase 4**: AI specialists work on automation features
5. **Phase 5**: All developers collaborate on polish and improvements

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
