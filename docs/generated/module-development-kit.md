# Module Development Kit

The `module-kit` package provides a set of standardized utilities designed to streamline the development of new modules for the Telegram bot. It encapsulates common patterns such as user input validation, confirmation screens, module definition, and robust data persistence with built-in auditing and notifications.

By leveraging this kit, developers can focus on the core logic of their modules, ensuring consistency in user experience, security, and integration with the broader platform services.

## Core Concepts

The Module Development Kit is built around a few core concepts:

*   **`ModuleDefinition`**: A comprehensive configuration object that defines the metadata, permissions, and entry points for any given module.
*   **`BotContext`**: An extended grammY context that provides access to internationalization (`ctx.t`) and other core services, ensuring a consistent environment for module interactions.
*   **Conversations**: The kit heavily relies on `@grammyjs/conversations` for managing multi-step user interactions, making complex flows manageable.

## Key Components

### 1. `defineModule`

The `defineModule` function is the entry point for defining a new module's configuration. It ensures that all essential metadata is present and correctly formatted.

*   **Purpose**: To validate and freeze a module's configuration, enforcing consistency and immutability.
*   **Usage**:
    ```typescript
    import { defineModule } from '@module-kit'
    import { Role } from '@prisma/client'

    const myModuleConfig = defineModule({
      slug: 'my-awesome-module',
      sectionSlug: 'general-tools',
      name: 'module-my-awesome-module-name', // i18n key
      nameEn: 'module-my-awesome-module-name-en', // i18n key
      icon: '✨',
      permissions: {
        view: [Role.USER, Role.ADMIN],
        create: [Role.USER],
        edit: [Role.ADMIN],
        delete: [Role.ADMIN],
      },
      addEntryPoint: async (conversation, ctx) => {
        // ... module creation logic
      },
      // ... other optional fields
    })
    ```
*   **Validation**:
    *   Ensures all required fields (`slug`, `sectionSlug`, `name`, `nameEn`, `icon`, `permissions`, `addEntryPoint`) are provided.
    *   Validates the `slug` format (lowercase, hyphen-separated, e.g., `fuel-entry`).
    *   Checks that `permissions.view` is not empty.
*   **Output**: Returns a deep-frozen `ModuleDefinition` object, preventing accidental modifications at runtime.

### 2. `validate`

The `validate` function provides a standardized way to prompt users for input, apply validation rules, and handle retries.

*   **Purpose**: To guide users through input prompts, validate their responses, and offer retries for invalid input.
*   **Usage**:
    ```typescript
    import { validate } from '@module-kit'

    async function askForQuantity(conversation, ctx) {
      const quantity = await validate(conversation, ctx, {
        promptKey: 'module-fuel-entry-prompt-quantity',
        errorKey: 'module-fuel-entry-error-quantity-invalid',
        field: 'quantity',
        validator: (text) => {
          const num = Number(text)
          return !isNaN(num) && num > 0
        },
        formatter: text => Number(text),
        maxRetries: 2,
      })

      if (quantity === undefined) {
        // User cancelled or max retries exceeded
        await ctx.reply(ctx.t('module-fuel-entry-cancelled'))
      }
      // Use the valid quantity
    }
    ```
*   **Flow**:
    1.  Sends an initial prompt message (`promptKey`).
    2.  Waits for a text message from the user.
    3.  Checks for common command interrupts (`/cancel`, `/start`, `/menu`). If detected, returns `undefined`.
    4.  Applies the provided `validator` function.
    5.  If valid, applies the `formatter` (if provided) and returns the result.
    6.  If invalid, sends an error message (`errorKey`) and retries, up to `maxRetries`.
*   **Returns**: The formatted valid input, or `undefined` if the user cancels or `maxRetries` are exceeded.

### 3. `confirm`

The `confirm` function presents a summary of collected data to the user, allowing them to review, confirm, or selectively edit fields.

