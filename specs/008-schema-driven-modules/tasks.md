# Tasks: Module Kit V2 — Schema-Driven App Factory

**Input**: Design documents from `/specs/008-schema-driven-modules/`
**Prerequisites**: spec.md (user stories), FR-001 to FR-103 (functional requirements)

**Tests**: Test tasks are included for each user story to ensure TDD compliance.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Module Kit V2**: `packages/module-kit-v2/`
- **Generator CLI**: `packages/module-kit-v2/src/cli/`
- **Runtime Engine**: `packages/module-kit-v2/src/runtime/`
- **Schema Types**: `packages/module-kit-v2/src/types/`
- **Blueprint Schema**: `packages/module-kit-v2/src/schema/`
- **Templates**: `packages/module-kit-v2/templates/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure for Module Kit V2

- [ ] T001 Create package structure for packages/module-kit-v2 with src/, templates/, tests/ directories
- [ ] T002 Initialize TypeScript project with tsconfig.json extending project base configuration
- [ ] T003 [P] Add dependencies: js-yaml for YAML parsing, inquirer for CLI builder, chalk for terminal colors
- [ ] T004 [P] Add devDependencies: @types/js-yaml, @types/inquirer
- [ ] T005 [P] Configure package.json with exports and bin entry point for CLI
- [ ] T006 Update root package.json to include module-kit-v2 in workspace configuration
- [ ] T007 [P] Create .eslintrc.js for module-kit-v2 extending project ESLint rules
- [ ] T008 [P] Create tsconfig.json in packages/module-kit-v2 with strict mode enabled
- [ ] T009 Create src/index.ts with empty exports for now

**Checkpoint**: Package structure ready - can start implementing core types and schemas

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Blueprint Schema and Types

- [ ] T010 Create Blueprint JSON Schema in packages/module-kit-v2/src/schema/blueprint-schema.json
- [ ] T011 [P] Create Blueprint TypeScript types in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T012 [P] Create Field types in packages/module-kit-v2/src/types/field.ts (FieldDefinition, FieldType, validators, showIf)
- [ ] T013 [P] Create Module runtime types in packages/module-kit-v2/src/types/runtime.ts (ModuleRuntime, ConversationState, FieldRenderer)
- [ ] T014 Create Blueprint validator in packages/module-kit-v2/src/schema/blueprint-validator.ts using JSON Schema validation
- [ ] T015 Create YAML parser in packages/module-kit-v2/src/schema/yaml-parser.ts for loading blueprint.yaml files

### Runtime Engine Core

- [ ] T016 Create base conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T017 [P] Create step manager in packages/module-kit-v2/src/runtime/step-manager.ts for field navigation
- [ ] T018 [P] Create state manager in packages/module-kit-v2/src/runtime/state-manager.ts for draft persistence
- [ ] T019 Create blueprint loader in packages/module-kit-v2/src/runtime/blueprint-loader.ts for discovering and loading modules

### Generator Engine Core

- [ ] T020 Create base generator in packages/module-kit-v2/src/generator/generator.ts
- [ ] T021 [P] Create Prisma schema generator in packages/module-kit-v2/src/generators/prisma-generator.ts
- [ ] T022 [P] Create Zod validator generator in packages/module-kit-v2/src/generators/zod-generator.ts
- [ ] T023 [P] Create config.ts generator in packages/module-kit-v2/src/generators/config-generator.ts
- [ T024 [P] Create locale generator in packages/module-kit-v2/src/generators/locale-generator.ts for ar.ftl and en.ftl
- [ ] T025 [P] Create test file generator in packages/module-kit-v2/src/generators/test-generator.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Blueprint-Driven Module Creation (Priority: P1) 🎯 MVP

**Goal**: Enable developers to define modules entirely via YAML Blueprint files

**Independent Test**: Can be tested by creating a simple YAML Blueprint with basic fields and verifying the generator produces the expected output files. Delivers the ability to create a working module without writing any conversation code.

### Tests for User Story 1

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T026 [P] [US1] Test blueprint validator with valid blueprint in packages/module-kit-v2/tests/blueprint-validator.test.ts
- [ ] T027 [P] [US1] Test blueprint validator with invalid structure in packages/module-kit-v2/tests/blueprint-validator.test.ts
- [ ] T028 [P] [US1] Test YAML parser loading blueprint.yaml in packages/module-kit-v2/tests/yaml-parser.test.ts
- [ ] T029 [P] [US1] Test Prisma schema generation output in packages/module-kit-v2/tests/generators/prisma-generator.test.ts
- [ ] T030 [P] [US1] Test Zod validator generation output in packages/module-kit-v2/tests/generators/zod-generator.test.ts
- [ ] T031 [P] [US1] Test config.ts generation output in packages/module-kit-v2/tests/generators/config-generator.test.ts
- [ ] T032 [P] [US1] Test locale files generation output in packages/module-kit-v2/tests/generators/locale-generator.test.ts
- [ ] T033 [P] [US1] Integration test for full generation workflow in packages/module-kit-v2/tests/generator.integration.test.ts
- [ ] T034 [P] [US1] Test blueprint with conditional fields (showIf) in packages/module-kit-v2/tests/blueprint-validator.test.ts

### Implementation for User Story 1

- [ ] T035 [US1] Implement blueprint schema validator in packages/module-kit-v2/src/schema/blueprint-validator.ts
- [ ] T036 [US1] Implement YAML blueprint parser in packages/module-kit-v2/src/schema/yaml-parser.ts
- [ ] T037 [US1] Implement Prisma schema generator supporting basic field types (text, number, money, date, boolean, select, multiSelect, photo, document, file, relation, computed) in packages/module-kit-v2/src/generators/prisma-generator.ts
- [ ] T038 [US1] Implement Zod validator generator with field types and validators (positive, min, max, egyptianPhone, egyptianNationalId, afterField, beforeField, regex, unique) in packages/module-kit-v2/src/generators/zod-generator.ts
- [ ] T039 [US1] Implement config.ts generator with defineModule() call and metadata in packages/module-kit-v2/src/generators/config-generator.ts
- [ ] T040 [US1] Implement locale generator for ar.ftl and en.ftl with i18n keys for labels, errors, and hints in packages/module-kit-v2/src/generators/locale-generator.ts
- [ ] T041 [US1] Implement test skeleton generator in packages/module-kit-v2/src/generators/test-generator.ts
- [ ] T042 [US1] Create blueprint template in packages/module-kit-v2/templates/blueprint-template.yaml
- [ ] T043 [US1] Create sample module blueprint in packages/module-kit-v2/examples/simple-module/blueprint.yaml
- [ ] T044 [US1] Add logging for blueprint validation errors in packages/module-kit-v2/src/schema/blueprint-validator.ts
- [ ] T045 [US1] Add support for conditional fields showIf evaluation in schema generation in packages/module-kit-v2/src/generators/prisma-generator.ts

**Checkpoint**: At this point, User Story 1 should be fully functional - developers can create a YAML Blueprint and generate code files

---

## Phase 4: User Story 2 - Dynamic Buttons-First Conversation Engine (Priority: P1)

**Goal**: Render module conversations dynamically from Blueprint fields at runtime—showing questions in order, preferring button selections over typing, validating inputs, handling optional fields with Skip buttons, and showing confirmation before saving

**Independent Test**: Can be tested by creating a module with various field types and verifying the bot shows appropriate button-based inputs instead of free text where applicable. Delivers a consistent, easy-to-use interface for all modules.

### Tests for User Story 2

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T046 [P] [US2] Test boolean field renders Yes/No buttons in packages/module-kit-v2/tests/renderers/boolean-renderer.test.ts
- [ ] T047 [P] [US2] Test date field renders date picker with quick buttons in packages/module-kit-v2/tests/renderers/date-renderer.test.ts
- [ ] T048 [P] [US2] Test select field renders inline keyboard buttons in packages/module-kit-v2/tests/renderers/select-renderer.test.ts
- [ ] T049 [P] [US2] Test optional field shows Skip button in packages/module-kit-v2/tests/conversation-engine.test.ts
- [ ] T050 [P] [US2] Test confirmation summary renders with Confirm/Edit/Cancel buttons in packages/module-kit-v2/tests/confirmation.test.ts
- [ ] T051 [P] [US2] Test field validation rejects invalid input in packages/module-kit-v2/tests/validators.test.ts
- [ ] T052 [US2] Integration test for full conversation flow in packages/module-kit-v2/tests/conversation-flow.integration.test.ts

### Implementation for User Story 2

- [ ] T053 [P] [US2] Create BooleanFieldRenderer in packages/module-kit-v2/src/runtime/renderers/boolean-field-renderer.ts with Yes/No buttons
- [ ] T054 [P] [US2] Create DateFieldRenderer in packages/module-kit-v2/src/runtime/renderers/date-field-renderer.ts with Year→Month→Day picker and Today/Tomorrow quick buttons
- [ ] T055 [P] [US2] Create SelectFieldRenderer in packages/module-kit-v2/src/runtime/renderers/select-field-renderer.ts with inline keyboard options
- [ ] T056 [P] [US2] Create TextFieldRenderer in packages/module-kit-v2/src/runtime/renderers/text-field-renderer.ts with inline keyboard for common values when applicable
- [ ] T057 [P] [US2] Create NumberFieldRenderer in packages/module-kit-v2/src/runtime/renderers/number-field-renderer.ts with quick-select common values
- [ ] T058 [P] [US2] Create MoneyFieldRenderer in packages/module-kit-v2/src/runtime/renderers/money-field-renderer.ts with quick-select amounts
- [ ] T059 [P] [US2] Create PhotoFieldRenderer in packages/module-kit-v2/src/runtime/renderers/photo-field-renderer.ts with photo upload button
- [ ] T060 [P] [US2] Create DocumentFieldRenderer in packages/module-kit-v2/src/runtime/renderers/document-field-renderer.ts with file upload button
- [ ] T061 [US2] Implement conversation engine to use field renderers based on field type in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T062 [US2] Implement required vs optional field handling with Skip button in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T063 [US2] Implement confirmation summary builder with Confirm/Edit/Cancel buttons in packages/module-kit-v2/src/runtime/confirmation-builder.ts
- [ ] T064 [US2] Integrate with existing V1 Module Kit save() function for persistence in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T065 [US2] Add field validation handling with retry logic in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T066 [US2] Add draft persistence using existing V1 module-kit persistence in packages/module-kit-v2/src/runtime/state-manager.ts
- [ ] T067 [US2] Add command interruption handling using existing V1 module-kit patterns in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T068 [US2] Add cancel handling for aborting conversations in packages/module-kit-v2/src/runtime/conversation-engine.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - developers can create Blueprints and users interact with button-first conversations

---

## Phase 5: User Story 3 - Relational Field Lookups with Search (Priority: P1)

**Goal**: Enable relation fields to automatically fetch records from related tables—showing buttons for small datasets, typeahead search for large datasets

**Independent Test**: Can be tested by creating a module with relation fields to both small and large datasets, verifying button display for small sets and typeahead for large sets. Delivers seamless navigation between related data.

### Tests for User Story 3

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T069 [P] [US3] Test relation field with < maxButtons records shows inline buttons in packages/module-kit-v2/tests/renderers/relation-renderer.test.ts
- [ ] T070 [P] [US3] Test relation field with > maxButtons records shows typeahead prompt in packages/module-kit-v2/tests/renderers/relation-renderer.test.ts
- [ ] T071 [P] [US3] Test typeahead search filters results in real-time in packages/module-kit-v2/tests/renderers/relation-renderer.test.ts
- [ ] T072 [P] [US3] Test relation field stores selected record correctly in packages/module-kit-v2/tests/conversation-engine.test.ts
- [ ] T073 [P] [US3] Test relation field with zero available records in packages/module-kit-v2/tests/renderers/relation-renderer.test.ts

### Implementation for User Story 3

- [ ] T074 [P] [US3] Create RelationFieldRenderer in packages/module-kit-v2/src/runtime/renderers/relation-field-renderer.ts
- [ ] T075 [US3] Implement record fetching from related Prisma model in packages/module-kit-v2/src/runtime/renderers/relation-field-renderer.ts
- [ ] T076 [US3] Implement maxButtons threshold check to decide between buttons vs typeahead in packages/module-kit-v2/src/runtime/renderers/relation-field-renderer.ts
- [ ] T077 [US3] Implement inline keyboard display for small record sets in packages/module-kit-v2/src/runtime/renderers/relation-field-renderer.ts
- [ ] T078 [US3] Implement typeahead search prompt for large record sets in packages/module-kit-v2/src/runtime/renderers/relation-field-renderer.ts
- [ ] T079 [US3] Implement real-time filtering based on user search input in packages/module-kit-v2/src/runtime/renderers/relation-field-renderer.ts
- [ ] T080 [US3] Handle zero records available case with appropriate message in packages/module-kit-v2/src/runtime/renderers/relation-field-renderer.ts
- [ ] T081 [US3] Add relation field type support to Prisma schema generator in packages/module-kit-v2/src/generators/prisma-generator.ts
- [ ] T082 [US3] Add relation field to Zod validator generator with ID validation in packages/module-kit-v2/src/generators/zod-generator.ts
- [ ] T083 [US3] Add relation field support to conversation engine for record ID storage in packages/module-kit-v2/src/runtime/conversation-engine.ts

**Checkpoint**: At this point, all P1 user stories (US1, US2, US3) should work independently

---

## Phase 6: User Story 4 - Generator Engine CLI (Priority: P1)

**Goal**: Provide `npm run module:generate <file.yaml>` command for automated code generation

**Independent Test**: Can be tested by running the CLI command with various Blueprint files and verifying the generated files match expectations. Delivers automated code generation, saving significant development time.

### Tests for User Story 4

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T084 [P] [US4] Test CLI generates all expected files for valid blueprint in packages/module-kit-v2/tests/cli/generate-cli.test.ts
- [ ] T085 [P] [US4] Test CLI generates hooks.ts skeleton for computed fields in packages/module-kit-v2/tests/cli/generate-cli.test.ts
- [ ] T086 [P] [US4] Test CLI preserves existing hooks.ts on re-generation in packages/module-kit-v2/tests/cli/generate-cli.test.ts
- [ ] T087 [P] [US4] Test CLI validates generated code passes ESLint in packages/module-kit-v2/tests/cli/generate-cli.test.ts
- [ ] T088 [P] [US4] Test CLI validates generated code passes TypeScript strict mode in packages/module-kit-v2/tests/cli/generate-cli.test.ts

### Implementation for User Story 4

- [ ] T089 [P] [US4] Create CLI entry point in packages/module-kit-v2/src/cli/index.ts
- [ ] T090 [P] [US4] Create generate command handler in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T091 [US4] Implement CLI argument parsing for blueprint file path in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T092 [US4] Implement blueprint validation in CLI pipeline in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T093 [US4] Implement output directory structure creation in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T094 [US4] Implement sequential file generation (Prisma, Zod, config, locales, tests) in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T095 [US4] Implement hooks.ts skeleton generation when computed fields or hooks defined in packages/module-kit-v2/src/generators/hooks-generator.ts
- [ ] T096 [US4] Implement hooks.ts preservation on re-generation in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T097 [US4] Add ESLint validation after generation in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T098 [US4] Add TypeScript strict mode validation after generation in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T099 [US4] Add CLI error messages for invalid blueprints in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T100 [US4] Add CLI success message with generated files list in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T101 [US4] Update root package.json with module:generate script in packages/module-kit-v2/../package.json
- [ ] T102 [US4] Update root package.json with module:validate script in packages/module-kit-v2/../package.json
- [ ] T103 [US4] Update root package.json with module:migrate script in packages/module-kit-v2/../package.json
- [ ] T104 [US4] Update root package.json with module:export script in packages/module-kit-v2/../package.json
- [ ] T105 [US4] Implement module:validate command handler in packages/module-kit-v2/src/cli/commands/validate.ts
- [ ] T106 [US4] Implement module:migrate command handler with re-generation and hooks preservation in packages/module-kit-v2/src/cli/commands/migrate.ts
- [ ] T107 [US4] Implement module:export command to export existing module as Blueprint YAML in packages/module-kit-v2/src/cli/commands/export.ts

**Checkpoint**: All P1 user stories complete - MVP is ready for testing and demonstration

---

## Phase 7: User Story 5 - Conditional Fields and Branching Paths (Priority: P2)

**Goal**: Enable fields to appear only when specific conditions are met (showIf), and support branching paths where different questions appear based on selections

**Independent Test**: Can be tested by creating a module with showIf conditions and branching paths, verifying that fields appear/disappear based on user selections. Delivers context-aware forms that adapt to user choices.

### Tests for User Story 5

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T108 [P] [US5] Test showIf condition hides field when not met in packages/module-kit-v2/tests/conditional-fields.test.ts
- [ ] T109 [P] [US5] Test showIf condition shows field when met in packages/module-kit-v2/tests/conditional-fields.test.ts
- [ ] T110 [P] [US5] Test branching path loads correct fields based on trigger value in packages/module-kit-v2/tests/branching-paths.test.ts
- [ ] T111 [P] [US5] Test shared fields before branches shown to all paths in packages/module-kit-v2/tests/branching-paths.test.ts
- [ ] T112 [P] [US5] Test shared fields after branches shown to all paths in packages/module-kit-v2/tests/branching-paths.test.ts
- [ ] T113 [US5] Integration test for branching path conversation flow in packages/module-kit-v2/tests/conversation-flow.integration.test.ts

### Implementation for User Story 5

- [ ] T114 [P] [US5] Create showIf condition evaluator in packages/module-kit-v2/src/runtime/evaluators/show-if-evaluator.ts
- [ ] T115 [US5] Implement equals comparison in showIf evaluator in packages/module-kit-v2/src/runtime/evaluators/show-if-evaluator.ts
- [ ] T116 [US5] Implement in comparison for multi-select in showIf evaluator in packages/module-kit-v2/src/runtime/evaluators/show-if-evaluator.ts
- [ ] T117 [US5] Update conversation engine to evaluate showIf conditions before each field in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T118 [US5] Update step manager to skip hidden fields in packages/module-kit-v2/src/runtime/step-manager.ts
- [ ] T119 [US5] Create branching path manager in packages/module-kit-v2/src/runtime/branching-manager.ts
- [ ] T120 [US5] Implement branch trigger detection in branching manager in packages/module-kit-v2/src/runtime/branching-manager.ts
- [ ] T121 [US5] Implement path field loading based on selected branch in packages/module-kit-v2/src/runtime/branching-manager.ts
- [ ] T122 [US5] Update conversation engine to integrate branching path manager in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T123 [US5] Add branch support to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T124 [US5] Add branch types to TypeScript definitions in packages/module-kit-v2/src/types/branch.ts
- [ ] T125 [US5] Create sample blueprint with branching paths in packages/module-kit-v2/examples/branching-module/blueprint.yaml

**Checkpoint**: User Story 5 complete - conditional fields and branching paths working

---

## Phase 8: User Story 6 - Full CRUD Interface (Priority: P2)

**Goal**: Provide complete interface for modules—list all records with pagination, view single record, edit fields, delete records, and search—all using button-based navigation

**Independent Test**: Can be tested by creating records, listing them, viewing details, editing fields, deleting records, and searching. Delivers complete data management capabilities for each module.

### Tests for User Story 6

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T126 [P] [US6] Test list view displays paginated records in packages/module-kit-v2/tests/crud/list-view.test.ts
- [ ] T127 [P] [US6] Test list view shows summary template per record in packages/module-kit-v2/tests/crud/list-view.test.ts
- [ ] T128 [P] [US6] Test view record displays all details in packages/module-kit-v2/tests/crud/view-record.test.ts
- [ ] T129 [P] [US6] Test edit flow shows current values as selectable buttons in packages/module-kit-v2/tests/crud/edit-flow.test.ts
- [ ] T130 [P] [US6] Test edit flow skips auto-generated fields in packages/module-kit-v2/tests/crud/edit-flow.test.ts
- [ ] T131 [P] [US6] Test delete flow shows confirmation before deletion in packages/module-kit-v2/tests/crud/delete-flow.test.ts
- [ ] T132 [P] [US6] Test search flow filters results correctly in packages/module-kit-v2/tests/crud/search-flow.test.ts
- [ ] T133 [US6] Integration test for full CRUD workflow in packages/module-kit-v2/tests/crud/crud.integration.test.ts

### Implementation for User Story 6

- [ ] T134 [P] [US6] Create list view renderer in packages/module-kit-v2/src/runtime/views/list-view.ts
- [ ] T135 [P] [US6] Create view record renderer in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T136 [P] [US6] Create edit flow handler in packages/module-kit-v2/src/runtime/flows/edit-flow.ts
- [ ] T137 [P] [US6] Create delete flow handler in packages/module-kit-v2/src/runtime/flows/delete-flow.ts
- [ ] T138 [P] [US6] Create search flow handler in packages/module-kit-v2/src/runtime/flows/search-flow.ts
- [ ] T139 [US6] Implement pagination in list view with pageSize configuration in packages/module-kit-v2/src/runtime/views/list-view.ts
- [ ] T140 [US6] Implement clickable record buttons in list view in packages/module-kit-v2/src/runtime/views/list-view.ts
- [ ] T141 [US6] Implement display.summary template rendering in list view in packages/module-kit-v2/src/runtime/views/list-view.ts
- [ ] T142 [US6] Implement full field display with i18n labels in view record in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T143 [US6] Implement photo/document inline display in view record in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T144 [US6] Implement action buttons (edit/delete/status) based on permissions in view record in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T145 [US6] Implement current values as selectable buttons in edit flow in packages/module-kit-v2/src/runtime/flows/edit-flow.ts
- [ ] T146 [US6] Implement auto-generated field exclusion (createdAt, recordNumber, computed) in edit flow in packages/module-kit-v2/src/runtime/flows/edit-flow.ts
- [ ] T147 [US6] Implement field renderer reuse in edit flow in packages/module-kit-v2/src/runtime/flows/edit-flow.ts
- [ ] T148 [US6] Implement delete confirmation with record summary in packages/module-kit-v2/src/runtime/flows/delete-flow.ts
- [ ] T149 [US6] Implement softDelete handling in delete flow in packages/module-kit-v2/src/runtime/flows/delete-flow.ts
- [ ] T150 [US6] Implement searchable fields as buttons in search flow in packages/module-kit-v2/src/runtime/flows/search-flow.ts
- [ ] T151 [US6] Implement relation typeahead input in search flow in packages/module-kit-v2/src/runtime/flows/search-flow.ts
- [ ] T152 [US6] Implement status button input in search flow in packages/module-kit-v2/src/runtime/flows/search-flow.ts
- [ ] T153 [US6] Implement date picker input in search flow in packages/module-kit-v2/src/runtime/flows/search-flow.ts
- [ ] T154 [US6] Implement search results using same list view in packages/module-kit-v2/src/runtime/flows/search-flow.ts
- [ ] T155 [US6] Add flows configuration support to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T156 [US6] Implement entry point action buttons based on permissions in packages/module-kit-v2/src/runtime/module-entry.ts
- [ ] T157 [US6] Implement sortBy and sortOrder configuration in list view in packages/module-kit-v2/src/runtime/views/list-view.ts
- [ ] T158 [US6] Implement searchable configuration in list view in packages/module-kit-v2/src/runtime/views/list-view.ts

**Checkpoint**: User Story 6 complete - full CRUD interface working

---

## Phase 9: User Story 7 - Computed Fields and Auto-Generated Data (Priority: P2)

**Goal**: Enable computed fields via lifecycle hooks, auto-generated metadata (createdAt, updatedAt, createdBy), and sequential record numbering

**Independent Test**: Can be tested by creating a module with computed fields and autoFields, verifying that values are calculated automatically and record numbering follows the pattern. Delivers automated data management and consistency.

### Tests for User Story 7

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T159 [P] [US7] Test autoFields populates createdAt, updatedAt, createdBy on create in packages/module-kit-v2/tests/auto-fields.test.ts
- [ ] T160 [P] [US7] Test autoFields updates updatedAt on update in packages/module-kit-v2/tests/auto-fields.test.ts
- [ ] T161 [P] [US7] Test recordPrefix generates sequential numbers (WDR-001, WDR-002) in packages/module-kit-v2/tests/auto-fields.test.ts
- [ ] T162 [P] [US7] Test computed field value calculated via hook in packages/module-kit-v2/tests/hooks.test.ts
- [ ] T163 [US7] Integration test for auto-fields and computed fields in packages/module-kit-v2/tests/auto-fields.integration.test.ts

### Implementation for User Story 7

- [ ] T164 [P] [US7] Create auto-fields manager in packages/module-kit-v2/src/runtime/auto-fields-manager.ts
- [ ] T165 [US7] Implement createdAt field auto-population on create in packages/module-kit-v2/src/runtime/auto-fields-manager.ts
- [ ] T166 [US7] Implement updatedAt field auto-population on create and update in packages/module-kit-v2/src/runtime/auto-fields-manager.ts
- [ ] T167 [US7] Implement createdBy field auto-population on create in packages/module-kit-v2/src/runtime/auto-fields-manager.ts
- [ ] T168 [US7] Implement updatedBy field auto-population on update in packages/module-kit-v2/src/runtime/auto-fields-manager.ts
- [ ] T169 [US7] Create record numbering service in packages/module-kit-v2/src/runtime/record-numbering.ts
- [ ] T170 [US7] Implement sequential numbering with recordPrefix pattern in packages/module-kit-v2/src/runtime/record-numbering.ts
- [ ] T171 [US7] Implement number conflict handling in record numbering service in packages/module-kit-v2/src/runtime/record-numbering.ts
- [ ] T172 [US7] Add autoFields and recordPrefix support to Prisma generator in packages/module-kit-v2/src/generators/prisma-generator.ts
- [ ] T173 [US7] Create computed field type in blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T174 [US7] Add computed field support to config generator in packages/module-kit-v2/src/generators/config-generator.ts
- [ ] T175 [US7] Create hooks skeleton with computed field function signature in packages/module-kit-v2/src/generators/hooks-generator.ts
- [ ] T176 [US7] Implement beforeSave hook execution in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T177 [US7] Implement afterSave hook execution in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T178 [US7] Implement computed field calculation in afterSave hook in packages/module-kit-v2/src/runtime/hooks-executor.ts
- [ ] T179 [US7] Add autoFields and recordPrefix configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T180 [US7] Create sample blueprint with auto-fields in packages/module-kit-v2/examples/auto-fields-module/blueprint.yaml
- [ ] T181 [US7] Create sample blueprint with computed fields in packages/module-kit-v2/examples/computed-fields-module/blueprint.yaml

**Checkpoint**: User Story 7 complete - computed fields and auto-generated data working

---

## Phase 10: User Story 8 - Module and Record Lifecycle States (Priority: P2)

**Goal**: Enable module lifecycle states (DRAFT, ACTIVE, DISABLED, DEPRECATED, ARCHIVED) and record status workflows with notifications

**Independent Test**: Can be tested by changing module lifecycle states and verifying visibility/behavior changes. For record status, testing includes status transitions and notifications. Delivers controlled module management and approval workflows.

### Tests for User Story 8

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T182 [P] [US8] Test DRAFT module not visible to regular users in packages/module-kit-v2/tests/lifecycle/module-lifecycle.test.ts
- [ ] T183 [P] [US8] Test DISABLED module blocks new data entries in packages/module-kit-v2/tests/lifecycle/module-lifecycle.test.ts
- [ ] T184 [P] [US8] Test DEPRECATED module is read-only in packages/module-kit-v2/tests/lifecycle/module-lifecycle.test.ts
- [ ] T185 [P] [US8] Test ARCHIVED module blocks new data entries in packages/module-kit-v2/tests/lifecycle/module-lifecycle.test.ts
- [ ] T186 [P] [US8] Test record status workflow transitions correctly in packages/module-kit-v2/tests/lifecycle/record-status.test.ts
- [ ] T187 [P] [US8] Test status change notifications sent to configured roles in packages/module-kit-v2/tests/lifecycle/notifications.test.ts
- [ ] T188 [P] [US8] Test status changes audit-logged correctly in packages/module-kit-v2/tests/lifecycle/audit.test.ts
- [ ] T188 [US8] Integration test for module and record lifecycle in packages/module-kit-v2/tests/lifecycle/integration.test.ts

### Implementation for User Story 8

- [ ] T189 [P] [US8] Create module lifecycle state enum in packages/module-kit-v2/src/types/lifecycle.ts
- [ ] T190 [P] [US8] Create module lifecycle manager in packages/module-kit-v2/src/runtime/module-lifecycle-manager.ts
- [ ] T191 [US8] Implement DRAFT state visibility filtering in blueprint loader in packages/module-kit-v2/src/runtime/blueprint-loader.ts
- [ ] T192 [US8] Implement DISABLED state creation blocking in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T193 [US8] Implement DEPRECATED state read-only enforcement in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T194 [US8] Implement ARCHIVED state creation blocking in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T195 [US8] Create record status workflow manager in packages/module-kit-v2/src/runtime/status-workflow-manager.ts
- [ ] T196 [US8] Implement statusFlow definition in blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T197 [US8] Implement defaultStatus handling in status workflow manager in packages/module-kit-v2/src/runtime/status-workflow-manager.ts
- [ ] T198 [US8] Implement valid transition validation in status workflow manager in packages/module-kit-v2/src/runtime/status-workflow-manager.ts
- [ ] T199 [US8] Add status field to generated Prisma schemas when hasStatus is true in packages/module-kit-v2/src/generators/prisma-generator.ts
- [ ] T200 [US8] Create status action buttons renderer in packages/module-kit-v2/src/runtime/renderers/status-action-renderer.ts
- [ ] T201 [US8] Implement status actions in view record for users with approve permission in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T202 [US8] Create notification service for status changes in packages/module-kit-v2/src/runtime/notification-service.ts
- [ ] T203 [US8] Implement notification rules per status transition in packages/module-kit-v2/src/runtime/notification-service.ts
- [ ] T204 [US8] Implement role-based notification filtering in packages/module-kit-v2/src/runtime/notification-service.ts
- [ ] T205 [US8] Implement audit logging for status changes in packages/module-kit-v2/src/runtime/status-workflow-manager.ts
- [ ] T206 [US8] Add notificationRules configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T207 [US8] Add hasStatus, statusFlow, defaultStatus configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T208 [US8] Add approve permission to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T209 [US8] Create sample blueprint with status workflow in packages/module-kit-v2/examples/status-workflow-module/blueprint.yaml

**Checkpoint**: User Story 8 complete - module and record lifecycle states working

---

## Phase 11: User Story 12 - Field Groups and Step-Based Wizards (Priority: P2)

**Goal**: Organize long forms into logical step groups for better mobile UX on Telegram

**Independent Test**: Can be tested by creating a module with multiple step groups, verifying that the conversation progresses through steps sequentially. Delivers organized, digestible data entry flows.

### Tests for User Story 12

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T210 [P] [US12] Test conversation shows first step fields only on start in packages/module-kit-v2/tests/steps/step-groups.test.ts
- [ ] T211 [P] [US12] Test conversation shows next step fields after completing previous in packages/module-kit-v2/tests/steps/step-groups.test.ts
- [ ] T212 [P] [US12] Test step progress indicator shown (Step 2 of 3) in packages/module-kit-v2/tests/steps/step-groups.test.ts
- [ ] T213 [P] [US12] Test back navigation allows editing previous steps in packages/module-kit-v2/tests/steps/step-groups.test.ts
- [ ] T214 [P] [US12] Test forward navigation preserves updated values in packages/module-kit-v2/tests/steps/step-groups.test.ts
- [ ] T215 [US12] Integration test for step-based wizard flow in packages/module-kit-v2/tests/steps/wizard.integration.test.ts

### Implementation for User Story 12

- [ ] T216 [P] [US12] Create step group type in blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T217 [US12] Create step wizard manager in packages/module-kit-v2/src/runtime/step-wizard-manager.ts
- [ ] T218 [US12] Implement step field grouping in blueprint parser in packages/module-kit-v2/src/schema/blueprint-parser.ts
- [ ] T219 [US12] Implement step progress tracking in step wizard manager in packages/module-kit-v2/src/runtime/step-wizard-manager.ts
- [ ] T220 [US12] Implement step progress indicator rendering in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T221 [US12] Implement next step navigation in step wizard manager in packages/module-kit-v2/src/runtime/step-wizard-manager.ts
- [ ] T222 [US12] Implement back navigation to previous steps in step wizard manager in packages/module-kit-v2/src/runtime/step-wizard-manager.ts
- [ ] T223 [US12] Implement value preservation across step navigation in step wizard manager in packages/module-kit-v2/src/runtime/step-wizard-manager.ts
- [ ] T224 [US12] Add steps/groups configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T225 [US12] Create sample blueprint with step groups in packages/module-kit-v2/examples/step-groups-module/blueprint.yaml

**Checkpoint**: User Story 12 complete - field groups and step-based wizards working

---

## Phase 12: User Story 9 - Interactive CLI Builder (Priority: P3)

**Goal**: Build a Blueprint interactively in the terminal using selections at every step, with AI suggesting field types, validators, and related tables

**Independent Test**: Can be tested by running `npm run module:generate --interactive` and navigating through the wizard, verifying a valid Blueprint is produced. Delivers a guided Blueprint creation experience.

### Tests for User Story 9

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T226 [P] [US9] Test interactive builder starts with selections for field types in packages/module-kit-v2/tests/cli/interactive-builder.test.ts
- [ ] T227 [P] [US9] Test AI suggestions shown with emoji icon in packages/module-kit-v2/tests/cli/interactive-builder.test.ts
- [ ] T228 [P] [US9] Test AI suggestions not auto-selected, require user confirmation in packages/module-kit-v2/tests/cli/interactive-builder.test.ts
- [ ] T229 [US9] Integration test for complete interactive builder workflow in packages/module-kit-v2/tests/cli/interactive-builder.integration.test.ts

### Implementation for User Story 9

- [ ] T230 [P] [US9] Create interactive CLI builder in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T231 [US9] Implement section selection step using inquirer in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T232 [US9] Implement template selection step using inquirer in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T233 [US9] Implement field type selection step using inquirer in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T234 [US9] Implement required/optional selection using inquirer in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T235 [US9] Implement validator selection using inquirer in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T236 [US9] Implement relation target selection using inquirer in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T237 [US9] Create AI suggestion service in packages/module-kit-v2/src/cli/ai-suggestion-service.ts
- [ ] T238 [US9] Implement AI field type suggestion based on field name in packages/module-kit-v2/src/cli/ai-suggestion-service.ts
- [ ] T239 [US9] Implement AI validator suggestion based on field type and name in packages/module-kit-v2/src/cli/ai-suggestion-service.ts
- [ ] T240 [US9] Implement AI relation target suggestion based on existing models in packages/module-kit-v2/src/cli/ai-suggestion-service.ts
- [ ] T241 [US9] Implement emoji icon display for AI suggestions in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T242 [US9] Implement manual selection required (no auto-select) for AI suggestions in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T243 [US9] Add --interactive flag to generate CLI command in packages/module-kit-v2/src/cli/commands/generate.ts
- [ ] T244 [US9] Implement YAML output generation from builder in packages/module-kit-v2/src/cli/interactive-builder.ts
- [ ] T245 [US9] Integrate with AI Assistant service when available in packages/module-kit-v2/src/cli/ai-suggestion-service.ts

**Checkpoint**: User Story 9 complete - interactive CLI builder working

---

## Phase 13: User Story 10 - Telegram Module Builder (Priority: P3)

**Goal**: Enable SUPER_ADMIN to create new modules directly from Telegram by either describing the module in Arabic (AI generates Blueprint) or building step-by-step with button selections

**Independent Test**: Can be tested by using `/module:create` command in Telegram as a SUPER_ADMIN, verifying both AI and manual creation modes produce valid Blueprints. Delivers remote module creation capability.

### Tests for User Story 10

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T246 [P] [US10] Test /module:create shows three creation modes (AI, Template, Manual) in packages/module-kit-v2/tests/telegram/builder.test.ts
- [ ] T247 [P] [US10] Test AI mode generates Blueprint from Arabic description in packages/module-kit-v2/tests/telegram/builder.test.ts
- [ ] T248 [P] [US10] Test Manual mode builds Blueprint using button selections in packages/module-kit-v2/tests/telegram/builder.test.ts
- [ ] T249 [P] [US10] Test SUPER_ADMIN approval required before generation in packages/module-kit-v2/tests/telegram/builder.test.ts
- [ ] T250 [P] [US10] Test Blueprint saved to modules/<slug>/blueprint.yaml in packages/module-kit-v2/tests/telegram/builder.test.ts
- [ ] T251 [US10] Integration test for Telegram module builder workflow in packages/module-kit-v2/tests/telegram/builder.integration.test.ts

### Implementation for User Story 10

- [ ] T252 [P] [US10] Create /module:create command handler in packages/module-kit-v2/src/telegram/commands/module-create.ts
- [ ] T253 [US10] Implement SUPER_ADMIN role verification in packages/module-kit-v2/src/telegram/commands/module-create.ts
- [ ] T254 [US10] Implement creation mode selection (AI, Template, Manual) in packages/module-kit-v2/src/telegram/flows/builder-flow.ts
- [ ] T255 [US10] Implement AI mode conversation handler in packages/module-kit-v2/src/telegram/modes/ai-mode.ts
- [ ] T256 [US10] Implement Template mode conversation handler in packages/module-kit-v2/src/telegram/modes/template-mode.ts
- [ ] T257 [US10] Implement Manual mode conversation handler in packages/module-kit-v2/src/telegram/modes/manual-mode.ts
- [ ] T258 [US10] Reuse FieldRenderer logic for Manual mode in packages/module-kit-v2/src/telegram/modes/manual-mode.ts
- [ ] T259 [US10] Integrate AI suggestion service for AI mode in packages/module-kit-v2/src/telegram/modes/ai-mode.ts
- [ ] T260 [US10] Implement Blueprint review screen before generation in packages/module-kit-v2/src/telegram/flows/builder-flow.ts
- [ ] T261 [US10] Implement SUPER_ADMIN approval confirmation in packages/module-kit-v2/src/telegram/flows/builder-flow.ts
- [ ] T262 [US10] Implement Blueprint save to modules/<slug>/blueprint.yaml in packages/module-kit-v2/src/telegram/flows/builder-flow.ts
- [ ] T263 [US10] Implement generator execution after approval in packages/module-kit-v2/src/telegram/flows/builder-flow.ts
- [ ] T264 [US10] Add /module:create command to bot command registration in packages/core/src/commands/index.ts

**Checkpoint**: User Story 10 complete - Telegram module builder working

---

## Phase 14: User Story 11 - Lifecycle Hooks Extension (Priority: P3)

**Goal**: Enable optional lifecycle hooks (beforeSave, afterSave, onStepValidate, beforeDelete, afterDelete, onApproval, onRejection, onView) for custom logic

**Independent Test**: Can be tested by creating a module with hooks defined, verifying hooks execute at the correct times and modify behavior as expected. Delivers extensibility for custom business logic.

### Tests for User Story 11

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T265 [P] [US11] Test beforeSave hook executes before save operation in packages/module-kit-v2/tests/hooks/lifecycle-hooks.test.ts
- [ ] T266 [P] [US11] Test afterSave hook executes after save completes in packages/module-kit-v2/tests/hooks/lifecycle-hooks.test.ts
- [ ] T267 [P] [US11] Test hook error aborts operation and shows error message in packages/module-kit-v2/tests/hooks/lifecycle-hooks.test.ts
- [ ] T268 [P] [US11] Test onView hook modifies display output in packages/module-kit-v2/tests/hooks/lifecycle-hooks.test.ts
- [ ] T269 [P] [US11] Test onStepValidate hook validates after field input in packages/module-kit-v2/tests/hooks/lifecycle-hooks.test.ts
- [ ] T270 [P] [US11] Test beforeDelete/afterDelete hooks execute on delete in packages/module-kit-v2/tests/hooks/lifecycle-hooks.test.ts
- [ ] T271 [US11] Test onApproval/onRejection hooks execute on status change in packages/module-kit-v2/tests/hooks/lifecycle-hooks.test.ts
- [ ] T272 [US11] Integration test for all lifecycle hooks in packages/module-kit-v2/tests/hooks/hooks.integration.test.ts

### Implementation for User Story 11

- [ ] T273 [P] [US11] Create lifecycle hooks interface in packages/module-kit-v2/src/types/hooks.ts
- [ ] T274 [US11] Create hooks executor in packages/module-kit-v2/src/runtime/hooks-executor.ts
- [ ] T275 [US11] Implement beforeSave hook execution in hooks executor in packages/module-kit-v2/src/runtime/hooks-executor.ts
- [ ] T276 [US11] Implement afterSave hook execution in hooks executor in packages/module-kit-v2/src/runtime/hooks-executor.ts
- [ ] T277 [US11] Implement onStepValidate hook execution in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T278 [US11] Implement beforeDelete hook execution in delete flow in packages/module-kit-v2/src/runtime/flows/delete-flow.ts
- [ ] T279 [US11] Implement afterDelete hook execution in delete flow in packages/module-kit-v2/src/runtime/flows/delete-flow.ts
- [ ] T280 [US11] Implement onApproval hook execution in status workflow manager in packages/module-kit-v2/src/runtime/status-workflow-manager.ts
- [ ] T281 [US11] Implement onRejection hook execution in status workflow manager in packages/module-kit-v2/src/runtime/status-workflow-manager.ts
- [ ] T282 [US11] Implement onView hook execution in view record renderer in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T283 [US11] Implement hook error handling with abort in hooks executor in packages/module-kit-v2/src/runtime/hooks-executor.ts
- [ ] T284 [US11] Implement hook error message display to user in conversation engine in packages/module-kit-v2/src/runtime/conversation-engine.ts
- [ ] T285 [US11] Add hooks configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T286 [US11] Update hooks skeleton generator with all hook signatures in packages/module-kit-v2/src/generators/hooks-generator.ts
- [ ] T287 [US11] Create sample blueprint with hooks in packages/module-kit-v2/examples/hooks-module/blueprint.yaml
- [ ] T288 [US11] Create sample hooks.ts implementation in packages/module-kit-v2/examples/hooks-module/hooks.ts

**Checkpoint**: User Story 11 complete - lifecycle hooks extension working

---

## Phase 15: User Story 13 - Export and Reporting (Priority: P3)

**Goal**: Enable users to export module data to Excel or PDF with configurable fields and headers

**Independent Test**: Can be tested by configuring export options and generating exports in both formats, verifying data integrity and formatting. Delivers data export capabilities.

### Tests for User Story 13

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T289 [P] [US13] Test export shows format selection (Excel, PDF) in packages/module-kit-v2/tests/export/export.test.ts
- [ ] T290 [P] [US13] Test Excel export contains configured fields with i18n headers in packages/module-kit-v2/tests/export/excel-export.test.ts
- [ ] T291 [P] [US13] Test PDF export is properly formatted for reading/printing in packages/module-kit-v2/tests/export/pdf-export.test.ts
- [ ] T292 [P] [US13] Test export respects field configuration in packages/module-kit-v2/tests/export/export.test.ts
- [ ] T293 [US13] Integration test for export workflow in packages/module-kit-v2/tests/export/export.integration.test.ts

### Implementation for User Story 13

- [ ] T294 [P] [US13] Create export service in packages/module-kit-v2/src/runtime/export-service.ts
- [ ] T295 [US13] Create Excel exporter using ExcelJS in packages/module-kit-v2/src/runtime/exporters/excel-exporter.ts
- [ ] T296 [US13] Create PDF exporter using PDFKit in packages/module-kit-v2/src/runtime/exporters/pdf-exporter.ts
- [ ] T297 [US13] Implement export format selection conversation in export service in packages/module-kit-v2/src/runtime/export-service.ts
- [ ] T298 [US13] Implement Excel export with configured fields in packages/module-kit-v2/src/runtime/exporters/excel-exporter.ts
- [ ] T299 [US13] Implement i18n header resolution in Excel exporter in packages/module-kit-v2/src/runtime/exporters/excel-exporter.ts
- [ ] T300 [US13] Implement PDF export with formatted output in packages/module-kit-v2/src/runtime/exporters/pdf-exporter.ts
- [ ] T301 [US13] Implement i18n header resolution in PDF exporter in packages/module-kit-v2/src/runtime/exporters/pdf-exporter.ts
- [ ] T302 [US13] Add export configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T303 [US13] Implement export permission check in export service in packages/module-kit-v2/src/runtime/export-service.ts
- [ ] T304 [US13] Implement export file delivery via Telegram in export service in packages/module-kit-v2/src/runtime/export-service.ts
- [ ] T305 [US13] Add export button to view record for users with export permission in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T306 [US13] Create sample blueprint with export configuration in packages/module-kit-v2/examples/export-module/blueprint.yaml

**Checkpoint**: User Story 13 complete - export and reporting working

---

## Phase 16: Additional Platform Features

**Purpose**: Implement remaining functional requirements not covered by user stories

### Module Discovery and Loading

- [ ] T307 [P] Implement module auto-discovery scanning modules/*/blueprint.yaml on startup in packages/module-kit-v2/src/runtime/blueprint-loader.ts
- [ ] T308 [P] Implement DRAFT module exclusion from production loading in packages/module-kit-v2/src/runtime/blueprint-loader.ts
- [ ] T309 [P] Implement module lifecycle status as built-in filter in packages/module-kit-v2/src/runtime/blueprint-loader.ts
- [ ] T310 [P] Implement module dependency validation (requires array) on startup in packages/module-kit-v2/src/runtime/blueprint-loader.ts
- [ ] T311 Implement warning for required module not loaded in packages/module-kit-v2/src/runtime/blueprint-loader.ts

### Additional Generator Features

- [ ] T312 [P] Implement uniqueConstraint in Prisma generator for duplicate prevention in packages/module-kit-v2/src/generators/prisma-generator.ts
- [ ] T313 [P] Implement softDelete setting in Prisma generator for deletedAt field in packages/module-kit-v2/src/generators/prisma-generator.ts
- [ ] T314 [P] Implement uniqueConstraint support in Zod validator generator in packages/module-kit-v2/src/generators/zod-generator.ts
- [ ] T315 [P] Implement requires array in blueprint schema for module dependencies in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T316 [P] Implement uniqueConstraint configuration in blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T317 [P] Implement softDelete configuration in blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T318 [P] Implement hint property in field type for i18n placeholder in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T319 [P] Implement default property in field type for default values in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T320 [P] Implement visibleTo property in field type for role-based visibility in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T321 [P] Implement maxButtons in relation field type in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T322 [P] Implement searchMode typeahead in relation field type in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T323 [P] Implement maxSizeMB and allowedTypes in document field type in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T324 Implement display configuration (listFields, sortBy, sortOrder, searchable, summary) in blueprint schema in packages/module-kit-v2/src/types/blueprint.ts

### Additional Validation Features

- [ ] T325 [P] Implement cross-validation rule evaluation in beforeSave hook in packages/module-kit-v2/src/runtime/hooks-executor.ts
- [ ] T326 [P] Implement cross-validation query expressions in packages/module-kit-v2/src/runtime/evaluators/cross-validation-evaluator.ts
- [ ] T327 [P] Implement aggregate functions (SUM, COUNT, MAX, MIN) with WHERE filters in cross-validation evaluator in packages/module-kit-v2/src/runtime/evaluators/cross-validation-evaluator.ts
- [ ] T328 Implement crossValidation configuration in blueprint schema in packages/module-kit-v2/src/types/blueprint.ts

### Custom Actions

- [ ] T329 [P] Create custom action renderer in packages/module-kit-v2/src/runtime/renderers/custom-action-renderer.ts
- [ ] T330 [P] Implement custom action button display in view record in packages/module-kit-v2/src/runtime/views/view-record.ts
- [ ] T331 Implement RBAC filtering for custom action buttons in packages/module-kit-v2/src/runtime/renderers/custom-action-renderer.ts
- [ ] T332 Implement showWhen condition evaluation for custom actions in packages/module-kit-v2/src/runtime/renderers/custom-action-renderer.ts
- [ ] T333 Add actions configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T334 Create sample blueprint with custom actions in packages/module-kit-v2/examples/custom-actions-module/blueprint.yaml

### Dashboard Widget

- [ ] T335 [P] Create dashboard widget service in packages/module-kit-v2/src/runtime/dashboard-widget-service.ts
- [ ] T336 Implement query-based summary metrics (counts/sums) in dashboard widget service in packages/module-kit-v2/src/runtime/dashboard-widget-service.ts
- [ ] T337 Add dashboard.widget configuration to blueprint schema in packages/module-kit-v2/src/types/blueprint.ts

### Module Versioning and Migration

- [ ] T338 [P] Implement version field in blueprint schema using Semantic Versioning in packages/module-kit-v2/src/types/blueprint.ts
- [ ] T339 [P] Implement module:migrate auto-increment logic based on change type in packages/module-kit-v2/src/cli/commands/migrate.ts
- [ ] T340 [P] Implement breaking change detection for Major version increment in packages/module-kit-v2/src/cli/commands/migrate.ts
- [ ] T341 [P] Implement additive change detection for Minor version increment in packages/module-kit-v2/src/cli/commands/migrate.ts
- [ ] T342 [P] Implement cosmetic change detection for Patch version increment in packages/module-kit-v2/src/cli/commands/migrate.ts
- [ ] T343 Implement CHANGELOG.md generation for module version history in packages/module-kit-v2/src/generators/changelog-generator.ts
- [ ] T344 Implement Prisma migration script generation for breaking changes in packages/module-kit-v2/src/generators/migration-generator.ts
- [ ] T345 Implement migration workflow aligning with existing Prisma process in packages/module-kit-v2/src/cli/commands/migrate.ts

### Blueprint Templates

- [ ] T346 [P] Create Employee Profile blueprint template in packages/module-kit-v2/templates/blueprints/employee-profile.yaml
- [ ] T347 [P] Create Leave Request blueprint template in packages/module-kit-v2/templates/blueprints/leave-request.yaml
- [ ] T348 [P] Create Expense/Advance blueprint template in packages/module-kit-v2/templates/blueprints/expense.yaml
- [ ] T349 [P] Create Inventory Item blueprint template in packages/module-kit-v2/templates/blueprints/inventory-item.yaml
- [ ] T350 [P] Create Purchase Order blueprint template in packages/module-kit-v2/templates/blueprints/purchase-order.yaml

**Checkpoint**: All additional platform features implemented

---

## Phase 17: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T351 [P] Update CLAUDE.md with Module Kit V2 usage instructions in docs/developer/CLAUDE.md
- [ ] T352 [P] Create developer guide for Blueprint schema in docs/developer/blueprint-schema.md
- [ ] T353 [P] Create developer guide for Field Types in docs/developer/field-types.md
- [ ] T354 [P] Create developer guide for Lifecycle Hooks in docs/developer/lifecycle-hooks.md
- [ ] T355 [P] Create developer guide for Custom Actions in docs/developer/custom-actions.md
- [ ] T356 [P] Create migration guide from Module Kit V1 to V2 in docs/developer/v1-to-v2-migration.md
- [ ] T357 [P] Create API reference for Module Kit V2 in docs/developer/module-kit-v2-api.md
- [ ] T358 [P] Update module development guide with V2 capabilities in docs/developer/module-development-guide.md
- [ ] T359 Update project roadmap with Module Kit V2 status in docs/project/roadmap.md
- [ ] T360 Add comprehensive JSDoc comments to all public APIs in packages/module-kit-v2/src/
- [ ] T361 Add error handling for all edge cases listed in spec (circular dependencies, zero relation records, concurrent numbering conflicts, etc.) in packages/module-kit-v2/src/
- [ ] T362 Performance optimization for very large result sets in list views in packages/module-kit-v2/src/runtime/views/list-view.ts
- [ ] T363 Security review of generated code for SQL injection, XSS, and other vulnerabilities
- [ ] T364 Run ESLint on entire module-kit-v2 package in packages/module-kit-v2/
- [ ] T365 Run TypeScript strict mode validation on entire module-kit-v2 package in packages/module-kit-v2/
- [ ] T366 Create integration test suite covering all user stories in packages/module-kit-v2/tests/integration/
- [ ] T367 Update README with Module Kit V2 overview and quickstart in packages/module-kit-v2/README.md
- [ ] T368 Verify all generated code passes ESLint and TypeScript strict mode validation
- [ ] T369 Verify V1 modules continue to work without modifications
- [ ] T370 Test all example blueprints generate correctly
- [ ] T371 Validate all core blueprint templates generate working modules
- [ ] T372 Run quickstart.md validation if exists

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-15)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Additional Platform Features (Phase 16)**: Depends on relevant user stories being complete
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1 but should be independently testable
- **User Story 3 (P1)**: Can start after Foundational (Phase 2) - May integrate with US1/US2 but should be independently testable
- **User Story 4 (P1)**: Can start after Foundational (Phase 2) - Depends on US1 for blueprint format
- **User Story 5 (P2)**: Can start after Foundational (Phase 2) - Depends on US2 for conversation engine
- **User Story 6 (P2)**: Can start after US2 complete - Depends on conversation engine
- **User Story 7 (P2)**: Can start after US4 complete - Depends on generator engine
- **User Story 8 (P2)**: Can start after US2, US4 complete - Depends on conversation engine and generator
- **User Story 9 (P3)**: Can start after US4 complete - Depends on generator engine
- **User Story 10 (P3)**: Can start after US2, US4, US9 complete - Depends on conversation engine, generator, and interactive builder
- **User Story 11 (P3)**: Can start after US4 complete - Depends on generator engine
- **User Story 12 (P2)**: Can start after US2 complete - Depends on conversation engine
- **User Story 13 (P3)**: Can start after US6 complete - Depends on CRUD interface

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, P1 user stories (US1-US4) can start in parallel
- All tests for a user story marked [P] can run in parallel
- Renderers within stories can run in parallel (e.g., US2, US3)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 2 (Buttons-First Conversation Engine)

```bash
# Launch all field renderers for User Story 2 together:
Task: "Create BooleanFieldRenderer in packages/module-kit-v2/src/runtime/renderers/boolean-field-renderer.ts"
Task: "Create DateFieldRenderer in packages/module-kit-v2/src/runtime/renderers/date-field-renderer.ts"
Task: "Create SelectFieldRenderer in packages/module-kit-v2/src/runtime/renderers/select-field-renderer.ts"
Task: "Create TextFieldRenderer in packages/module-kit-v2/src/runtime/renderers/text-field-renderer.ts"
Task: "Create NumberFieldRenderer in packages/module-kit-v2/src/runtime/renderers/number-field-renderer.ts"
Task: "Create MoneyFieldRenderer in packages/module-kit-v2/src/runtime/renderers/money-field-renderer.ts"
Task: "Create PhotoFieldRenderer in packages/module-kit-v2/src/runtime/renderers/photo-field-renderer.ts"
Task: "Create DocumentFieldRenderer in packages/module-kit-v2/src/runtime/renderers/document-field-renderer.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add P2 stories (US5, US6, US7, US8, US12) sequentially
7. Add P3 stories (US9, US10, US11, US13) sequentially
8. Add Additional Platform Features
9. Polish and cross-cutting concerns
10. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 (Blueprint-Driven Module Creation)
   - Developer B: User Story 2 (Buttons-First Conversation Engine)
   - Developer C: User Story 3 (Relational Field Lookups)
   - Developer D: User Story 4 (Generator Engine CLI)
