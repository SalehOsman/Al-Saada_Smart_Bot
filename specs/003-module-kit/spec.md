# Feature Specification: Module Kit (Layer 2)

**Feature Branch**: `003-module-kit`  
**Created**: 2026-03-01  
**Status**: Draft  
**Input**: User description: "Module Kit replaces the previously planned Flow Engine..."

## Clarifications

### Session 2026-03-03
- Q: If Redis becomes unavailable during an active module conversation, how should the system handle draft saving and recovery? → A: Continue without saving; warn user that interruption will lose progress
- Q: When save() encounters a database write error, what specific user notification should be displayed, and should a retry mechanism be provided? → A: "Save failed" with "Retry" button, maximum 1 automatic retry attempt. If retry fails, inform user data is preserved as draft (i18n key: module-kit-save-failed-persistent) for later retry. Do NOT loop retries indefinitely.
- Q: If a user doesn't respond to a module conversation prompt for an extended period, what timeout behavior should the system apply? → A: Timeout after 15 minutes of inactivity; release conversation handler, keep draft preserved in Redis. User receives "Resume/Start Fresh" prompt upon return via i18n key module-kit-conversation-timeout.
- Q: Can a user have multiple active module conversations running simultaneously? → A: No; one active conversation per user at a time. Starting a new module while another is active preserves the current draft in Redis (same as /cancel behavior). User gets "Resume/Start Fresh" prompt when returning to previous module. Multiple drafts across different modules are allowed in Redis simultaneously; restriction applies only to active conversation handlers.
- Q: What should confirm() display when invoked with an empty or partially collected data object? → A: confirm() MUST throw a developer-facing error (not user-facing message) if data object is empty or has zero fields. Error: "confirm() called with empty data object — ensure validate() is called before confirm()". This is a programming error caught during development/testing. No i18n key needed — developer guard only.