*   **Purpose**: To display a summary of user-provided data and enable targeted editing before final submission.
*   **Usage**:
    ```typescript
    import { confirm } from '@module-kit'

    async function reviewAndConfirm(conversation, ctx, draftData, reAskFunction) {
      const confirmed = await confirm(conversation, ctx, {
        data: draftData,
        labels: {
          item: 'module-item-label',
          quantity: 'module-quantity-label',
        },
        editableFields: ['item', 'quantity'],
        reAsk: reAskFunction, // A function that re-prompts for a specific field
      })

      if (confirmed) {
        await ctx.reply(ctx.t('module-data-confirmed'))
        // Proceed to save
      }
      else {
        await ctx.reply(ctx.t('module-data-cancelled'))
        // Abort or restart
      }
    }
    ```
*   **Flow**:
    1.  Constructs a summary message using `data` and `labels`.
    2.  Generates an inline keyboard with "Confirm", "Cancel", and "Edit [Field]" buttons for each `editableFields` entry.
    3.  Sends the summary and keyboard.
    4.  Waits for a callback query response.
    5.  If `confirm`, returns `true`.
    6.  If `cancel`, returns `false`.
    7.  If `edit:[field]`, it calls the provided `reAsk` function with the field name, allowing the module to re-prompt for that specific piece of data. The loop then restarts, displaying the updated summary.
*   **Returns**: `true` if the user confirms, `false` if they cancel.

### 4. `save`

The `save` function is the central utility for persisting data, ensuring consistent auditing, admin notifications, and draft management.

*   **Purpose**: To encapsulate database write operations with automatic auditing, admin notifications, and Redis draft cleanup.
*   **Usage**:
    ```typescript
    import { save } from '@module-kit'
    import { AuditAction } from '@prisma/client'

    async function saveFuelEntry(ctx, entryData) {
      await save(ctx, {
        moduleSlug: 'fuel-entry',
        action: async (prisma) => {
          await prisma.fuelEntry.create({ data: entryData })
        },
        audit: {
          action: AuditAction.MODULE_CREATE,
          targetType: 'FuelEntry',
          details: entryData,
        },
      })
      await ctx.reply(ctx.t('module-fuel-entry-saved'))
    }
    ```
*   **Flow**:
    1.  **Database Action**: Executes the provided `options.action` callback, which performs the actual database write using the `prisma` client.
    2.  **Audit Logging**:
        *   Calls `maskPII` to redact sensitive information from `audit.details`.
        *   Logs the operation to the audit service using `auditService.log`.
    3.  **Admin Notifications**:
        *   Calls `notifyScopedAdmins` to identify and notify relevant administrators (section-scoped and super admins).
        *   Uses `serializeParams` to flatten `audit.details` for notification parameters.
    4.  **Draft Cleanup**: Deletes the user's Redis draft for the current module (`draft:${userId}:${moduleSlug}`).
    5.  **Error Handling**: If any step fails, it logs the error, sends a generic failure message to the user (`module-kit-save-failed`), and *crucially, does not delete the Redis draft*, allowing the user to potentially resume their input. The error is then re-thrown for upstream handling.

#### `save` Execution Flow

```mermaid
sequenceDiagram
    participant M as Module Conversation
    participant MK as module-kit:save()
    participant DB as Prisma (Database)
    participant AS as Audit Service
    participant NS as Notification Service
    participant R as Redis
    participant ML as Module Loader
    participant L as Logger

    M->>MK: call save(ctx, options)
    activate MK
    MK->>DB: options.action(prisma) (execute DB write)
    DB-->>MK: Success/Failure
    alt Success
        MK->>MK: maskPII(audit.details)
        MK->>AS: auditService.log(maskedDetails)
        AS-->>MK:
        MK->>MK: notifyScopedAdmins(moduleSlug, payload)
        activate MK as notifyScopedAdmins
        MK->>ML: moduleLoader.getModule(moduleSlug)
        ML-->>MK: ModuleDefinition
        MK->>DB: Query Section & Module IDs
        DB-->>MK: Section & Module IDs
        MK->>DB: Query AdminScopes & SUPER_ADMINs
        DB-->>MK: Admin User IDs
        loop For each Admin
            MK->>NS: queueNotification(targetUserId, type, params)
            NS-->>MK:
        end
        deactivate MK as notifyScopedAdmins
        MK->>R: redis.del(`draft:${userId}:${moduleSlug}`)
        R-->>MK:
        MK-->>M: Promise<void> (resolved)
    else Failure
        MK->>L: logger.error(...)
        MK->>M: ctx.reply('module-kit-save-failed')
        MK--xM: Throws error (draft not deleted)
    end
    deactivate MK
```

