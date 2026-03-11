# Feature Specification: Module Kit V2 — Schema-Driven App Factory

**Feature Branch**: `008-schema-driven-modules`
**Created**: 2026-03-11
**Status**: Draft
**Input**: Feature 008: Module Kit V2 — Schema-Driven App Factory

## Overview

Transform the Module Kit from a scaffolding and conversation-helpers toolkit into a Schema-Driven App Factory. Developers define modules entirely through declarative YAML Blueprints. A Generator Engine automatically produces database schemas, validators, Telegram conversation flows, and internationalization files. Zero-Code is the default—custom code (hooks) is the exception.

**Core UX Principle — Buttons-First**: The conversation engine must prefer inline keyboard buttons over free text input in every scenario where a finite set of values exists. Free text is the last resort, not the default.

## Dependencies

- This feature MUST be implemented AFTER Phase 4 (AI Assistant / 002-ai-assistant) is complete
- Builds on top of existing Module Kit V1 API (validate, confirm, save)
- V1 modules continue to work unchanged—migration is optional and progressive

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Blueprint-Driven Module Creation (Priority: P1)

As a developer, I want to define a module entirely via a YAML Blueprint file so that I can create fully working modules without writing conversation code manually.

**Why this priority**: This is the foundation of the Schema-Driven approach. Without the ability to define modules via Blueprints, none of the other features (generator, conversation engine, etc.) can function. This represents the core value proposition of Module Kit V2.

**Independent Test**: Can be tested by creating a simple YAML Blueprint with basic fields and verifying the generator produces the expected output files. Delivers the ability to create a working module without writing any conversation code.

**Acceptance Scenarios**:

1. **Given** a valid YAML Blueprint file exists, **When** the generator runs, **Then** it produces schema.prisma, validators.ts, config.ts, locale files, and test files
2. **Given** a Blueprint with invalid structure, **When** the generator runs, **Then** it fails with clear error messages indicating the validation issue
3. **Given** a Blueprint with conditional fields (showIf), **When** the generator runs, **Then** it generates a conversation engine that correctly evaluates these conditions at runtime

---

### User Story 2 - Dynamic Buttons-First Conversation Engine (Priority: P1)

As a user interacting with the bot, I want the module conversation to be rendered dynamically from the Blueprint fields at runtime—showing questions in order, preferring button selections over typing, validating inputs, handling optional fields with Skip buttons, and showing confirmation before saving.

**Why this priority**: This defines the user experience of all modules created with V2. The Buttons-First principle is critical for mobile Telegram UX and reduces user errors. Without this, modules would have poor usability.

**Independent Test**: Can be tested by creating a module with various field types and verifying the bot shows appropriate button-based inputs instead of free text where applicable. Delivers a consistent, easy-to-use interface for all modules.

**Acceptance Scenarios**:

1. **Given** a module with boolean fields, **When** the user interacts with it, **Then** Yes/No buttons are shown instead of text input
2. **Given** a module with date fields, **When** the user interacts with it, **Then** date picker buttons (Year→Month→Day) and quick buttons (Today, Tomorrow) are shown
3. **Given** a module with select fields, **When** the user interacts with it, **Then** inline keyboard buttons with all options are shown
4. **Given** a module with optional fields, **When** the user interacts with it, **Then** a Skip button is shown for each optional field
5. **Given** a user has entered all required data, **When** they proceed, **Then** a confirmation summary with Confirm/Edit/Cancel buttons is shown

---

### User Story 3 - Relational Field Lookups with Search (Priority: P1)

As a user, when a field is of type `relation`, I want the bot to automatically fetch records from the related table. If there are few records, show them as buttons. If there are many records, let me type to search (typeahead mode).

**Why this priority**: Relational fields are essential for real-world business modules. This ensures users can select related records easily, whether there are 5 or 5000 options. Without this, complex business modules would be unusable.

**Independent Test**: Can be tested by creating a module with relation fields to both small and large datasets, verifying button display for small sets and typeahead for large sets. Delivers seamless navigation between related data.

**Acceptance Scenarios**:

1. **Given** a relation field with fewer than maxButtons records, **When** the user interacts with it, **Then** inline buttons with all record names are shown
2. **Given** a relation field with more than maxButtons records, **When** the user interacts with it, **Then** the system prompts for search input and shows filtered results
3. **Given** a user searches in a typeahead relation field, **When** they type, **Then** matching records are displayed in real-time as buttons
4. **Given** a user selects a record from relation field options, **When** confirmed, **Then** the relation is stored correctly

