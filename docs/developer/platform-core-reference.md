# Platform Core Reference (Layer 1)

**Last Updated:** 2026-03-03

The Platform Core (`packages/core/`) provides the foundational services, utilities, middleware, and database connections that support the entire bot.

> **Note:** This document provides FULL details of the exported API surface, including parameters and working examples from the codebase.

---

## Services

Services in Layer 1 are global singletons that encapsulate core business requirements like logging, notifications, and base access control.

### AuditService
`packages/core/src/services/audit-logs.ts`

Centralized service for system-wide audit logging, automatically handling data redaction of sensitive fields (e.g., `nationalId`, `phone`) before persistence.

```typescript
interface AuditLogData {
  userId: bigint
  action: AuditAction
  targetType?: string
  targetId?: string
  details?: Record<string, any>
}

async function log(data: AuditLogData): Promise<void>
```
**Usage Example:**
```typescript
import { auditService } from '../../services/audit-logs'

await auditService.log({
  userId: user.telegramId,
  action: AuditAction.USER_BOOTSTRAP,
  targetType: 'User',
  targetId: user.id,
  details: { role: 'SUPER_ADMIN' },
})
```

### NotificationService
`packages/core/src/services/notifications.ts`

Manages asynchronous notification queueing using BullMQ to avoid blocking the main bot event loop.

```typescript
async function queueNotification(data: NotificationJobData): Promise<string>
async function queueBulkNotifications(items: NotificationJobData[]): Promise<string[]>
```

### JoinRequestService
`packages/core/src/services/join-requests.ts`

Handles the lifecycle of incoming users before they are granted access.

```typescript
async function hasPendingRequest(telegramId: bigint): Promise<boolean>
async function create(params: CreateJoinRequestParams): Promise<JoinRequest>
async function createOrBootstrap(params: CreateJoinRequestParams): Promise<CreateOrBootstrapResult>
```
**Bootstrap Feature:** `createOrBootstrap` contains logic to check if a user should bypass the join request and automatically become `SUPER_ADMIN` if the database is completely empty and their ID matches `INITIAL_SUPER_ADMIN_ID`.

---

## Bot Utilities

Helper functions that standardize interactions inside grammY handlers/conversations.

*Located in `packages/core/src/bot/utils/`*

### Conversation Utilities (`conversation.ts`)

Standardizes how conversations ask questions, parse text, clean up prompt messages, and handle native cancellations.

#### `createMessageTracker()`
Creates a fresh message tracker to hold IDs of prompt messages for later deletion.
```typescript
interface MessageTracker {
  ids: number[]
}

export function createMessageTracker(): MessageTracker
```

#### `trackMessage()`
Records a message ID into the tracker.
```typescript
export function trackMessage(tracker: MessageTracker, messageId: number): void
```

#### `deleteTrackedMessages()`
Deletes all messages tracked by the given tracker. Called before sending the final result to clean up the conversation flow visually. Silently ignores failures (e.g., if message is already deleted or too old).
```typescript
export async function deleteTrackedMessages(
  ctx: BotContext,
  tracker: MessageTracker,
): Promise<void>
```

#### `waitForTextOrCancel()`
Sends a prompt with a cancel button and waits for text reply. Returns `null` if the user cancelled, or a `string` otherwise. Optional `tracker` allows tracking the prompt messages.
```typescript
export interface WaitForTextOptions {
  tracker?: MessageTracker
}

export async function waitForTextOrCancel(
  conversation: Conversation<ConversationFlavor & BotContext>,
  ctx: BotContext,
  prompt: string,
  options: WaitForTextOptions = {},
): Promise<string | null>
```
**Usage Example:**
```typescript
const tracker = createMessageTracker()
const wait = (prompt: string) => waitForTextOrCancel(conversation, ctx, prompt, { tracker })

const name = await wait('What is your name?')
if (name === null) {
  await deleteTrackedMessages(ctx, tracker)
  await sendCancelled(ctx, 'Flow cancelled')
}
```

#### `waitForSkippable()`
Sends a prompt with "Skip" and "Cancel" buttons for optional fields.
Returns: `null` (cancelled), `'__skip__'` (skipped), or `string` (user input).
```typescript
export interface WaitForSkippableOptions {
  tracker?: MessageTracker
  skipData?: string
}

export async function waitForSkippable(
  conversation: Conversation<ConversationFlavor & BotContext>,
  ctx: BotContext,
  prompt: string,
  skipLabel: string,
  options: WaitForSkippableOptions = {},
): Promise<string | null>
```