### 5. `maskPII`

A utility function used internally by `save` to protect sensitive user data.

*   **Purpose**: To redact Personally Identifiable Information (PII) from data objects before they are stored in audit logs.
*   **How it works**: Iterates through the provided `data` object (and recursively into nested objects). It identifies fields named `phone`, `nationalId`, and `taxId` (case-insensitive) and replaces their values with masked versions.
    *   **Phone**: `+20*******12` (country code + last 2 digits) or `XXX*******YY` (first 3 + last 2 for other formats).
    *   **National ID**: `XXX***********` (first 3 digits).
    *   **Other PII**: `***MASKED***`.

### 6. `notifyScopedAdmins` (Internal to `persistence.ts`)

This internal helper function within `persistence.ts` is responsible for determining which administrators should receive notifications about a module operation.

*   **Purpose**: To resolve relevant administrators based on module and section scope and queue notifications for them.
*   **How it works**:
    1.  Retrieves the `ModuleDefinition` from `moduleLoader` to get the `sectionSlug`.
    2.  Queries the database (`prisma`) to find the `Section.id` and `Module.id` corresponding to the slugs.
    3.  Identifies administrators with `AdminScope` for the specific `sectionId` (either section-wide or module-specific).
    4.  Fetches all `SUPER_ADMIN` users.
    5.  Collects all unique `telegramId`s of these administrators.
    6.  Queues a notification for each identified admin using `queueNotification`.

### 7. `serializeParams` (Internal to `persistence.ts`)

Another internal helper for `persistence.ts`.

*   **Purpose**: To convert complex objects into a flat `Record<string, string>` suitable for notification parameters.
*   **How it works**: Iterates through an object, converting all values to strings. Nested objects are `JSON.stringify`'d to ensure they can be passed as simple string parameters in notifications.

## Integration Points

The `module-kit` integrates with several core services and components of the platform:

*   **`@grammyjs/conversations`**: Essential for managing multi-step user interactions in `validate` and `confirm`.
*   **`@core/database/prisma`**: The `save` function directly uses the `prisma` client for database operations.
*   **`@core/services/audit-logs`**: `save` logs all persistence operations to the audit service.
*   **`@core/services/notifications`**: `save` (via `notifyScopedAdmins`) queues notifications for relevant administrators.
*   **`@core/cache/redis`**: `save` manages the deletion of user conversation drafts stored in Redis.
*   **`@core/bot/module-loader`**: `notifyScopedAdmins` uses the `moduleLoader` to retrieve module configurations.
*   **`@core/utils/logger`**: Used for logging errors and warnings within the kit.
*   **`@core/types/context`**: Extends the base `BotContext` with platform-specific utilities like `ctx.t` (i18n).

## Error Handling

*   **`defineModule`**: Throws `Error` if the module definition is invalid or missing required fields.
*   **`validate`**: Returns `undefined` if validation fails repeatedly or the user interrupts the conversation. It does not throw for validation failures, allowing the calling conversation to handle the `undefined` result.
*   **`confirm`**: Returns `true` or `false` based on user interaction, not throwing errors for user choices.
*   **`save`**: Catches errors during the database `action`, audit logging, or notification process. It logs the error, sends a user-friendly message, and re-throws the error to allow the calling conversation to react (e.g., by ending the conversation). Importantly, it *preserves the Redis draft* on error, enabling users to potentially resume.