---

### User Story 4 - Generator Engine CLI (Priority: P1)

As a developer, I want to run `npm run module:generate <file.yaml>` so that the system auto-generates: schema.prisma, validators.ts, config.ts, locales/ar.ftl, locales/en.ftl, and skeleton tests.

**Why this priority**: The CLI is the primary interface for developers to create modules. Without a working generator, developers cannot use the Blueprint approach. This is the tooling that makes zero-code module creation possible.

**Independent Test**: Can be tested by running the CLI command with various Blueprint files and verifying the generated files match expectations. Delivers automated code generation, saving significant development time.

**Acceptance Scenarios**:

1. **Given** a valid Blueprint file, **When** running `npm run module:generate <file.yaml>`, **Then** all expected files are generated in the correct locations
2. **Given** a Blueprint with computed fields or hooks, **When** generating, **Then** a hooks.ts skeleton file is produced
3. **Given** an existing module with custom hooks.ts, **When** re-generating, **Then** the custom hooks.ts file is preserved
4. **Given** generation completes, **When** the output is reviewed, **Then** all generated code passes ESLint and TypeScript strict mode checks

---

### User Story 5 - Conditional Fields and Branching Paths (Priority: P2)

As a user, I want certain fields to appear only when specific conditions are met (e.g., medical report field appears only when leave type is "sick"). When I select options like "in-kind advance" vs "cash advance", I want subsequent questions to change entirely based on my selection.

**Why this priority**: Conditional logic is essential for real-world business modules. Different scenarios require different data. This prevents user confusion by only showing relevant fields. Without this, all fields would be visible regardless of context.

**Independent Test**: Can be tested by creating a module with showIf conditions and branching paths, verifying that fields appear/disappear based on user selections. Delivers context-aware forms that adapt to user choices.

**Acceptance Scenarios**:

1. **Given** a field with showIf condition, **When** the condition is not met, **Then** the field is hidden and skipped
2. **Given** a field with showIf condition, **When** the condition becomes met, **Then** the field appears in the conversation
3. **Given** a Blueprint with branching paths, **When** the user selects a branch trigger value, **Then** only that branch's fields are shown
4. **Given** shared fields before and after branches, **When** the user navigates, **Then** all users see the shared fields regardless of branch choice

---

### User Story 6 - Full CRUD Interface (Priority: P2)

As a user, I want the module to provide a complete interface: list all records with pagination, view a single record with all details, edit specific fields of an existing record, delete records with confirmation, and search by various criteria—all using button-based navigation.

**Why this priority**: Create-only modules are limited. Full CRUD capabilities are necessary for production business modules. Users need to view, edit, delete, and search their data. Without this, modules would be data silos.

**Independent Test**: Can be tested by creating records, listing them, viewing details, editing fields, deleting records, and searching. Delivers complete data management capabilities for each module.

**Acceptance Scenarios**:

1. **Given** a user has list permission, **When** they access the module, **Then** they see a paginated list of records
2. **Given** a record in the list, **When** the user taps it, **Then** they see the full record view with all details
3. **Given** a user has edit permission and is viewing a record, **When** they tap Edit, **Then** they see current values as selectable buttons to change
4. **Given** a user has delete permission, **When** they initiate deletion, **Then** a confirmation with record summary is shown before deletion
5. **Given** a user searches, **When** they enter criteria, **Then** filtered results are displayed using the same list view with pagination

---

### User Story 7 - Computed Fields and Auto-Generated Data (Priority: P2)

As a developer, I want to define fields as `computed` so they are auto-generated via lifecycle hooks. I also want auto-generated metadata (createdAt, updatedAt, createdBy) and sequential record numbering (WDR-001, WDR-002) without manual configuration per field.

**Why this priority**: Many business fields are derived from other data. Computed fields reduce manual data entry and ensure consistency. Auto-generated metadata and numbering are standard requirements for business records.

**Independent Test**: Can be tested by creating a module with computed fields and autoFields, verifying that values are calculated automatically and record numbering follows the pattern. Delivers automated data management and consistency.

