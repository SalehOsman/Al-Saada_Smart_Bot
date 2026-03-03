# Module Kit Reference (Layer 2)

**Last Updated:** 2026-03-03

## 1. Overview
The Module Kit (`packages/module-kit/`) establishes the standard framework for creating scalable business features (Layer 3 Modules) in the Al-Saada Smart Bot. It provides a standardized Public API for conversational validation, confirmations, state persistence, structured definitions, and PII masking.

## 2. Public API
Exported globally via `packages/module-kit/src/index.ts`. All modules should rely exclusively on this uniform API:
- `defineModule(config: ModuleDefinition): ModuleDefinition`
- `validate<T>(...): Promise<any>`
- `confirm<T>(...): Promise<boolean>`
- `save<T>(...): Promise<void>`

---

## 3. `defineModule()` Deep Dive

The fundamental builder function for registering a module.

```typescript
export function defineModule(config: ModuleDefinition): ModuleDefinition {
  return config
}
```

### `ModuleDefinition` interface
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `slug` | `string` | Yes | Unique identifier (e.g., "leave-requests") |
| `sectionSlug` | `string` | Yes | Slug of the parent Section |
| `name` | `string` | Yes | Primary Arabic display name (i18n key) |
| `nameEn` | `string` | Yes | English display name (i18n key) |
| `icon` | `string` | Yes | Emoji icon for UI representation |
| `permissions` | `object` | Yes | Granular role-based access arrays (view, create, edit, delete) |
| `draftTtlHours` | `number` | No | Redis TTL for conversation drafts (defaults to 24) |
| `orderIndex` | `number` | No | Order in the Section's menu UI |
| `addEntryPoint` | `Function` | Yes | The primary grammY conversation handler |
| `editEntryPoint` | `Function` | No | The edit flow grammY conversation handler |
| `auditAction` | `AuditAction` | No | Optional audit action override (fallback: `MODULE_CREATE`) |

---

## 4. `validate()` Deep Dive

A robust wrapper around `conversation.waitFor('message:text')` providing an automated prompt -> validate -> retry loop.

```typescript
export async function validate<T>(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
  options: ValidateOptions<T>
): Promise<any>
```

### Parameters (`ValidateOptions<T>`)
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `promptKey` | `string` | Yes | i18n key for the initial question |
| `errorKey` | `string` | Yes | i18n key when validation fails |
| `field` | `keyof T` | Yes | The draft mapping field name |
| `validator` | `(val: string) => boolean \| Promise<boolean>` | Yes | Custom logic to pass/fail the state |
| `formatter` | `(val: string) => any` | No | Formats raw text before returning (e.g., `parseInt`) |
| `maxRetries` | `number` | No | Allowed attempts before forced exit (Default: 3) |

**Return Type:** Returns the formatted validated data, or `undefined` if cancelled via limits or Native command interruption.

### Internal Behaviors
- **Max Retries Exceeded:** After `maxRetries` failed attempts, sends the `module-kit-max-retries-exceeded` i18n key and returns `undefined`.
- **Command Interruption:** Detects inputs starting with `/cancel`, `/start`, or `/menu`. The validation loop intelligently yields undefined to unblock the draft middleware's global reset hook.

**Usage Example:**
```typescript
const amount = await validate(conversation, ctx, {
  field: 'amount',
  promptKey: 'fuel.prompt.amount',
  errorKey: 'fuel.error.amount',
  validator: val => !Number.isNaN(Number(val)) && Number(val) > 0,
  formatter: val => Number(val),
})
```

---

## 5. `confirm()` Deep Dive

Creates a dynamic confirmation summary UI allowing targeted edits to draft fields.

```typescript
export async function confirm<T>(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
  options: ConfirmOptions<T>
): Promise<boolean>
```

### Parameters (`ConfirmOptions<T>`)
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `data` | `T` | Yes | The fully hydrated Draft payload |
| `labels` | `Record<keyof T, string>` | Yes | Object mapping Draft fields to their i18n label keys |
| `editableFields` | `(keyof T)[]` | Yes | Array of properties the user can choose to edit inline |
| `reAsk` | `(field: keyof T) => Promise<void>` | Yes | Callback function responsible for prompting the user again |

**Return Type:** Returns `true` on Confirm, `false` on Cancel.

### Internal Behaviors
- Maps `editableFields` properties to inline keyboard buttons.
- Captures the callback, invokes `reAsk(field)`, then generates an updated presentation summary automatically until either confirmation or cancellation events.
- **Known Limitations (BL-004):** Does not support nested conditional re-asking cascades (i.e., changing "A" does not automatically force the user to provide a new answer to "B" unless custom handled).

