# Feature Specification: Phase 1 Critical UX Fixes (Constitutional RBAC Correction)

**Feature Branch**: `001-fix-pii-masking`
**Created**: 2026-03-05
**Status**: Draft
**Input**: User description: "Update specs/001-platform-core/spec.md to fix a constitutional RBAC inconsistency in the UX Fixes. Modify User Story P1 (Comprehensive User Profile View) and functional requirement FR-002. Change the requirement from "masked National ID" to displays to "UNMASKED National ID (and all other details fully unmasked)". Ensure the specification explicitly states: "PII masking applies ONLY to Audit Logs per Constitution Principle VI. In the User Profile View, authorized admins and Super Admins MUST see the complete, original National ID and Phone Number." Update any success criteria (SC) or checklist items that mention masking in the UI to reflect this correction."

## Constitutional Compliance Note

**Critical Correction**: This specification corrects a constitutional RBAC inconsistency. Per **Constitution Principle VI (Audit Logging & PII Protection)**:

- PII masking applies **ONLY** to Audit Logs
- User-facing views (including User Profile) must display complete, original data to authorized users
- Authorized admins and Super Admins have legitimate business need to view complete user information
- This RBAC model ensures data accessibility for business operations while protecting PII in audit logs

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Comprehensive User Profile View (Priority: P1)

Authorized users (EMPLOYEE, ADMIN, SUPER_ADMIN) can view their own complete profile information, and authorized admins and Super Admins can view other users' complete profiles with all details fully displayed (no masking).

**Why this priority**: Users need visibility into their own account information for verification and trust. Authorized admins and Super Admins require complete profile data to perform legitimate business operations (user management, verification, support, compliance). This is fundamental to the user management experience and constitutional RBAC compliance.

**Independent Test**: Can be tested by viewing a user's profile (own or another user's for admins) and verifying all fields display correctly with complete, original data (no masking applied).

**Acceptance Scenarios**:

1. **Given** I am an EMPLOYEE or ADMIN **When** I select "My Profile" from the main menu **Then** I see a comprehensive view of my profile including: Full Name, Nickname (if set), Phone Number (complete, unmasked), National ID (complete, unmasked - all 14 digits visible), Role, Language preference, Account Status (Active/Inactive), Join Date, and Last Active timestamp.

2. **Given** I am a SUPER ADMIN or ADMIN with appropriate scope **When** I view another user's profile **Then** I see the same comprehensive profile view with complete, original data including the full 14-digit National ID and complete Phone Number (no masking).

3. **Given** I am viewing any profile **When** I look at the National ID field **Then** all 14 digits are fully visible (e.g., `29503120123456`) to ensure authorized users can perform legitimate verification and business operations.

4. **Given** I am an EMPLOYEE (non-admin) **When** I attempt to view another user's profile **Then** the access is denied per RBAC rules (EMPLOYEEs can only view their own profile).

---

### User Story 2 - Mandatory Confirmation Dialogs for Destructive Actions (Priority: P1)

Administrators are required to confirm all destructive actions through explicit confirmation dialogs before the action executes, preventing accidental modifications.

**Why this priority**: Prevents accidental user account modifications that could disrupt business operations and user access. This is critical for data integrity and user trust.

**Independent Test**: Can be tested by attempting to toggle user active status and verifying that a confirmation dialog appears and requires explicit approval before the change executes.

**Acceptance Scenarios**:

1. **Given** I am a SUPER ADMIN or ADMIN **When** I attempt to toggle a user's active status (activate or deactivate) **Then** the system displays a confirmation dialog showing the user's name, the action being taken, and requires me to explicitly select "Confirm" to proceed or "Cancel" to abort.

2. **Given** I am a SUPER ADMIN or ADMIN **When** I attempt to approve a join request **Then** the system displays a confirmation dialog showing the applicant's name and phone number and requires explicit confirmation before approval.

3. **Given** I am a SUPER ADMIN or ADMIN **When** I attempt to reject a join request **Then** the system displays a confirmation dialog showing the applicant's name and phone number and requires explicit confirmation before rejection.

4. **Given** I am viewing a confirmation dialog **When** I select "Cancel" **Then** the destructive action is aborted and no changes are made to the system state.

5. **Given** I am viewing a confirmation dialog **When** I select "Confirm" **Then** the destructive action executes and the appropriate audit log entry is created.

6. **Given** I am viewing a confirmation dialog **When** I attempt to perform another action before confirming **Then** the confirmation dialog remains active and the new action is blocked until the current confirmation is resolved.

---

### User Story 3 - Mobile-Optimized Short Button Texts (Priority: P2)

All navigation and action buttons display short, mobile-friendly text that fits within Telegram's button width constraints while maintaining clarity through i18n-only compliant labels.

**Why this priority**: Mobile users cannot use the desktop fallback menu; button text must be short enough to display fully on mobile screens without truncation, ensuring usability for all users regardless of device.

**Independent Test**: Can be tested by viewing the bot on a mobile device and verifying that all button labels are fully visible and readable without horizontal scrolling or text cutoff.