**Acceptance Scenarios**:

1. **Given** autoFields is true, **When** a record is created, **Then** createdAt, updatedAt, and createdBy are populated automatically
2. **Given** a record is updated, **When** the save occurs, **Then** updatedAt is updated automatically
3. **Given** recordPrefix is set, **When** records are created, **Then** they are numbered sequentially (WDR-001, WDR-002, etc.)
4. **Given** a computed field definition, **When** the record is saved, **Then** the computed value is calculated via the specified hook

---

### User Story 8 - Module and Record Lifecycle States (Priority: P2)

As an admin, I want modules to have lifecycle states (DRAFT, ACTIVE, DISABLED, DEPRECATED, ARCHIVED). I also want individual records to support configurable status workflows (e.g., PENDING → APPROVED → REJECTED) with notifications on status changes.

**Why this priority**: Module lifecycle states allow for controlled rollout and deprecation. Record status workflows are essential for approval processes in business contexts. Without this, there's no way to manage module visibility or approval flows.

**Independent Test**: Can be tested by changing module lifecycle states and verifying visibility/behavior changes. For record status, testing includes status transitions and notifications. Delivers controlled module management and approval workflows.

**Acceptance Scenarios**:

1. **Given** a module is in DRAFT state, **When** a regular user attempts to access it, **Then** the module is not visible
2. **Given** a module is DISABLED or ARCHIVED, **When** a user attempts to create records, **Then** the creation is blocked
3. **Given** a module is DEPRECATED, **When** a user accesses it, **Then** they can view existing data but cannot create new entries
4. **Given** a record status workflow is defined, **When** a status change occurs, **Then** notifications are sent to configured roles
5. **Given** a status transition occurs, **When** logged, **Then** the audit log records who made the change and when

---

### User Story 9 - Interactive CLI Builder (Priority: P3)

As a developer, I want to build a Blueprint interactively in the terminal using selections/choices at every step (not typing), with AI suggesting field types, validators, and related tables—so I can create a complete YAML Blueprint without writing YAML manually.

**Why this priority**: Not all developers prefer writing YAML. An interactive builder lowers the barrier to entry. AI suggestions help users make better design choices. This is a convenience feature for developers.

**Independent Test**: Can be tested by running `npm run module:generate --interactive` and navigating through the wizard, verifying a valid Blueprint is produced. Delivers a guided Blueprint creation experience.

**Acceptance Scenarios**:

1. **Given** the interactive builder is started, **When** prompted for field type, **Then** all supported field types are shown as selectable options
2. **Given** the interactive builder is running, **When** AI is available, **Then** suggestions are shown with 🤖 icon as recommendations only
3. **Given** the user completes all wizard steps, **When** finished, **Then** a valid YAML Blueprint file is generated
4. **Given** AI suggests a field type, **When** shown, **Then** the suggestion is not auto-selected—the user must confirm

---

### User Story 10 - Telegram Module Builder (Priority: P3)

As a SUPER_ADMIN, I want to create new modules directly from Telegram by either describing the module in Arabic (AI generates the Blueprint) or building step-by-step with button selections—without needing terminal access.

**Why this priority**: Some admins may not have direct server access. Telegram-based creation allows module creation from anywhere. This is especially useful for on-site admins or those managing multiple deployments.

**Independent Test**: Can be tested by using `/module:create` command in Telegram as a SUPER_ADMIN, verifying both AI and manual creation modes produce valid Blueprints. Delivers remote module creation capability.

**Acceptance Scenarios**:

1. **Given** a SUPER_ADMIN user, **When** they send `/module:create`, **Then** they see three creation modes: AI, Template, Manual
2. **Given** AI creation mode is selected, **When** they describe the module in Arabic, **Then** AI generates a Blueprint YAML
3. **Given** Manual mode is selected, **When** the user navigates step-by-step, **Then** they build the Blueprint using button selections
4. **Given** Blueprint generation is complete, **When** the SUPER_ADMIN reviews, **Then** they must approve before the Generator runs
5. **Given** the Blueprint is approved, **When** generation completes, **Then** the Blueprint is saved to `modules/<slug>/blueprint.yaml`

---

### User Story 11 - Lifecycle Hooks Extension (Priority: P3)