#### `waitForConfirm()`
Shows a confirmation message with customizable confirm/cancel buttons. Returns `true` if confirmed, `false` if cancelled.
```typescript
export interface WaitForConfirmOptions {
  tracker?: MessageTracker
  confirmData?: string
  cancelData?: string
}

export async function waitForConfirm(
  conversation: Conversation<ConversationFlavor & BotContext>,
  ctx: BotContext,
  text: string,
  options: WaitForConfirmOptions = {},
): Promise<boolean>
```

#### `sendCancelled()`
Sends a unified cancellation message with an optional retry/restart button.
```typescript
export interface SendCancelledOptions {
  retryLabel?: string
  retryData?: string
}

export async function sendCancelled(
  ctx: BotContext,
  message: string,
  options: SendCancelledOptions = {},
): Promise<void>
```

### User Input Utilities (`user-inputs.ts`)

These functions run a complete validation loop (prompting, validating, re-asking on failure) for standard Egyptian user data. They automatically normalize Arabic-Indic digits to ASCII.

#### `normalizeDigits()`
Normalizes Arabic-Indic digits (\u0660-\u0669) and Extended Persian digits (\u06F0-\u06F9) to standard ASCII 0-9.
```typescript
export function normalizeDigits(input: string): string
```

#### `askForArabicName()`
Prompts for a full Arabic name. Validates that it contains only Arabic letters, spaces, or valid name punctuation, and has a minimum of 2 characters. Returns `''` on cancel.
```typescript
export async function askForArabicName(ctx: BotContext, wait: WaitFn): Promise<string>
```

#### `generateNickname()`
Derives a display nickname from a full Arabic name by taking the first two "name units" while respecting predefined compound prefixes like `عبد`, `أبو`, `ابن`, `بنت`, `آل`.
```typescript
export function generateNickname(fullName: string): string
```
**Examples Table:**
| Raw Input | Generated Nickname |
| :--- | :--- |
| صالح رجب محمد | صالح رجب |
| عبد الله أحمد | عبد الله |
| أبو بكر حسين | أبو بكر |

#### `askForPhone()`
Prompts for an 11-digit Egyptian phone number starting with 010/011/012/015. Also ensures the number is not already registered in the DB.
```typescript
export async function askForPhone(ctx: BotContext, wait: WaitFn): Promise<string>
```

#### `askForNationalId()`
Prompts for a 14-digit Egyptian National ID. Validates format mathematically and automatically extracts the birth date and gender from the sequence.
```typescript
export interface NationalIdInfo {
  nationalId: string
  birthDate?: Date
  gender?: 'MALE' | 'FEMALE'
}

export async function askForNationalId(ctx: BotContext, wait: WaitFn): Promise<NationalIdInfo | null>
```

### Formatters (`formatters.ts`)

Helper functions to transform application models into localized textual display formats.

#### `formatArabicDate()`
Formats a `Date` object to a standard `DD/MM/YYYY` string. Returns `'value-unknown'` if undefined.
```typescript
export function formatArabicDate(date: Date | undefined | null): string
```

#### `formatGender()`
Converts a Prisma gender enum format to the matching i18n locale key (`gender-male`, `gender-female`, `gender-unknown`).
```typescript
export function formatGender(gender: 'MALE' | 'FEMALE' | undefined | null): string
```

#### `notifyAdmins()`
A helper that queues a Notification object for *all* active `ADMIN` and `SUPER_ADMIN` users system-wide using BullMQ queue.
```typescript
export interface AdminNotificationPayload {
  type: NotificationType
  params?: Record<string, string>
}

export async function notifyAdmins(payload: AdminNotificationPayload): Promise<void>
```

### UI & Navigation (`reply.ts`)

Standardizes how the bot transitions between menus and states to avoid message stacking in the user's chat history.

#### `replyOrEdit()`
Dynamically decides whether to edit the existing message (if triggered by an inline button callback) or send a new message (if triggered by a text command like `/start`).
```typescript
export async function replyOrEdit(
  ctx: BotContext,
  text: string,
  replyMarkup?: InlineKeyboard,
): Promise<void>
```