**Acceptance Scenarios**:

1. **Given** I am viewing any bot menu or dialog on a mobile device **When** I look at any inline button or keyboard button **Then** the button text is 20 characters or less in both Arabic and English to ensure full visibility on mobile screens.

2. **Given** I am viewing the main menu on a mobile device **When** I look at section buttons **Then** section names are truncated to 20 characters maximum in both Arabic and English, with ellipsis (...) if longer text exists.

3. **Given** I am viewing action buttons (Confirm, Cancel, Back, Next, Submit, etc.) **When** I look at any button **Then** the button text uses short variants defined in locale files (e.g., "Confirm" instead of "Confirm this action").

4. **Given** I am viewing any button label **When** the source text is **Then** the displayed text is loaded exclusively from `.ftl` locale files using a short variant key (e.g., `button-confirm-short` instead of `button-confirm`).

5. **Given** I am viewing any button **When** the label exceeds 20 characters **Then** a shorter variant MUST be used; if no short variant exists, one MUST be created in the locale files.

---

### Edge Cases

- What happens when a user has no nickname set? The Profile view displays a placeholder text via i18n key `profile-nickname-not-set` instead of the nickname field.
- What happens when a confirmation dialog is abandoned? The confirmation dialog times out after 5 minutes of inactivity and the action is automatically cancelled with a message via i18n key `confirmation-timeout`.
- How does the system handle multiple concurrent destructive actions? Only one confirmation dialog can be active per user at a time; subsequent actions are queued or blocked until the current dialog is resolved.
- What happens when a button label cannot be shortened without losing meaning? A two-line display or abbreviation is used while maintaining clarity, and the i18n key includes a comment explaining the abbreviation.
- How does the system handle very long Arabic names in button labels? Arabic names longer than 20 characters are truncated with ellipsis (...) and the full name is displayed in the subsequent detail view.
- What happens when National ID has fewer than 14 digits (invalid format)? The Profile view displays an error indicator via i18n key `profile-national-id-invalid` instead of the full display.
- How does PII protection work across the system? Per Constitution Principle VI: PII (National ID, Phone Number) is masked in Audit Logs only. User Profile View, Join Request views, and all user-facing business views display complete, original data to authorized users per their RBAC scope.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a comprehensive User Profile view that displays all user profile fields in a structured, readable format.
- **FR-002**: System MUST display the complete, original 14-digit National ID in the User Profile view for authorized users (no masking). PII masking applies ONLY to Audit Logs per Constitution Principle VI. In the User Profile View, authorized admins and Super Admins MUST see the complete, original National ID and Phone Number.
- **FR-003**: System MUST require a mandatory confirmation dialog before executing any destructive action, including but not limited to: toggle user active status, approve join request, reject join request, delete user, and assign/revoke admin scopes.
- **FR-004**: System MUST display confirmation dialogs with clear information about the action being taken, including the target entity (user name, section name, etc.) and the nature of the action (activate, deactivate, approve, reject, delete).
- **FR-005**: System MUST require explicit user interaction (button press) to confirm destructive actions; no auto-confirmation or timeout-based confirmation is allowed.
- **FR-006**: System MUST timeout and cancel confirmation dialogs after 5 minutes of inactivity, showing a message via i18n key `confirmation-timeout`.
- **FR-007**: System MUST allow users to cancel confirmation dialogs at any time, aborting the destructive action with no changes to system state.
- **FR-008**: System MUST limit all button text to 20 characters maximum for both Arabic and English to ensure mobile compatibility.
- **FR-009**: System MUST use short button label variants defined in locale files for all navigation and action buttons (e.g., `button-confirm-short`, `button-cancel-short`, `button-back-short`).
- **FR-010**: System MUST truncate section names and other long text labels to 20 characters maximum with ellipsis (...) for button display, showing the full text in subsequent detail views.
- **FR-011**: System MUST support i18n-only compliant button labels for all buttons; no button text may be hardcoded in TypeScript source code.
- **FR-012**: System MUST include the following short button variants in both `ar.ftl` and `en.ftl` locale files:
  - `button-confirm-short`: Confirm
  - `button-cancel-short`: Cancel
  - `button-back-short`: Back
  - `button-next-short`: Next
  - `button-submit-short`: Submit
  - `button-approve-short`: Approve
  - `button-reject-short`: Reject
  - `button-activate-short`: Activate
  - `button-deactivate-short`: Deactivate
  - `button-delete-short`: Delete
  - `button-edit-short`: Edit
  - `button-view-short`: View
  - `button-yes-short`: Yes
  - `button-no-short`: No
- **FR-013**: System MUST include the following i18n keys for User Profile view in both `ar.ftl` and `en.ftl`:
  - `profile-title`: User Profile
  - `profile-full-name`: Full Name
  - `profile-nickname`: Nickname
  - `profile-nickname-not-set`: Not set
  - `profile-phone`: Phone Number
  - `profile-national-id`: National ID
  - `profile-role`: Role
  - `profile-language`: Language
  - `profile-status`: Account Status
  - `profile-status-active`: Active
  - `profile-status-inactive`: Inactive
  - `profile-join-date`: Join Date
  - `profile-last-active`: Last Active
  - `profile-edit-button`: Edit Profile