As a developer, I want optional lifecycle hooks (beforeSave, afterSave, onStepValidate, beforeDelete, afterDelete, onApproval, onRejection, onView) so I can extend module behavior with custom logic when the Blueprint alone is insufficient.

**Why this priority**: No declarative system can cover all edge cases. Hooks allow customization without modifying the core engine. This ensures Module Kit V2 remains flexible for complex business requirements.

**Independent Test**: Can be tested by creating a module with hooks defined, verifying hooks execute at the correct times and modify behavior as expected. Delivers extensibility for custom business logic.

**Acceptance Scenarios**:

1. **Given** a beforeSave hook is defined, **When** a record is saved, **Then** the hook executes before the save operation
2. **Given** an afterSave hook is defined, **When** a record is saved, **Then** the hook executes after the save completes
3. **Given** a hook returns an error, **When** the operation is attempted, **Then** the operation is aborted and the error message is shown to the user
4. **Given** onView hook is defined, **When** a user views a record, **Then** the hook can modify what is displayed

---

### User Story 12 - Field Groups and Step-Based Wizards (Priority: P2)

As a user, I want long forms to be organized into logical step groups (e.g., "Personal Info", "Financial Info") for better mobile UX on Telegram.

**Why this priority**: Long forms on mobile are overwhelming. Step-based wizards break complex data entry into manageable chunks. This improves completion rates and user experience.

**Independent Test**: Can be tested by creating a module with multiple step groups, verifying that the conversation progresses through steps sequentially. Delivers organized, digestible data entry flows.

**Acceptance Scenarios**:

1. **Given** a module with step groups, **When** the user starts the conversation, **Then** they see the first step's fields only
2. **Given** a user completes a step, **When** they proceed, **Then** the next step's fields are shown
3. **Given** step progress, **When** the user is on step 2 of 3, **Then** the interface indicates their current progress
4. **Given** a user navigates back, **When** they edit a previous step, **Then** they can proceed forward with updated values

---

### User Story 13 - Export and Reporting (Priority: P3)

As a user, I want to export module data to Excel or PDF with configurable fields and headers for reporting purposes.

**Why this priority**: Business users often need to export data for reporting, auditing, or sharing with stakeholders. Built-in export eliminates the need for manual data extraction.

**Independent Test**: Can be tested by configuring export options and generating exports in both formats, verifying data integrity and formatting. Delivers data export capabilities.

**Acceptance Scenarios**:

1. **Given** export is configured for a module, **When** a user with permission requests export, **Then** they can choose between Excel and PDF formats
2. **Given** Excel export is selected, **When** generated, **Then** the file contains configured fields with i18n headers
3. **Given** PDF export is selected, **When** generated, **Then** the file is properly formatted for reading/printing

---

### Edge Cases

- What happens when a Blueprint references a non-existent related module?
- How does the system handle circular dependencies in module requirements?
- What happens when a relation field has zero records available?
- How does the conversation engine handle user input interruptions (other bot commands)?
- What happens when the generator encounters Blueprint validation errors mid-generation?
- How does the system handle concurrent record numbering conflicts?
- What happens when a user's permissions change during an active conversation?
- How does the system handle very large result sets in list views (thousands of records)?
- What happens when a computed field's hook throws an error?
- How does the system handle Blueprint version changes during active module usage?

## Requirements *(mandatory)*

### Functional Requirements

#### Blueprint Specification
- **FR-001**: Blueprint files MUST be in YAML format
- **FR-002**: Blueprint MUST define module metadata: slug, sectionSlug, name, nameEn, icon
- **FR-003**: Blueprint MUST define permissions: view, create, edit, delete, approve (optional)
- **FR-004**: Blueprint MUST define fields with: name, type, label (i18n key), errorKey, required
- **FR-005**: Supported field types: text, number, money, date, boolean, select, multiSelect, photo, document, file, relation, computed (12 types)
- **FR-006**: Fields MAY have built-in validators: positive, min, max, egyptianPhone, egyptianNationalId, afterField, beforeField, regex, unique
- **FR-007**: Fields MAY have conditional display via showIf (field + equals/in)
- **FR-008**: Fields MAY be organized into steps (groups) with group name and label
- **FR-009**: Blueprint MAY define display configuration: listFields, sortBy, sortOrder, searchable, summary template
- **FR-010**: Blueprint MAY define lifecycle hooks referencing functions in hooks.ts
- **FR-011**: Fields MAY have a `hint` property (i18n key for placeholder text shown to user)
- **FR-012**: Fields MAY have a `default` property (e.g., `today` for dates, or fixed values)
- **FR-013**: Fields MAY have a `visibleTo` property for role-based field visibility
- **FR-014**: Relation fields MUST support `searchMode: typeahead` and `maxButtons` for large datasets
- **FR-015**: Document fields MUST support `maxSizeMB` and `allowedTypes` for file validation

