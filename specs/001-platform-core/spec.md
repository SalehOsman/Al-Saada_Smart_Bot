# Feature Specification: Platform Core (Layer 1)

**Feature Branch**: `001-platform-core`
**Created**: 2026-02-17
**Status**: Draft
**Input**: User description: "Build the Platform Core (Layer 1) for Al-Saada Smart Bot — a Telegram bot platform for Egyptian business management."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - First User Bootstrap (Priority: P1)

New user sends /start to the bot for the first time in the entire system.

**Why this priority**: This is the entry point for all users and establishes the foundational user experience.

**Independent Test**: Can be tested by sending /start as the first user and verifying bootstrap behavior, super admin assignment, and welcome message delivery.

**Acceptance Scenarios**:

1. **Given** I am the first user to send /start **When** I send /start **Then** I become Super Admin automatically, see welcome message in Arabic, and am asked to submit a join request with name and phone number.

2. **Given** I am a subsequent user sending /start **When** I send /start **Then** I see my existing role (VISITOR/EMPLOYEE/ADMIN/SUPER_ADMIN) and appropriate menu based on my role.

---

### User Story 2 - Join Request and Approval (Priority: P2)

New user submits join request and admin processes it.

**Why this priority**: Essential user onboarding flow that establishes the user lifecycle.

**Independent Test**: Can be tested by having a new user submit a join request and verifying notifications and approval workflow.

**Acceptance Scenarios**:

1. **Given** I am a new user **When** I submit my join request with name and phone **Then** my request is saved with status "PENDING" and all Super Admins receive notification.

2. **Given** I am a Super Admin **When** I receive a join request notification **Then** I can approve or reject the request and the user is notified accordingly.

3. **Given** my join request is approved **When** I send /start again **Then** I see the EMPLOYEE menu instead of the waiting message.

---

### User Story 3 - Section Management (Priority: P3)

Super Admin manages dynamic sections in the bot.

**Why this priority**: Section management is core to organizing the bot's structure and user navigation.

**Independent Test**: Can be tested by creating, editing, and deleting sections and verifying they appear correctly in the bot menu.

**Acceptance Scenarios**:

1. **Given** I am a Super Admin **When** I create a new section **Then** the section appears as a button in the main bot menu.

2. **Given** I am a Super Admin **When** I edit a section's name or icon **Then** the changes are reflected immediately in the bot menu.

3. **Given** I am a Super Admin **When** I delete an empty section **Then** the section is removed from the system.

4. **Given** I am a Super Admin **When** I click on a section **Then** I see either the list of modules (if any) or "No modules yet" message (if empty).

---

### User Story 4 - Maintenance Mode (Priority: P3)

Super Admin controls bot maintenance state.

**Why this priority**: Critical for system reliability and controlled updates.

**Independent Test**: Can be tested by toggling maintenance mode and verifying different user experiences.

**Acceptance Scenarios**:

1. **Given** maintenance mode is OFF **When** I send any message **Then** I receive normal responses.

2. **Given** maintenance mode is ON **When** I am a regular user **Then** I see "Bot is under maintenance, please try later" in Arabic.

3. **Given** maintenance mode is ON **When** I am Super Admin **Then** I can still use the bot normally.

---

### User Story 5 - Audit and Session Management (Priority: P2)

System tracks user actions and maintains session state.

**Why this priority**: Essential for security, debugging, and user experience continuity.

**Independent Test**: Can be tested by performing actions and verifying they appear in audit logs, and testing session persistence across bot interactions.

**Acceptance Scenarios**:

1. **Given** I perform any action **When** the action completes **Then** it is logged in the audit log with timestamp and user details.

2. **Given** I navigate through the bot **When** I return after a short time **Then** I resume from where I left off (session persistence).

3. **Given** I am inactive for 24 hours **When** I send a message **Then** I start fresh with a new session.

---

### Edge Cases

