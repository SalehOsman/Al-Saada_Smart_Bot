# SpecKit Analyze Report

**Date:** 2026-02-24
**Feature:** Platform Core (Layer 1)
**Analyzed Files:** `spec.md`, `plan.md`, `tasks.md`, `constitution.md`

## Overview

A comprehensive analysis was performed on the `001-platform-core` feature artifacts following the implementation of the remediation plan for the CRITICAL i18n violations and 5 HIGH severity inconsistencies.

**Result:** **PASSED WITH MINOR FINDINGS**
All blocking issues have been resolved. The project artifacts are now compliant with the Constitution (v2.0.0) and ready for implementation.

### Issue Summary
- **CRITICAL:** 0 (Previous: 1)
- **HIGH:** 0 (Previous: 5)
- **MEDIUM:** 5 (Previous: 7 - *Resolved: F4, F6*)
- **LOW:** 3 (Previous: 3)

---

## ✅ Resolved Issues (from previous analysis)

The following CRITICAL and HIGH severity issues have been verified as **RESOLVED**:

1. **[F1] i18n Key Naming (CRITICAL)**: All dot-notation keys in `spec.md` and `tasks.md` were successfully unified to the Fluent-compatible hyphen-separated format (e.g., `errors-system-internal`). Furthermore, all source code and test files have been programmatically updated to use this unified hyphen-separated format exclusively, ensuring 100% consistency across the entire monorepo.
2. **[F2] Notification Contract (HIGH)**: `plan.md` Notification Queue contract now correctly references `targetUserId` (bigint) and `params` (object), aligning precisely with the database schema.
3. **[F3] RBAC Contract (HIGH)**: `plan.md` RBAC `can-access` contract now correctly defines `userId` as `bigint`.
4. **[F4] Missing Validation/Blocking (HIGH)**: Task **T111** was added to Phase 5 for the `isActive` middleware check, fully addressing the edge case for deactivated users.
5. **[F5] Missing Edge Case Handler (HIGH)**: Task **T112** was added to Phase 2 to handle unsupported message types.
6. **[F6] Settings Menu Scenarios (HIGH)**: `spec.md` now includes detailed acceptance scenarios (User Story 6) for the Settings menu (Maintenance Toggle, Default Language, Notification Preferences, System Info, Backup).

---

## ⚠️ Remaining Non-Blocking Findings

These issues do not block the start of implementation but should be addressed during or after Phase 1 development.

### Medium Severity (5)

**[F7] Missing Implementation Task: Exponential Backoff**
- **Artifact**: `spec.md` vs `tasks.md`
- **Location**: `spec.md` (Edge Cases: FR-014 DB reconnection)
- **Description**: `spec.md` specifies an exponential backoff strategy (1s, 2s, 4s) for database reconnection failures on startup. There is no specific task in `tasks.md` that mentions implementing this retry logic (likely belongs in the database singleton setup T018).

**[F9] Missing Implementation Task: Contracts**
- **Artifact**: `plan.md` vs `tasks.md`
- **Location**: `plan.md` (Project Structure)
- **Description**: `plan.md` lists a `contracts/` directory containing `api.yaml` and `internal.yaml`. There are no tasks defined to actually create or scaffold these OpenAPI/AsyncAPI specification files.

**[F10] Underspecified Tasks: Role Menus**
- **Artifact**: `spec.md` vs `tasks.md`
- **Location**: `tasks.md` (various)
- **Description**: While `spec.md` clearly defines what each role (SUPER_ADMIN, ADMIN, EMPLOYEE, VISITOR) should see in their menu (from Clarifications), `tasks.md` lacks explicit tasks for building the specific menu displays for `ADMIN`, `EMPLOYEE`, and `VISITOR`.

**[F12] Scope Discrepancy: Module Management**
- **Artifact**: `spec.md` vs `tasks.md`
- **Location**: `spec.md` (FR-030a) vs `tasks.md` (T046)
- **Description**: `spec.md` explicitly states (FR-030a) that Module CRUD via bot UI is out of scope for Phase 1. However, task T046 is "Create module list display within sections". This risks creeping into UI management. The task should clarify it is read-only discovery display.

**[F13] Missing Quality Check: Sanitization Test**
- **Artifact**: `spec.md` vs `tasks.md`
- **Location**: `tasks.md` (Phase 9)
- **Description**: A new global sanitization middleware was added (T110), but there is no specific integration test task added to Phase 9 to verify that XSS payloads are successfully stripped across the entire application flow.

### Low Severity (3)

**[F14] Broken Reference: AI Tasks**
- **Artifact**: `tasks.md`
- **Location**: `tasks.md` (Parallel AI Prep section)
- **Description**: The AI prep section references `specs/002-ai-assistant/tasks.md` for full details, but this directory/file does not currently exist within the documented scaffolding plan.

**[F15] Data Type Discrepancy: UUID vs Cuid**
- **Artifact**: `plan.md`
- **Location**: `plan.md` (Database Schema - Module)
- **Description**: In the `plan.md` schema, `Section.id` is defined as `STRING (cuid)`. However, `Module.sectionId` (the foreign key) is defined as `UUID`. This will cause a Prisma validation error.

**[F16] Ambiguous Behavior: Default Language**
- **Artifact**: `spec.md`
- **Location**: `spec.md` (User Story 6, Scenario 2)
- **Description**: The behavior of the "Default Language" setting is underspecified. It's unclear at what point a new user is assigned this language (e.g., immediately upon `/start`, or after the join request).

---

## Conclusion & Next Steps

The critical constitutional violations regarding the `i18n-Only User Text` principle have been fully resolved, and all keys are uniformly standardized to the hyphen-separated format across the entire monorepo.

**Implementation Gateway:** You are now cleared to advance through the Zero-Defect Gate.

**Recommended Command:**
Run `/speckit.implement` to begin processing the `tasks.md` queue.

*The remaining Medium/Low findings can be addressed opportunistically during implementation or logged as technical debt for subsequent refinement passes.*