#### Module-Level Automation
- **FR-016**: Blueprint MAY define `autoFields: true` to auto-add createdAt, updatedAt, createdBy, updatedBy fields
- **FR-017**: Blueprint MAY define `recordPrefix` for auto-numbering (e.g., "WDR" → WDR-001, WDR-002)
- **FR-018**: Blueprint MAY define `softDelete: true` to use deletedAt instead of hard delete
- **FR-019**: Blueprint MAY define `hasStatus: true` with `statusFlow` array and `defaultStatus`
- **FR-020**: Blueprint MAY define `uniqueConstraint` as array of fields for duplicate prevention
- **FR-021**: Blueprint MAY define `requires` as array of module slugs this module depends on
- **FR-022**: Module dependencies MUST be validated at startup—warn if required module is not loaded

#### Notification Rules
- **FR-023**: Blueprint MAY define notification rules for onCreate, onStatusChange, onDelete events
- **FR-024**: Notification rules MUST specify which roles receive notifications for each event
- **FR-025**: onStatusChange notifications MUST be configurable per status transition

#### Export Configuration
- **FR-026**: Blueprint MAY define export configuration: enabled, formats (excel/pdf), fields, headers (i18n keys)
- **FR-027**: Export MUST use existing ExcelJS and PDFKit infrastructure
- **FR-028**: Export field headers MUST be i18n keys (not hardcoded text)

#### Generator Engine
- **FR-029**: Generator MUST read a YAML Blueprint and produce schema.prisma with correct Prisma types, relations, indexes, and auto-fields
- **FR-030**: Generator MUST produce Zod validation schema matching field definitions
- **FR-031**: Generator MUST produce config.ts with defineModule() call using Blueprint metadata
- **FR-032**: Generator MUST produce ar.ftl and en.ftl with placeholder i18n keys for all labels, errors, hints, export headers, and notification messages
- **FR-033**: Generator MUST produce skeleton test file with module contract tests
- **FR-034**: Generator MUST produce hooks.ts skeleton only when computed fields or hooks are defined
- **FR-035**: Generator MUST validate Blueprint against JSON Schema before generation
- **FR-036**: Generator MUST NOT overwrite existing custom files (hooks.ts) on re-generation

#### Conversation Engine (Runtime) — Buttons-First
- **FR-037**: Engine MUST read Blueprint fields at runtime and render appropriate Telegram UI per field type
- **FR-038**: Engine MUST support all V1 Module Kit features: draft persistence, command interruption, cancel handling
- **FR-039**: Engine MUST handle required vs optional fields (Skip button for optional)
- **FR-040**: Engine MUST handle relation fields by querying the target Prisma model—show inline buttons for small datasets, switch to typeahead for large datasets based on maxButtons threshold
- **FR-041**: Engine MUST evaluate showIf conditions and skip hidden fields
- **FR-042**: Engine MUST execute onStepValidate hooks after each field
- **FR-043**: Engine MUST build confirmation summary automatically with Confirm / Edit / Cancel buttons
- **FR-044**: Engine MUST execute beforeSave/afterSave hooks
- **FR-045**: Engine MUST use existing save() function for database persistence
- **FR-046**: Engine MUST prefer inline keyboard buttons over free text for ALL field types where possible (Buttons-First principle)
- **FR-047**: DateRenderer MUST offer date picker buttons (Year→Month→Day) and quick buttons (Today, Tomorrow)
- **FR-048**: NumberRenderer/MoneyRenderer SHOULD offer quick-select common values alongside manual input

#### Module Discovery and Loading
- **FR-049**: System MUST auto-discover modules by scanning `modules/*/blueprint.yaml` on startup
- **FR-050**: DRAFT modules MUST be automatically excluded from production loading—no separate allowlist needed
- **FR-051**: Module lifecycle status field serves as the built-in filter for which modules are active

