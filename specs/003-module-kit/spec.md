# Feature Specification: Module Kit (Layer 2)

**Feature Branch**: `003-module-kit`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Module Kit replaces the previously planned Flow Engine..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer scaffolds a new module (Priority: P1)

Developers need a quick, error-free way to create standard module scaffolding so they can immediately begin writing grammY conversation logic without worrying about boilerplate and file placement.

**Why this priority**: Scaffolding is the entry point for all module creation. Without it, developers must manually create structures, increasing error risk and violating consistency.

**Independent Test**: Can be independently tested by running `npm run module:create {slug}` and verifying the resulting folder structure, files, and Prisma schema copying.

**Acceptance Scenarios**:

1. **Given** a developer is in the terminal, **When** they run `npm run module:create fuel-entry` and answer interactive prompts (Arabic name, English name, icon, etc.), **Then** the CLI generates the correct folder structure (`modules/fuel-entry/`), populates `config.ts`, conversations, schemas, and locale files, and copies the schema to the central Prisma folder.
2. **Given** an invalid slug format or an existing folder, **When** they attempt to create the module, **Then** the CLI rejects the operation with a clear validation error.

---

### User Story 2 - User interacts with a module (Data Collection & Validation) (Priority: P1)

End users need a guided, conversational interface to provide data, with immediate validation and the ability to correct mistakes, ensuring high-quality data entry.

**Why this priority**: Core value of the system relies on correct data entry through the Telegram bot.

**Independent Test**: Can be fully tested by creating a dummy module and running a user through a data collection flow using the `validate()` and `confirm()` helpers.

**Acceptance Scenarios**:

1. **Given** a user is in an active module conversation, **When** the bot asks a question via `validate()` and the user provides invalid input, **Then** the bot replies with an error message using `errorKey` and retries up to `maxRetries` times.
2. **Given** the bot has collected all required data, **When** `confirm()` is called, **Then** the bot displays a summary of all answers with inline edit buttons for editable fields.
3. **Given** a summary is displayed, **When** the user clicks an edit button for a specific field, **Then** the bot re-asks only that specific question, validates the new answer, and returns the user to the updated summary.

---

### User Story 3 - Draft Auto-Save and Recovery (Priority: P2)

Users who get interrupted during a flow need their progress saved automatically so they don't have to restart lengthy data entry processes.

**Why this priority**: Improves user experience and completion rates for long data entry forms, but the core functionality works without it.

**Independent Test**: Can be tested by starting a module flow, answering some questions, closing the bot or sending `/cancel`, and then re-entering the module to see the resume prompt.

**Acceptance Scenarios**:

1. **Given** a user is halfway through a module conversation, **When** they send a new input, **Then** the `draft middleware` automatically saves the conversation state to Redis.
2. **Given** a user previously abandoned a module conversation within the TTL (default 24h), **When** they restart that same module, **Then** the bot asks if they want to resume the draft or start fresh.
3. **Given** a user restarts and chooses to resume, **Then** the conversation restores precisely to the last unanswered question.

---

### User Story 4 - Automatic Saving, Audit, and Notifications (Priority: P1)

System administrators and managers need guaranteed visibility into all data changes, while developers need to ensure data is saved securely without writing manual notification or audit code.

**Why this priority**: Mandatory for security, auditing, and organizational awareness (constitutional requirement).

**Independent Test**: Can be tested by completing a module's confirm step, triggering the `save()` helper, and verifying the database, audit log, and sent Telegram notifications.

**Acceptance Scenarios**:

1. **Given** a user confirms their data submission, **When** the developer invokes the `save()` helper, **Then** the data is saved to the database, an audit log entry is automatically created, and notifications containing all saved data are sent to authorized ADMINs and SUPER_ADMINs.
2. **Given** a user attempts to edit or delete existing data, **When** `save()` is used for update/delete operations, **Then** the same automatic logging and notifications occur without opt-out capability.

---

### User Story 5 - Module Visibility and Access Control (Priority: P1)

Users must only see and access modules they have explicit permission to use, ensuring security and a clean, relevant user interface.

**Why this priority**: Critical for security and data privacy.

**Independent Test**: Can be tested by defining a module with specific permissions and logging in as different user roles to verify menu visibility.

**Acceptance Scenarios**:

1. **Given** a module is defined with `ADMIN` scope requirements, **When** a `VISITOR` or `EMPLOYEE` views the bot menu, **Then** the module is completely hidden.
2. **Given** an `ADMIN` views the menu, **When** they have AdminScope for the module's section, **Then** the module is visible and accessible.
3. **Given** a `SUPER_ADMIN` views the menu, **Then** all registered modules are visible and accessible regardless of specific scopes.

### Edge Cases

- What happens when a user exceeds `maxRetries` in the `validate()` loop? (Expected: operation cancels, draft cleared, user notified).
- How does the system handle concurrent edits to the same draft from multiple devices? (Expected: last-write-wins based on Redis state).
- What happens when an ADMIN's permissions are revoked while they have an active draft for a restricted module? (Expected: resuming draft fails with an unauthorized error).
- How are locale keys handled if a module is loaded but the corresponding `ar.ftl` or `en.ftl` files are missing or incomplete? (Expected: fallback to the translation key itself or a defined default language).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `defineModule()` utility that registers module identity, permissions, and conversation entry points for the Module Loader.
- **FR-002**: System MUST enforce strict visibility rules: modules outside a user's permission scope are entirely hidden from menus.
- **FR-003**: System MUST provide a `validate()` helper supporting configurable prompts, validation functions, error messages, and retry limits.
- **FR-004**: System MUST provide a `confirm()` helper that displays a summary of collected data and allows targeted re-entry for specific, editable fields.
- **FR-005**: System MUST provide a `save()` helper that persists data to the database.
- **FR-006**: System MUST automatically generate an audit log entry on every invocation of `save()`.
- **FR-007**: System MUST automatically send notifications containing the saved data to all authorized ADMINs and SUPER_ADMINs on every invocation of `save()`.
- **FR-008**: System MUST provide draft middleware that automatically saves conversation state to Redis after each user input.
- **FR-009**: System MUST prompt users to resume or start fresh if an active draft exists when entering a module.
- **FR-010**: System MUST enforce i18n rules where all module text uses keys prefixed with the module slug and are loaded from module-specific `.ftl` files.
- **FR-011**: System MUST provide a CLI tool `npm run module:create` to scaffold the standard module file structure interactively.
- **FR-012**: System MUST provide a CLI tool `npm run module:remove` to delete a module's code and schema files (without dropping database tables).
- **FR-013**: System MUST provide a CLI tool `npm run module:list` to display all discovered modules and their statuses.

### Key Entities

- **Module Definition**: Represents the configuration of a module (`config.ts`), containing its slug, permissions, and linked conversation handlers.
- **Draft**: A temporary state object stored in Redis, uniquely identified by `draft:{userId}:{moduleSlug}`, tracking the user's progress through a conversation.
- **Module File Structure**: The standard layout expected for each module, including config, conversations, Prisma schema, and locale files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can scaffold a fully working (empty) module via the CLI in under 1 minute.
- **SC-002**: 100% of data operations (create/update/delete) performed via the Module Kit automatically generate audit logs and notifications without developer intervention.
- **SC-003**: Users are completely unable to view or access modules outside their assigned permission scope (0% unauthorized access rate).
- **SC-004**: Conversation drafts are reliably restored, resulting in a measurable decrease in abandoned data entry flows.
- **SC-005**: The entire Module Kit implementation requires zero changes to the underlying platform core (Layer 1).