### Session 2026-03-01
- Q: How should the module-specific Prisma schema be integrated during scaffolding? → A: Use Prisma Multi-File Schema (`prismaSchemaFolder`). CLI copies the module's schema to `prisma/schema/modules/{slug}.prisma` and runs `prisma generate` automatically.
- Q: How should the system handle draft expiration? → A: Sliding expiration (reset 24h TTL on every interaction) + configurable `draftTtlHours` in `defineModule()`.
- Q: How should the `save()` helper handle potential data race conditions? → A: Last-Write-Wins (LWW). Simple overwrite is sufficient for the current scale (~1,000 users) per YAGNI.
- Q: How should the system discover and load modules? → A: Auto-Discovery. Scan `modules/*/config.ts` at startup for dynamic registration, aligning with Layer 1 design.
- Q: How should the Module Loader handle a module that fails to load? → A: Log & Skip. Log a detailed error and notify all SUPER_ADMINs via Telegram. The bot remains operational; broken modules are excluded until the next restart.
- Q: How is sectionSlug in ModuleDefinition mapped to the AdminScope table? → A: Direct mapping via Section.slug field. The Section model requires a `slug String @unique` field. ModuleDefinition.sectionSlug MUST match Section.slug. At runtime, ModuleLoader resolves the mapping through this chain: `sectionSlug` → `Section.slug` → `Section.id` → `AdminScope.sectionId`. The `save()` helper then queries `AdminScope` WHERE `sectionId` matches the resolved ID.
- Q: What happens when a user exceeds maxRetries in the validate() loop? → A: Cancel & Notify (The current operation is canceled, the draft is cleared, and the user is sent a "max retries exceeded" message with a button to restart).
- Q: What should happen to the corresponding Prisma schema file during module:remove? → A: Automatic Deletion + Prisma Generate (The CLI deletes the schema from prisma/schema/modules/ and triggers prisma generate).
- Q: How are missing localization keys handled for modules? → A: Key with Placeholder (Display the raw key name with brackets, e.g., [key_name], to make missing translations obvious).
- Q: What is the target maximum latency for ModuleLoader at startup? → A: Under 5 seconds (Even with 20-30 modules, the discovery and registration scan should be nearly instantaneous).
- Q: If the database write operation in save() fails, what happens to the user's draft in Redis? → A: Preserve Draft (Keep the draft so the user can be notified of the error and attempt to "save" again without re-entering all data).
- Q: If a user selects a field to edit from the confirm() summary but cancels that prompt, what should the bot do? → A: Return to Summary (Return the user to the confirm() summary screen without modifying the original value).
- Q: What should the module:remove tool do with existing database tables? → A: Warning & Skip (Do NOT drop tables; warn the user that they must be manually removed if desired).
- Q: What level of detail should be included in the automatically generated audit log? → A: Full Payload (Log the module slug, user ID, timestamp, action type, and the ENTIRE data object saved to the database). PII is masked ONLY in the audit log entries (FR-006), NOT in admin notifications (FR-007) which require full visibility for authorized personnel.
- Q: What happens when a user sends /help during a conversation? → A: Contextual Help (The bot displays step-specific help messages without exiting the conversation or clearing the draft).
- Q: What level of confirmation should the module:remove tool require before deletion? → A: Type Slug (Ask the user to type the module's slug again to confirm the non-undoable deletion).
- Q: How should the display order of modules within a section be determined? → A: Explicit orderIndex field (Add an optional orderIndex: number to ModuleDefinition; modules are sorted by index, then alphabetically).
- Q: Should sensitive PII be masked in the audit log payload? → A: Masked in Logs (Store critical PII like phone numbers masked (e.g., +20*******12) in the audit log, while keeping non-sensitive fields in plain text).
- Q: When re-entering a module with an active draft, should the bot always ask to resume? → A: Always Ask (Always provide the choice between resuming the draft or starting fresh to give the user full control).
- Q: If module:remove is run on a slug that doesn't exist, what should happen? → A: Immediate Exit (The tool MUST check for existence before asking for confirmation; if missing, exit with a clear error).
- Q: How should the Module Loader handle a module with an invalid configuration (e.g., missing fields in config.ts)? → A: Log & Skip (The Module Loader MUST catch the error, log it, and skip the module; it MUST also notify SUPER_ADMINs via Telegram).
- Q: Which permission category determines a module's visibility in the bot menu? → A: view permission (The module is only visible to users with roles listed in the permissions.view array).
- Q: How should command interrupts like /cancel, /start, or /menu be handled during data collection? → A: Standard Interrupts (Helpers MUST detect these commands, preserve the current draft in Redis to allow future resume, and exit the conversation. All three commands behave identically regarding draft preservation).
- Q: What database commands should the module:create tool run? → A: CLI only runs prisma generate (client generation only), NOT prisma migrate dev. Developers are responsible for running migrations manually.
- Q: What happens if a config.ts file has a syntax error? → A: Log, Notify, & Continue (ModuleLoader MUST wrap imports in try/catch; errors are logged and SUPER_ADMINs notified via Telegram, but the bot continues to start).
- Q: Should i18n keys include an organization-specific prefix? → A: Slug-Only Prefix (i18n keys for each module are prefixed ONLY with the module slug (e.g., fuel-entry-prompt-amount); organization context is handled at the locale file layer).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Developer scaffolds a new module (Priority: P1)

Developers need a quick, error-free way to create standard module scaffolding so they can immediately begin writing grammY conversation logic without worrying about boilerplate and file placement.

**Why this priority**: Scaffolding is the entry point for all module creation. Without it, developers must manually create structures, increasing error risk and violating consistency.

**Independent Test**: Can be independently tested by running `npm run module:create {slug}` and verifying the resulting folder structure, files, and Prisma schema placement.

**Acceptance Scenarios**:

1. **Given** a developer is in the terminal, **When** they run `npm run module:create fuel-entry` and answer interactive prompts (Arabic name, English name, icon, etc.), **Then** the CLI generates the correct folder structure (`modules/fuel-entry/`), populates `config.ts`, conversations, schemas, and locale files, and copies the schema to `prisma/schema/modules/fuel-entry.prisma` followed by `prisma generate`.
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
4. **Given** a user is re-answering a specific field from the summary, **When** they cancel that specific prompt (e.g., via `/cancel` button if provided), **Then** the bot returns them to the original summary with the original value preserved.

---

### User Story 3 - Draft Auto-Save and Recovery (Priority: P2)

Users who get interrupted during a flow need their progress saved automatically so they don't have to restart lengthy data entry processes.

**Why this priority**: Improves user experience and completion rates for long data entry forms, but the core functionality works without it.

**Independent Test**: Can be tested by starting a module flow, answering some questions, and sending `/cancel`, `/start`, or `/menu` to verify the draft is preserved in Redis and accessible upon re-entry.

**Acceptance Scenarios**:

1. **Given** a user is halfway through a module conversation, **When** they send a new input, **Then** the `draft middleware` automatically saves the conversation state to Redis and resets the sliding TTL (default 24h or per-module override).
2. **Given** a user previously abandoned a module conversation within the TTL (default 24h) via `/cancel`, `/start`, or `/menu`, **When** they restart that same module, **Then** the bot asks if they want to resume the draft or start fresh.
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

- What happens when a user sends `/cancel`, `/start`, or `/menu` during a conversation? (Expected: current step terminates, user returns to menu, and draft is PRESERVED in Redis for future resume. All three commands behave identically regarding draft preservation).
- What happens when a user exceeds `maxRetries` in the `validate()` loop? (Expected: operation cancels, draft cleared, user notified with a restart button).
- How does the system handle concurrent edits to the same draft from multiple devices? (Expected: last-write-wins based on Redis state).
- How does the `save()` helper handle concurrent database updates? (Expected: last-write-wins; the final state in the draft overwrites the database record).
- What happens if a module fails to load during startup (e.g., syntax error in `config.ts`)? (Expected: Error logged, SUPER_ADMINs notified via Telegram, bot continues loading other modules).
- What happens when an ADMIN's permissions are revoked while they have an active draft for a restricted module? (Expected: resuming draft fails with an unauthorized error).
- How are locale keys handled if a module is loaded but the corresponding `ar.ftl` or `en.ftl` files are missing or incomplete? (Expected: fallback to displaying the bracketed key name, e.g., `[fuel_entry-prompt-amount]`).
- What happens if the `action` callback inside `save()` fails (e.g., database error)? (Expected: "Save failed" message displayed with "Retry" button; maximum 1 automatic retry attempt. If retry fails, user informed via i18n key `module-kit-save-failed-persistent` that data is preserved as draft for later retry. No infinite retry loops.)
- What happens if Redis becomes unavailable during an active module conversation? (Expected: conversation continues without draft saving; user is warned that interruption will lose progress).
- What happens if a user doesn't respond to a module conversation prompt for an extended period? (Expected: timeout after 15 minutes of inactivity; conversation handler released, draft preserved in Redis. User receives i18n key `module-kit-conversation-timeout` and "Resume/Start Fresh" prompt upon return).
- What happens if a user starts a new module while another is active? (Expected: current draft is preserved in Redis (same as /cancel behavior), conversation handler is terminated. User gets "Resume/Start Fresh" prompt when returning to previous module. Multiple drafts across different modules can exist simultaneously in Redis; only one active conversation handler per user is allowed at a time).
- What happens if confirm() is called with an empty or zero-field data object? (Expected: developer-facing error thrown: "confirm() called with empty data object — ensure validate() is called before confirm()". This is a programming error caught during development/testing; no user-facing message or i18n key).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a `defineModule()` utility that registers module identity, permissions, `orderIndex` (optional), `draftTtlHours` (optional), and conversation entry points for the Module Loader.
- **FR-002**: System MUST enforce strict visibility rules: modules are entirely hidden from menus unless the user's role is included in the `permissions.view` list.
- **FR-003**: System MUST provide a `validate()` helper supporting configurable prompts, validation functions, error messages, and retry limits.
- **FR-004**: System MUST provide a `confirm()` helper that displays a summary of collected data and allows targeted re-entry for specific, editable fields.
- **FR-005**: System MUST provide a `save()` helper that persists data to the database.
- **FR-006**: System MUST automatically generate an audit log entry on every invocation of `save()`, capturing the full metadata and the entire saved data payload. Critical PII (e.g., phone numbers, nationalId, taxId) MUST be masked in the log entry.
- **FR-007**: System MUST automatically send notifications containing the FULL, UNMASKED saved data to all authorized personnel (SUPER_ADMIN users and ADMIN users with matching AdminScope for the module's section) on every invocation of `save()`. The `save()` helper implements scoped notification internally using existing Layer 1 services (`auditService`, `queueNotification` from `packages/core/src/services/`). Scoped admin notifications are handled by a private `notifyScopedAdmins()` function inside `persistence.ts` — scoping logic is encapsulated within the `save()` helper. Lookup strategy: resolve `ModuleDefinition.sectionSlug` → `Section.slug` → `Section.id`, then query `AdminScope WHERE sectionId = resolved Section.id` to find authorized ADMINs, plus ALL SUPER_ADMINs.
- **FR-015**: System MUST handle `/help` during an active module conversation by displaying step-specific contextual help without exiting the conversation or clearing the draft. *Note: FR-015 was added post-initial specification via /speckit.specify.* The `stepKey` is determined by the `validate()` helper based on the `promptKey` parameter passed to it. When a developer calls `validate({ promptKey: 'fuel-entry-prompt-amount', ... })`, the stepKey is extracted as the last segment after the last hyphen of the promptKey (e.g., 'amount'). The /help handler then looks up the i18n key `module-kit-help-amount`. If no matching help key exists, a generic help message is shown via i18n key `module-kit-help-generic`.
- **FR-008**: System MUST provide draft middleware that automatically saves conversation state to Redis after each user input and resets the sliding TTL.
- **FR-009**: System MUST ALWAYS prompt users to resume or start fresh if an active draft exists when entering a module, ensuring the user has explicit control over their session state.
- **FR-010**: System MUST enforce i18n rules where all module text uses keys prefixed ONLY with the module slug (e.g., `fuel-entry-prompt-amount`). These are loaded from module-specific `.ftl` files. System-level messages provided by the Module Kit itself (e.g., error alerts, draft resume prompts) MUST use the `module-kit-` prefix to avoid collisions with dynamic module slugs. Organization-specific content is managed by providing different .ftl locale files per deployment. Multi-tenancy is deferred to a future feature per Constitution §Multi-Company Ready.
- **FR-011**: System MUST provide a CLI tool `npm run module:create` to scaffold the standard module file structure interactively and trigger `prisma generate` after placing the schema file.
- **FR-012**: System MUST provide a CLI tool `npm run module:remove` to delete a module's code folder and its corresponding schema file from `prisma/schema/modules/`, and trigger `prisma generate`. The tool MUST first check for the existence of the module; if it does not exist, it MUST exit with an error. It MUST require the user to type the module's slug to confirm the deletion, MUST NOT drop database tables, and MUST provide a warning about manual table deletion.
- **FR-013**: System MUST provide a CLI tool `npm run module:list` to display all discovered modules and their statuses.
- **FR-014**: System MUST notify all SUPER_ADMINs via Telegram if a module fails to load during the startup discovery scan (e.g., due to syntax errors or invalid configuration in `config.ts`). It MUST NOT crash the bot. Individual module load failures MUST NOT prevent the bot from starting or other modules from loading.

### Quality Attributes

- **QA-001 (Performance)**: ModuleLoader MUST complete discovery and registration of all modules in under 5 seconds during bot startup.
- **QA-002 (Reliability)**: 100% of successful data submissions via `save()` MUST result in a verifiable AuditLog entry and corresponding Admin notifications.

### Key Entities

- **Module Definition**: Represents the configuration of a module (`config.ts`), containing its slug, permissions, `orderIndex` override, `draftTtlHours` override, and linked conversation handlers.
- **Draft**: A temporary state object stored in Redis with sliding TTL, uniquely identified by `draft:{userId}:{moduleSlug}`, tracking the user's progress through a conversation.
- **Module File Structure**: The standard layout expected for each module, including config, conversations, Prisma schema, and locale files.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developers can scaffold a fully working (empty) module via the CLI in under 1 minute.
- **SC-002**: All data operations (create/update/delete) via the Module Kit trigger automatic audit + notification per QA-002, with zero developer-written logging or notification code required.
- **SC-003**: Users are completely unable to view or access modules outside their assigned permission scope (0% unauthorized access rate).
- **SC-004**: Conversation drafts are reliably restored, resulting in a measurable decrease in abandoned data entry flows.
- **SC-005**: The Module Kit implementation requires zero modifications to existing Layer 1 source files. New infrastructure files (ModuleLoader, Draft Middleware) MAY be added to packages/core/ when they serve as Layer 2 integration points that must operate at the bot framework level. Minimal, non-breaking schema additions (e.g., Section.slug) are also permitted.