- **FR-014**: System MUST include the following i18n keys for confirmation dialogs in both `ar.ftl` and `en.ftl`:
  - `confirmation-title`: Confirmation Required
  - `confirmation-activate-user`: Are you sure you want to activate user {name}?
  - `confirmation-deactivate-user`: Are you sure you want to deactivate user {name}?
  - `confirmation-approve-join`: Are you sure you want to approve join request from {name} ({phone})?
  - `confirmation-reject-join`: Are you sure you want to reject join request from {name} ({phone})?
  - `confirmation-cancelled`: Action cancelled.
  - `confirmation-confirmed`: Action confirmed and completed.
  - `confirmation-timeout`: Confirmation dialog timed out. Action cancelled.
- **FR-015**: System MUST log all destructive actions in the audit log after successful confirmation, including the confirming user, the target entity, and the action type. Audit Log entries MUST have PII (National ID, Phone Number) masked per Constitution Principle VI.
- **FR-016**: System MUST apply PII masking ONLY in Audit Logs. User Profile View, Join Request views, and all business views MUST display complete, original data to authorized users per RBAC scope.

### Key Entities *(include if feature involves data)*

No new entities are introduced by this feature. The existing User and JoinRequest entities are used with enhanced display capabilities.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User Profile view displays all 9 profile fields (Full Name, Nickname, Phone, National ID, Role, Language, Status, Join Date, Last Active) correctly 100% of the time.
- **SC-002**: National ID displays with complete 14 digits (no masking) in User Profile View for authorized users (EMPLOYEE viewing own profile, ADMIN and SUPER_ADMIN viewing authorized profiles) 100% of the time.
- **SC-003**: Confirmation dialogs are displayed for 100% of destructive actions before execution.
- **SC-004**: Confirmation dialogs timeout after exactly 5 minutes of inactivity and cancel the pending action.
- **SC-005**: 100% of button labels are 20 characters or less for both Arabic and English text.
- **SC-006**: 100% of button labels are loaded from i18n locale files with no hardcoded text in TypeScript source code.
- **SC-007**: All destructive actions that proceed create corresponding audit log entries.
- **SC-008**: Users can view their own profile on mobile devices without horizontal scrolling or text cutoff.
- **SC-009**: Audit Log entries have PII (National ID, Phone Number) masked 100% of the time (compliance with Constitution Principle VI).
- **SC-010**: Authorized admins and Super Admins can view complete, original user data in Profile View 100% of the time (RBAC compliance).

### Non-Functional Requirements

- **NFR-001**: User Profile view loads within 1 second of user interaction.
- **NFR-002**: Confirmation dialogs appear within 500 milliseconds of action trigger.
- **NFR-003**: Button text truncation maintains semantic meaning for 95% of standard business terms.
- **NFR-004**: Complete National ID format (14 digits) is consistently displayed in User Profile View across all authorized views.
- **NFR-005**: All i18n keys for this feature are present in both Arabic and English locale files.
- **NFR-006**: PII masking in Audit Logs does not affect performance (>100ms overhead per audit entry).

## Dependencies

- Depends on existing User Management functionality from Platform Core (001-platform-core)
- Depends on existing i18n infrastructure (locale files, translation key system)
- Depends on existing audit logging infrastructure (PII masking per Constitution Principle VI)
- Depends on existing RBAC system (role and scope-based access control)

## Integration Notes

This feature extends the existing User Management User Stories from Platform Core with enhanced UX capabilities and constitutional RBAC compliance:

1. **User Story 1 (First User Bootstrap)** - No changes required; new profile view is automatically available after bootstrap.

2. **User Story 2 (Join Request and Approval)** - Confirmation dialogs added to approve/reject actions per FR-003, FR-014. Join Request views display complete user data to authorized admins per constitutional RBAC.

3. **User Story 3 (Section Management)** - Section name truncation per FR-010 for button display.

4. **User Story 6 (Settings Management)** - Short button variants apply to all Settings menu items.

**Constitutional RBAC Compliance**:
- Per Constitution Principle VI: PII masking applies ONLY to Audit Logs
- User Profile View: Complete, original data displayed to authorized users
- Join Request Views: Complete, original data displayed to authorized admins
- Audit Logs: PII (National ID, Phone Number) masked
- This ensures data accessibility for business operations while protecting PII in logs

The feature integrates seamlessly by enhancing existing flows rather than replacing them, ensuring backward compatibility with existing user journeys.

## Constitutional Principles Referenced

- **Constitution Principle VI (Audit Logging & PII Protection)**: PII masking applies ONLY to Audit Logs. User-facing views display complete data to authorized users.
- **Constitution Principle VII (Role-Based Access Control)**: Access to user profiles is governed by RBAC scope. EMPLOYEEs see only their own profile; ADMINs and SUPER_ADMINs see authorized user profiles.
