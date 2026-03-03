# Internationalization (i18n) Guide

**Last Updated:** 2026-03-03

The Al-Saada Smart Bot uses Mozilla's **Fluent** (`.ftl`) syntax for managing localization. Native languages are served via `@grammyjs/fluent`. All keys below match exactly across both `packages/core/src/locales/ar.ftl` and `packages/core/src/locales/en.ftl`.

---

## 1. General System Messages
Core messages, errors, and unauthenticated experiences.

| Key | Description / Usage |
| :--- | :--- |
| `welcome` | Standard start string for the bot. |
| `error-generic` | Highest level generic try/catch bot boundary message. |
| `error-network` | Fallback connection error message. |
| `maintenance-msg` / `maintenance-active-message` | Shown when system `isMaintenanceMode=true`. |
| `status-pending` | Shown when a user interacts but their request is not yet approved. |
| `welcome-back` | Re-authenticated welcome message (Params: `$name`). |
| `welcome-super-admin` | Initial entry string for the Super Admin (Params: `$name`). |
| `welcome-super-admin-new` | Success message when bootstrapping the first Super Admin. |
| `welcome-visitor` | Directs unauthenticated users to apply for registration. |
| `user-inactive` | Account blocking warning. |
| `user-already-exists` | Re-registration attempt warning. |
| `errors-system-internal` | FR-005 spec Error middleware fallback. |
| `errors-account-deactivated` | Edge Case message for disabled users. |
| `errors-unauthorized` | FR-016 Unauthenticated access denial string. |
| `errors-unsupported-message` | Edge case warning for raw documents/voice unsupported contexts. |
| `value-unknown` | Generic unmapped status string. |

---

## 2. Shared Interface Buttons & Menus

| Key | Description / Usage |
| :--- | :--- |
| `menu-super-admin` | Main menu header (Params: `$name`). |
| `menu-admin` | Main menu header (Params: `$name`). |
| `menu-employee` | Main menu header (Params: `$name`). |
| `menu-visitor` | Main menu header (Params: `$name`). |
| `button-sections` | Keyboard menu label. |
| `button-users` | Keyboard menu label. |
| `button-maintenance` | Keyboard menu label. |
| `button-audit` | Keyboard menu label. |
| `button-modules` | Keyboard menu label. |
| `button-notifications` | Keyboard menu label. |
| `button-submit-join-request` | Initial registration kickoff button. |
| `button-confirm` | Shared Confirm. |
| `button-cancel` | Shared Cancel. |
| `button-skip-nickname` | Shared Skip string. |
| `button-cancel-flow` | Generic text matching `/cancel`. |

---

## 3. Join Requests / Onboarding Process
Strings powering the `join-request` module conversations.

| Key | Description / Usage |
| :--- | :--- |
| `join-welcome` | Step 0 introduction text. |
| `join-step-name` | Step 1 prompt. |
| `join-step-nickname` | Step 2 prompt. |
| `join-step-phone` | Step 3 prompt. |
| `join-step-national-id` | Step 4 prompt. |
| `join-confirm` | Multi-line confirmation (Params: `$fullName, $nickname, $phone, $nationalId, $birthDate, $gender`). |
| `join-request-already-pending` / `join-request-pending` | Stops users from submitting duplicate requests. |
| `join-request-received` | Immediate success response post-submission. |
| `join-cancelled` | Request forcefully cancelled by user. |
| `join-approved` | Success string upon Admin approval (Params: `$role, $approvedBy, $date`). |
| `join-rejected` | Rejection string upon Admin denying (Params: `$rejectedBy, $date`). |
| `gender-male` / `gender-female` / `gender-unknown` | Auto-extracted gender mappings from the National ID. |

---

## 4. Input Validation & Form Errors

| Key | Description / Usage |
| :--- | :--- |
| `error-invalid-arabic-name` | Fails standard Arabic-only RegEx. |
| `error-name-too-short` | Name fails length verification. |
| `error-invalid-phone` / `errors-validation-invalid-phone` | Not matching standard mobile regex. |
| `error-phone-exists` | Collides with unique PostgreSQL phone constraint. |
| `error-invalid-national-id` / `errors-validation-invalid-national-id` | Fails 14 character and checksum logic. |
| `error-national-id-exists` / `errors-join-request-duplicate-national-id` | Collides with unique PostgreSQL National ID constraint. |
| `error-required-field` | Generic field missing failure. |
| `error-invalid-telegram-id` | Internal constraint failure for session. |
| `errors-section-has-active-modules` | Blocks Section cascades safely. |
| `errors-join-request-already-handled` | Fixes concurrent Admin race conditions on the same request. |
| `errors-join-request-already-pending` | Fixes concurrent User submissions. |

---

## 5. Automated Background Notifications

| Key | Description / Usage |
| :--- | :--- |
| `notification-join-request-title` | Admin alert summary. |
| `notification-join-request-message` | Admin alert details (Params: `$name, $phone`). |
| `notifications.join_request_new` | General alert template (Params: `$userName, $requestCode`). |
| `notifications.join_request_approved` | Direct user message template. |
| `notifications.join_request_rejected` | Direct user message template. |
| `notifications.user_deactivated` | Alert when a Super Admin locks a profile. |
| `notifications.maintenance_on` | Broadcast to all users on shutdown. |
| `notifications.maintenance_off` | Broadcast to all users on recovery. |
| `notification-module-load-error-title` | Super Admin alert. |
| `notification-module-load-error-message` | Details of a dynamically loaded Module throwing an exception. |

---

## 6. Module Kit (Dynamic State Framework)
Strings powering the `packages/module-kit/` primitives.

| Key | Description / Usage |
| :--- | :--- |
| `module-kit-cancelled` | Used when `draftMiddleware` intercepts a global command. |
| `module-kit-help-default` | Standard input helper fallback. |
| `module-kit-draft-found` | Prompt offering to reconstruct State from Redis. |
| `module-kit-draft-resume-btn` | Interactive button string for Draft Restore. |
| `module-kit-draft-fresh-btn` | Interactive button string for Draft Deletion. |
| `module-kit-draft-expired` | Automatic TTL expiry awareness message. |
| `module-kit-max-retries-exceeded` | Exhausted `validate()` retries loop. |
| `module-kit-unauthorized-action` | Action verification fails against `defineModule` capabilities. |
| `module-kit-confirm-btn` | `confirm()` execution. |
| `module-kit-cancel-btn` | `confirm()` cancellation. |
| `module-kit-review-title` | Header constructed automatically by `confirm()`. |
| `module-kit-edit-field` | Button label constructed automatically for `editableFields` (Params: `$field`). |
