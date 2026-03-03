# Platform Core Reference (Layer 1)

**Last Updated:** 2026-03-03

The Platform Core (`packages/core/`) provides the foundational services, utilities, middleware, and database connections that support the entire bot.

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
Standardizes how conversations ask questions, parse text, and handle cancellations natively.

### User Input Utilities (`user-inputs.ts`)
Functions for validating standard input formats before hitting business logic. (e.g., standardizing Arabic strings, phone numbers).

### Formatters (`formatters.ts`)
Formatting logic for rendering data uniformly to the user (e.g., transforming a Prisma object into a localized HTML summary string).

---

## Middleware

The middleware chain structures the incoming Update object.

### Draft Middleware
`packages/core/src/bot/middleware/draft.ts`

Layer 2 logic placed in Layer 1 bot initialization. This middleware catches all Updates and manages Redis-based Draft states for the conversational modules.
- **Auto-Save:** Saves `ctx.session.conversations` state automatically after the handler finishes execution.
- **Interrupt Handling:** Automatically resets drafts and terminates active conversations when global commands (`/start`, `/menu`, `/cancel`) are detected.

### Session Middleware
`packages/core/src/bot/middleware/session.ts`
Initializes GramMY sessions backed by the `RedisAdapter`.

### Error Middleware
`packages/core/src/bot/middleware/error.ts`
Global error boundary. Catches all synchronous and asynchronous errors, logs them using Pino, and sends a safe fallback message `error-generic` to the user.

---

## Handlers

### /start Flow
`packages/core/src/bot/handlers/start.ts`
The universal entry point. If `ctx.user` is populated (by Auth middleware), it shows the role-based main menu. If not, it enters the `join-request` / bootstrap logic.

### Menu System
`packages/core/src/bot/handlers/menu.ts`
Renders the role-specific commands that the user is authorized for, checking if they are a `SUPER_ADMIN`, `ADMIN`, or standard user.