---

## 6. `save()` Deep Dive

Unified persistence boundary executing database commits alongside guaranteed systemic audit/notification behaviors.

```typescript
export async function save<T>(
  ctx: BotContext,
  options: SaveOptions<T>
): Promise<void>
```

### Parameters (`SaveOptions<T>`)
| Name | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `moduleSlug` | `string` | Yes | The module identifier doing the save |
| `action` | `(prisma: PrismaClient) => Promise<any>` | Yes | Callback with Prisma context |
| `audit` | `object` | Yes | Metadata mapping `action` and `targetType` against `AuditAction` enum |

### Internal Behaviors
1. Executes `action()` against `PrismaClient`.
2. Automatically pushes an AuditLog carrying `maskPII(details)`.
3. Notifies admins internally via `notifyScopedAdmins()` - locates the Parent Section then queues the task using `queueNotification` for `SUPER_ADMIN` and specialized Section `ADMIN` IDs.
4. Purges the Redis session Draft matching `draft:{userId}:{moduleSlug}`.

**Error Handling:** Catches and logs errors via Pino, responds via `module-kit-save-failed` i18n text, and subsequently throws to optionally block conversation closure (allowing a retry) (Fixes B1).

**Usage Example:**
```typescript
await save(ctx, {
  moduleSlug: 'leave-requests',
  action: async prisma => prisma.leaveRequest.create({ data }),
  audit: { action: 'MODULE_CREATE', targetType: 'LeaveRequest', details: data }
})
```

---

## 7. Draft System Deep Dive

Draft storage prevents data loss from interrupts using `packages/core/src/bot/middleware/draft.ts` natively integrated on all conversational state endpoints.

- **Auto-Save Middleware:** `session.conversations` is persistently snapped to stringified JSON in Redis after the Bot handler fully returns via `await next()`.
- **Redis Key:** Formatted specifically as `draft:{userId}:{moduleSlug}`.
- **TTL Constraint:** Drafts inherently conform to the module definition `draftTtlHours` config or the 24H system default.
- **Command Interruption Recovery:** The draft middleware wipes conversational state forcefully when detecting `/menu` or `/start`, enabling clean breaks while preserving Redis.
- **Resume Capability (FR-009):** The main add conversational hook actively scans Redis for prior keys and optionally resumes using stored conversational snapshots upon re-invoking a module.

---

## 8. ModuleLoader Deep Dive

Located in `packages/core/src/bot/module-loader.ts`, handles discovery logic for independent Layer 3 Module packages via `loadModules()`.

- **Discovery Scan:** Reads `modules/` shallow directory targeting `config.ts` entries dynamically matching directory slugs against config implementations.
- **Registration Pipeline:**
  1. Mounts locale definitions directly into the `i18n` Fluent runtime natively.
  2. Mounts `addEntryPoint` (and optional `editEntryPoint`) as new global conversations scoped specifically by `bot.use(createConversation(...))`.
  3. Uses `prisma.module.upsert` to sync Section IDs and configuration state automatically on bootstrap.
- **Performance Threshold:** Implements a strict < 5000ms SLA for complete iteration loading (Target QA-001).
- **Error Propagation:** Fails gracefully per-module while booting. Dispatches error details context via Telegram directly to system `SUPER_ADMIN`s.

---

## 9. CLI Tools

Developer workflow scripts located inside `scripts/`.

### `npm run module:create`
Starts `tsx scripts/module-create.ts`. Interactively scaffolds a module framework requiring a matching slug identifier. Non-interactive via `--non-interactive`. Generates boilerplate for `config.ts`, conversations, testing, package.json, and `ar/en.ftl` locales. Copies `schema.prisma` automatically up to `prisma/schema/modules/` and invokes `npx prisma generate`.

### `npm run module:list`
Displays a quick debug table (`console.table`) of all recognized plugins in `modules/` including their configuration parameters and load stability.

### `npm run module:remove`
Purges a specified slug directory iteratively alongside ripping corresponding prisma sub-schemas gracefully. *Note: Databases are not dropped automatically, migrations are mandatory subsequently.*

---

## 10. Known Limitations & Planned Improvements

| Code | Description | Roadmap Status |
| :--- | :--- | :--- |
| **BL-001** | Support uploading images seamlessly through validation parameters. | Planned V2 |
| **BL-002** | Export utility handling cross-module data joins automatically. | Deferred |
| **BL-003** | Auto-registration of Module Kit validation loops with system Audit failures. | Planned V1.5 |
| **BL-004** | Nested conditional dependencies requiring subsequent validation resends in `confirm()`. | In Review |