#### Global Back Navigation
The platform enforces a strict UX guideline: no dead-ends. All sub-menus must eventually provide an escape hatch back to the main menu. This is globally handled in `packages/core/src/bot/index.ts` by intercepting the `menu:main` callback string and routing it to the root `menuHandler`.

---

## Middleware

The middleware chain layers core functionality before business logic handlers run.

### Draft Middleware
`packages/core/src/bot/middleware/draft.ts`

Central state management middleware that powers the conversational modules. It ensures users never lose their place if they are interrupted, and handles global module cancellations.

- **Auto-Save:** Runs `await next()` first. If the request was part of a conversation flow, it automatically saves the `ctx.session.conversations` object and an `updatedAt` timestamp to the session storage *after* the handler finishes.
- **State Storage:** Uses `ctx.session.conversations` as defined by `@grammyjs/conversations`.
- **Command Interrupts:** If a user sends a global command (`/start`, `/menu`, `/cancel`, `/help`) while inside a conversational flow, the middleware catches it. It wipes the active conversation state from `ctx.session`, notifies the user the flow was cancelled (`module-kit-cancelled`), and allows the command handler to execute safely.

### Session Middleware
`packages/core/src/bot/middlewares/session.ts`

Configures grammY's session logic backed by an ioredis instance.

#### `SessionData` Structure
```typescript
interface SessionData {
  userId?: number // Telegram ID if authenticated
  role: 'VISITOR' | 'ADMIN' | 'SUPER_ADMIN'
  language: 'ar' | 'en' // Display language preference
  __language_code: string // Internal grammY i18n
  currentSection: string | null // Active module slug (e.g. 'leave-requests')
  currentModule: string | null // Specific conversational flow
  lastActivity: number // Timestamp for expiry logic
  conversations?: Record<string, any> // grammY conversation state
}
```

- **Lazy Session Tracking:** Includes a `lazySessionMiddleware` (FR-026 + T066-B) that detects when an existing user interacts with the bot after their session expired. It transparently logs `USER_LOGOUT` (reason: `session_expired_lazy`) followed by `USER_LOGIN` returning them to the authenticated state without forcing them to re-join.

### Error Middleware
`packages/core/src/bot/middlewares/error.ts`

Global generic error boundary spanning all bot activity.

- **Pino Logging:** In the event of an uncaught exception, logs `{ err, userId, chatId, update }` ensuring no error completely sinks the process silently.
- **Fallback UI:** Sends the `error-generic` i18n key back to the user to gracefully recover instead of completely freezing.

---

## Handlers

### /start Flow
`packages/core/src/bot/handlers/start.ts`

The universal entry point for all users interacting with the bot.

- **New Users (Unregistered):**
  If `ctx.user` is not populated (or role is `VISITOR`), the bot checks if they have a pending `join-request`.
  - If pending: Sends a "Please wait for approval" message.
  - If no request: Starts the onboarding `joinConversation` to collect Name, Phone, and National ID.
  - **Auto-Bootstrap:** If the database has 0 users, the first person to hit `/start` with the designated `INITIAL_SUPER_ADMIN_ID` bypasses the join request and is instantly granted `SUPER_ADMIN`.

- **Registered Users:**
  If the user is authenticated (e.g., `EMPLOYEE`, `ADMIN`, `SUPER_ADMIN`), they are greeted and immediately presented with the role-based main menu.

### Menu System
`packages/core/src/bot/handlers/menu.ts`

Dynamically renders an `InlineKeyboard` based on the user's explicit role and permissions. It evaluates `ctx.user.role`. The bot relies exclusively on inline keypads combined with `replyOrEdit` to provide a clean, app-like navigation experience without polluting the chat history.

- **SUPER_ADMIN Menu:**
  Sees all operational buttons, including system-wide "Join Requests" approval queues and "Platform Settings".
- **ADMIN Menu:**
  Sees buttons scoped to their allowed sections (via `AdminScope`). Can view "Join Requests" if they have permission to approve members for their scopes.
- **EMPLOYEE Menu:**
  Sees standard operational modules they have `view` permission for, plus "My Profile" and "Common Settings".
- **VISITOR Menu:**
  Visitors do not get a menu; they are restricted to the `/start` gate.

---

**See Also:** [Module Kit Reference](module-kit-reference.md) | [Architecture Overview](architecture.md)