#### Module Lifecycle
- **FR-052**: Modules MUST have a lifecycle status: DRAFT, ACTIVE, DISABLED, DEPRECATED, ARCHIVED
- **FR-053**: DRAFT modules MUST NOT be visible to regular users
- **FR-054**: DISABLED and ARCHIVED modules MUST NOT accept new data entries
- **FR-055**: DEPRECATED modules MUST be read-only (view existing data only)

#### Record Status Workflow
- **FR-056**: When hasStatus is true, records MUST have a status field following the defined statusFlow
- **FR-057**: Status transitions MUST trigger notifications per notification rules
- **FR-058**: Status changes MUST be audit-logged

#### CLI Commands
- **FR-059**: `npm run module:generate <file.yaml>` — generate module from Blueprint
- **FR-060**: `npm run module:validate <slug>` — validate module compliance against contract rules
- **FR-061**: `npm run module:migrate <slug>` — re-generate after Blueprint changes (preserve hooks.ts)
- **FR-062**: `npm run module:export <slug>` — export existing module as Blueprint YAML

#### Blueprint Templates
- **FR-067**: Platform MUST ship with 5 core Blueprint templates: Employee Profile, Leave Request, Expense/Advance, Inventory Item, Purchase Order
- **FR-068**: Templates MUST demonstrate key Blueprint patterns: relations, conditionals, branching, approval workflows, and cross-validation
- **FR-069**: Additional templates may be added in future releases post-V2.0

#### Branching Paths
- **FR-063**: Blueprint MAY define `branches` with a `trigger` field and multiple `paths`, each containing a `when` value and its own `fields` array
- **FR-064**: Fields before `branches` are shared (all paths see them). Fields after `branches` are also shared.
- **FR-065**: StepManager MUST load only the fields of the selected branch path
- **FR-066**: Each branch path's fields follow the same rules as top-level fields (validators, showIf, etc.)

#### Interactive CLI Builder
- **FR-067**: `npm run module:generate --interactive` MUST launch a selections-first CLI wizard using Inquirer.js
- **FR-068**: CLI MUST present selections (not free text) for: section, template, field type, required/optional, validators, relation targets
- **FR-069**: CLI MUST integrate with AI Assistant (when available) to suggest field types based on field name, relevant Prisma models for relations, and suitable validators—shown with 🤖 icon as recommendations only (not auto-selected)

#### CRUD Flows
- **FR-070**: Blueprint MAY define `flows` config: list, view, edit, delete, search, statusActions (all default to true)
- **FR-071**: Module entry point MUST show action buttons based on user permissions (create → +, view → /)
- **FR-072**: List View MUST display records using `display.summary` template with pagination (default pageSize: 5)
- **FR-073**: Each record in List View MUST be a clickable button that opens View
- **FR-074**: View Record MUST display all fields with i18n labels and show action buttons (edit/delete/status) based on permissions
- **FR-075**: View MUST display photo/document fields inline when available
- **FR-076**: Edit Flow MUST show current field values as selectable buttons—user taps a field to change it
- **FR-077**: Edit Flow MUST NOT show auto-generated fields (createdAt, recordNumber, computed fields)
- **FR-078**: Edit Flow MUST reuse the same FieldRenderers and validators from Create flow
- **FR-079**: Delete Flow MUST show confirmation with record summary before deletion
- **FR-080**: Delete Flow MUST respect `softDelete` setting (archive vs permanent delete)
- **FR-081**: Search Flow MUST present searchable fields as buttons, using appropriate input for each type (relation → typeahead, status → buttons, date → picker)
- **FR-082**: Search results MUST be displayed using the same List View with pagination
- **FR-083**: Status Actions MUST appear in View for users with `approve` permission when record status is in a non-terminal state

#### Telegram Builder
- **FR-084**: `/module:create` command MUST be available to SUPER_ADMIN role only
- **FR-085**: Telegram Builder MUST offer 3 creation modes: AI (natural language), Template selection, Manual (step-by-step buttons)
- **FR-086**: Telegram Builder MUST reuse the same FieldRenderer logic and AI suggestions as CLI
- **FR-087**: After Blueprint generation, SUPER_ADMIN MUST review and approve before Generator runs
- **FR-088**: Generated Blueprint MUST be saved to `modules/<slug>/blueprint.yaml`