3. After P1 stories complete:
   - Developer A: User Story 5 (Conditional Fields) + User Story 9 (Interactive CLI)
   - Developer B: User Story 6 (Full CRUD) + User Story 12 (Step Groups)
   - Developer C: User Story 7 (Computed Fields) + User Story 11 (Lifecycle Hooks)
   - Developer D: User Story 8 (Lifecycle States) + User Story 13 (Export)
4. Final phase: Developer A, B: User Story 10 (Telegram Builder), Developer C, D: Additional Features
5. All: Polish and documentation

---

## Task Summary

| User Story | Priority | Task Count | Test Count | Implementation Count |
|------------|----------|------------|------------|----------------------|
| US1 - Blueprint-Driven Module Creation | P1 | 9 tests + 10 impl = 19 | 9 | 10 |
| US2 - Buttons-First Conversation Engine | P2 (P1*) | 7 tests + 13 impl = 20 | 7 | 13 |
| US3 - Relational Field Lookups | P1 | 5 tests + 10 impl = 15 | 5 | 10 |
| US4 - Generator Engine CLI | P1 | 5 tests + 18 impl = 23 | 5 | 18 |
| US5 - Conditional Fields and Branching | P2 | 6 tests + 12 impl = 18 | 6 | 12 |
| US6 - Full CRUD Interface | P2 | 8 tests + 25 impl = 33 | 8 | 25 |
| US7 - Computed Fields | P2 | 5 tests + 19 impl = 24 | 5 | 19 |
| US8 - Module and Record Lifecycle | P2 | 8 tests + 22 impl = 30 | 8 | 22 |
| US9 - Interactive CLI Builder | P3 | 4 tests + 16 impl = 20 | 4 | 16 |
| US10 - Telegram Module Builder | P3 | 6 tests + 13 impl = 19 | 6 | 13 |
| US11 - Lifecycle Hooks | P3 | 8 tests + 16 impl = 24 | 8 | 16 |
| US12 - Field Groups and Step Wizards | P2 | 6 tests + 10 impl = 16 | 6 | 10 |
| US13 - Export and Reporting | P3 | 5 tests + 13 impl = 18 | 5 | 13 |
| Additional Features | - | 0 tests + 36 impl = 36 | 0 | 36 |
| Setup | - | 0 tests + 9 impl = 9 | 0 | 9 |
| Foundational | - | 0 tests + 16 impl = 16 | 0 | 16 |
| Polish | - | 0 tests + 22 impl = 22 | 0 | 22 |

**Total**: 76 tests + 295 implementations = **371 tasks**

**Total tasks per phase**:
- Phase 1 (Setup): 9 tasks
- Phase 2 (Foundational): 16 tasks
- Phase 3-15 (User Stories): 279 tasks (76 tests + 203 implementations)
- Phase 16 (Additional Features): 36 tasks
- Phase 17 (Polish): 22 tasks

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- **MVP = Phase 1 + Phase 2 + Phase 3 (US1 only) = 25 tasks**
- **P1 Complete = MVP + US2 + US3 + US4 = 25 + 77 = 102 tasks**
- **P2 Complete = P1 + US5 + US6 + US7 + US8 + US12 = 102 + 121 = 223 tasks**
- **Full V2 Release = P2 + US9 + US10 + US11 + US13 + Additional + Polish = 223 + 97 + 36 + 22 = 378 tasks**