- What happens when a module's configuration is invalid? Each module consists of: module.config.ts, add.flow.ts, edit.flow.ts, view.config.ts, list.config.ts, report.config.ts, schema.prisma, and optional lifecycle hooks. Bot should log warning and skip it, not crash.
- How does the system handle database connection failures during bot startup? Should show appropriate error and retry.
- What happens if Redis becomes unavailable? Should fall back to in-memory sessions and log warnings.
- How are sensitive data handled in logs? Passwords, tokens, and other sensitive info should never appear in audit logs.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST initialize grammY bot with TypeScript and Hono server for webhook mode
- **FR-002**: System MUST setup Pino logger with Arabic-friendly formatting
- **FR-003**: System MUST validate environment variables using Zod schema (.env validation)
- **FR-004**: System MUST handle graceful shutdown on SIGTERM/SIGINT
- **FR-005**: System MUST implement error handling middleware that logs errors and sends user-friendly Arabic messages
- **FR-006**: System MUST support Docker Compose with PostgreSQL 16, Redis 7, and Bot services
- **FR-007**: System MUST connect Prisma ORM to PostgreSQL database
- **FR-008**: System MUST connect ioredis to Redis for caching and sessions
- **FR-009**: System MUST provide health check endpoints for all services
- **FR-010**: System MUST implement user registration flow on /start command
- **FR-011**: System MUST check if user exists by Telegram ID
- **FR-012**: System MUST save join requests with status "PENDING" for new users
- **FR-013**: System MUST notify all Super Admins about new join requests
- **FR-014**: System MUST assign first user to send /start as Super Admin automatically
- **FR-015**: System MUST implement RBAC with 4 roles: SUPER_ADMIN, ADMIN, EMPLOYEE, VISITOR
- **FR-016**: System MUST check user role before processing any action
- **FR-017**: System MUST implement AdminScope table for scoped permissions (sections/modules)
- **FR-018**: System MUST allow Super Admins to create, edit, delete, enable/disable sections
- **FR-019**: System MUST display sections as main menu buttons in the bot
- **FR-020**: System MUST implement dynamic module discovery at startup
- **FR-021**: System MUST skip invalid module configs without crashing (log warnings)
- **FR-022**: System MUST allow Super Admin to toggle maintenance mode via bot command
- **FR-023**: System MUST show maintenance message to non-Super Admin users when in maintenance mode
- **FR-024**: System MUST implement notification service using BullMQ (queue-based)
- **FR-025**: System MUST store notification history in database for audit
- **FR-026**: System MUST log all significant user actions to audit log
Auditable actions are defined as: USER_LOGIN, USER_LOGOUT, ROLE_CHANGE, USER_APPROVE, USER_REJECT, USER_DEACTIVATE, SECTION_CREATE, SECTION_UPDATE, SECTION_DELETE, MODULE_ENABLE, MODULE_DISABLE, MAINTENANCE_ON, MAINTENANCE_OFF, PERMISSION_CHANGE, ADMIN_SCOPE_ASSIGN, ADMIN_SCOPE_REVOKE
- **FR-027**: System MUST NOT log sensitive data (passwords, tokens) in audit logs
- **FR-028**: System MUST use Redis for user session management (24-hour expiry)
- **FR-029**: System MUST provide canAccess(userId: bigint, sectionId?: string, moduleId?: string): Promise<boolean> function — Returns true if the user's role and admin scope allow access. Super Admin always returns true. Visitor always returns false except for join-request. Results are cached in Redis for 5 minutes.
- **FR-030**: System MUST provide API functions: registerModule(), unregisterModule(), getModulesBySection()

*Example of marking unclear requirements:*

- **FR-031**: System MUST support bilingual interface — Arabic as primary language, English as secondary. All user-facing messages must exist in both languages via .ftl locale files.
  > **Note**: RTL rendering is handled natively by Telegram's message display. No custom RTL implementation is required in the bot code.
- **FR-032**: System MUST retain notification history for 90 days. Notifications older than 90 days are automatically purged by a scheduled cron job.

### Key Entities *(include if feature involves data)*

- **User**: Represents bot users with telegramId, firstName, lastName, phone, role, isActive, language
- **JoinRequest**: Pending user registrations with name, phone, message, status
- **Section**: Dynamic departments with Arabic/English names, icons, active state, ordering. Section icons must be standard Unicode emoji characters (e.g., 📁, 💼, 🔧). No custom images or icon files.
- **Module**: Discovered modules with configuration, section assignment, permissions
- **AuditLog**: All significant actions with user, action type, target, details, timestamp
- **Notification**: Queued messages with type, target users, read status, timestamps
- **AdminScope**: Permission assignments for admins (sections/modules access)

## Constitutional Principles & Constraints *(mandatory)*

### Al-Saada Smart Bot Development Principles

1. **Platform-First**: The platform (Layer 1 + Layer 2) must be 100% complete before any module is created.

2. **Config-Driven Architecture**: All functionality must be primarily implementable as configuration. Optional lifecycle hooks (beforeValidate, beforeSave, afterSave, beforeDelete, onApproval, onRejection) are allowed for complex business logic that cannot be expressed as configuration. The 90/10 rule applies: 90% config, max 10% hook code per module.

3. **Egyptian Business Context**: All validators must support Egyptian formats. Arabic naming and timezone (Africa/Cairo) required.

4. **Bilingual Support**: Arabic (primary) and English (secondary) UI and validation messages required.

5. **Flow Block Reusability**: UI components must be reusable across modules with configurable parameters.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: First user can complete bootstrap process in under 30 seconds
- **SC-002**: System can handle 100 concurrent users without performance degradation
- **SC-003**: Audit log captures all significant actions with 100% accuracy (no gaps)
- **SC-004**: Session persistence works across bot interactions for 24-hour period
- **SC-005**: Maintenance mode toggle affects all non-Super Admin users within 5 seconds
- **SC-006**: Module discovery completes within 10 seconds of bot startup
- **SC-007**: All user-facing messages are in Arabic with proper RTL support
- **SC-008**: System maintains 99.9% uptime for core services (PostgreSQL, Redis, Bot)
- **SC-009**: Notification delivery rate is above 95% for join request notifications
- **SC-010**: Super Admin can create and manage sections without requiring developer assistance

## Versioning Strategy
This project follows Semantic Versioning (SemVer). Phase 1 completion tags as v0.1.0. Phase 2 as v0.2.0. Phase 3 as v0.3.0. Phase 4 as v1.0.0 (first production release).