#### Blueprint Migration Strategy
- **FR-091**: When a Blueprint has breaking changes (Major version increment), Generator MUST automatically generate a Prisma migration script
- **FR-092**: Generated migration script MUST be reviewed and manually applied by developer—no automatic migration execution
- **FR-093**: Migration workflow aligns with existing Prisma migration process in the project

#### Module Versioning
- **FR-094**: Blueprint MUST include a `version` field using Semantic Versioning (Major.Minor.Patch)
- **FR-095**: `module:migrate` MUST auto-increment the version based on change type (breaking=Major, additive=Minor, cosmetic=Patch)
- **FR-096**: Generator MUST produce a `CHANGELOG.md` in the module directory tracking version history

#### Cross-Record Validation
- **FR-097**: Blueprint MAY define `crossValidation` rules with query expressions spanning multiple records
- **FR-098**: Cross-validation rules MUST be evaluated in beforeSave—if failed, show error and allow edit or cancel
- **FR-099**: Cross-validation MUST support aggregate functions: SUM, COUNT, MAX, MIN with WHERE filters

#### Custom Actions
- **FR-100**: Blueprint MAY define `actions` array with custom buttons shown in View Record screen
- **FR-101**: Each action MUST have: name, label (i18n), icon, handler (hooks.ts reference), roles, optional showWhen condition
- **FR-102**: Custom action buttons MUST respect RBAC and appear only for authorized roles

#### Dashboard Widget
- **FR-103**: Blueprint MAY define `dashboard.widget` with summary metrics (query-based counts/sums) for the admin dashboard

### Key Entities

- **Blueprint**: Declarative YAML definition containing module metadata, field definitions, permissions, and configuration. Represents a complete module definition without code.
- **Field**: Individual data field within a Blueprint with type, validators, display properties, and conditional logic.
- **ModuleRuntime**: Runtime representation of a module loaded from its Blueprint, handling conversation flow, data persistence, and UI rendering.
- **ModuleState**: Tracks module lifecycle status (DRAFT, ACTIVE, DISABLED, DEPRECATED, ARCHIVED) and visibility rules.
- **RecordData**: Data instance created by a module, following the Blueprint schema with optional status workflow and auto-generated metadata.
- **Relation**: Connection between modules allowing reference to records in other modules with typeahead search capability.
- **LifecycleHook**: Custom code extension point allowing developers to inject logic at specific points in the module lifecycle.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can create a fully functional module using only a YAML Blueprint in under 5 minutes
- **SC-002**: Generator produces complete, working code (schema, validators, config, locales, tests) from any valid Blueprint in under 5 seconds
- **SC-003**: Users can complete data entry for a module with 10 fields in under 2 minutes using button-first navigation
- **SC-004**: 90% of module interactions use button inputs rather than free text, reducing user input errors by 50%
- **SC-005**: Existing V1 modules continue to work without any modifications or migration required
- **SC-006**: New developers can create their first working module within 30 minutes of onboarding using provided templates
- **SC-007**: Modules with relation fields support both button selection (under threshold) and typeahead search (over threshold) seamlessly
- **SC-008**: Conditional fields (showIf) are evaluated correctly in 100% of scenarios, showing/hiding fields as expected
- **SC-009**: All generated code passes ESLint and TypeScript strict mode validation without manual intervention
- **SC-010**: Module lifecycle states properly control visibility and access—DRAFT modules invisible to regular users, DISABLED/ARCHIVED modules block creation
- **SC-011**: Record status workflows correctly trigger notifications for configured roles on every status transition
- **SC-012**: Full CRUD operations (Create, Read, Update, Delete) work for all generated modules with proper permission enforcement
- **SC-013**: Re-generation of modules preserves custom hooks.ts files and manual customizations

## Assumptions

- Users have basic familiarity with YAML syntax for Blueprint editing (mitigated by interactive builder and templates)
- The platform has access to file storage for document/photo uploads
- The AI Assistant (002-ai-assistant) will be available before V2 implementation starts
- The Prisma schema and PostgreSQL database are available for generated modules
- Telegram bot infrastructure and existing module kit API remain stable
- Existing ExcelJS and PDFKit infrastructure is available for export functionality
- All internationalization follows the slug-prefix convention for i18n keys
