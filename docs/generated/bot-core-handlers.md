# Bot Core & Handlers

This document describes the **Bot Core & Handlers** module, which forms the central nervous system of the Telegram bot. It is responsible for receiving updates from Telegram, processing them through a series of middlewares, routing them to appropriate handlers or conversations, and managing the bot's overall interaction logic, including dynamic extensibility via modules.

## 1. Architecture Overview

The bot is built using the `grammy` framework, leveraging its middleware and conversation plugins. It runs as a webhook server using `Hono`, receiving updates from Telegram and processing them asynchronously.

At a high level, the flow is:

1.  Telegram sends an update (message, callback query, etc.) to the `/webhook` endpoint.
2.  The `Hono` application receives the update and passes it to `bot.handleUpdate()`.
3.  `grammy` processes the update through a chain of registered middlewares.
4.  After middlewares, the update is routed to specific command handlers, callback query handlers, or multi-step conversations based on its content.
5.  Handlers and conversations interact with various services (database, Redis, external APIs) to perform business logic and generate responses.

```mermaid
graph TD
    A[Telegram Webhook] --> B(Hono App: /webhook)
    B --> C(bot.handleUpdate(update))
    C --> D{Middleware Stack}
    D -- Session, RBAC, i18n, Draft --> E(Conversations)
    E -- joinConversation --> F(User Input Steps)
    E -- Module-specific --> G(Module Flows)
    D --> H{Handlers}
    H -- /start --> I(startHandler)
    H -- /menu --> J(menuHandler)
    H -- /users --> K(usersHandler)
    H -- approve/reject --> L(approvalsHandler)
    H -- mod: --> M(Module Entry Point)
    H -- dr: --> N(Draft Recovery)
    H -- Other messages --> O(fallbackHandler)
    F & G & I & J & K & L & M & N & O --> P(Bot Response)
```

## 2. Core Bot Initialization (`packages/core/src/bot/index.ts`)

This file is the entry point for the `grammy` bot instance. It sets up the bot, registers global middlewares, and defines the primary command and callback query handlers.

### 2.1. Middleware Stack

Middlewares are functions that process every incoming update before it reaches specific handlers. Their order is crucial:

*   **`errorHandler`**: Catches and logs errors occurring during update processing.
*   **`hydrate()`**: A `grammy` plugin that adds useful methods to the `ctx` object (e.g., `ctx.editMessageText`).
*   **`sessionMiddleware`**: Manages user sessions, storing data in Redis.
*   **`lazySessionMiddleware`**: Tracks user logins for auditing purposes.
*   **`rbacMiddleware`**: Role-Based Access Control, populating `ctx.session.role` and checking user activity (T111, T029).
*   **`i18n`**: Internationalization middleware, providing `ctx.t()` for localized messages.
*   **`draftMiddleware`**: Handles auto-saving and restoring conversation drafts (T010, T011).
*   **`conversations()`**: The `grammy` plugin enabling multi-step conversations.
*   **`moduleLoader.loadModules()`**: Asynchronously discovers and registers dynamically loaded modules. This is a critical step for extensibility.
*   **`sanitizeMiddleware`**: Cleanses incoming text messages to prevent injection or unexpected behavior (FR-033).

### 2.2. Conversation Registration

*   `bot.use(createConversation(joinConversation, 'join'))`: Registers the `joinConversation` for new user onboarding. Dynamically loaded modules also register their conversations here via `moduleLoader`.

### 2.3. Global Handlers

*   **`/start` command**: Handled by `startHandler`.
*   **`/menu` command**: Handled by `menuHandler`.
*   **`/users` command**: Handled by `usersHandler` (Super Admin only).
*   **`start_join` callback query**: Initiates the `joinConversation` (e.g., after a cancellation).
*   **`user:` callback queries**: Routes to `userActionsHandler` for user management.
*   **`(approve|reject):` callback queries**: Routes to `approvalsHandler` for join request processing.
*   **`mod:` callback queries**: The entry point for dynamically loaded modules. It checks RBAC permissions, looks for existing drafts, and then enters the module's `addEntryPoint` conversation.
*   **`dr:` callback queries**: Handles draft recovery actions (resume or start fresh) for modules.
*   **`bot.on('message', fallbackHandler)`**: A catch-all for any message type not handled by previous specific handlers or conversations.

## 3. Handlers

Handlers are functions that respond to specific commands, callback queries, or message types.

### 3.1. `startHandler` (`bot/handlers/start.ts`)

This is the initial entry point for users interacting with the bot (e.g., after clicking a Telegram bot link).

**Execution Flow:**

1.  Retrieves `telegramId` from `ctx`.
2.  **Checks for existing user**: Queries `prisma.user` for the `telegramId`.
    *   If found, calls `menuHandler` to display the main menu.
3.  **Checks for pending join request**: If no existing user, queries `prisma.joinRequest` for a pending request.
    *   If found, informs the user about their pending request.
4.  **Initiates join conversation**: If no existing user and no pending request, `ctx.conversation.enter('join')` is called to start the onboarding process.
5.  Error handling: Logs and replies with a generic error message.

### 3.2. `menuHandler` (`bot/handlers/menu.ts`)

Displays the main menu to the user, dynamically adapting based on their role and assigned administrative scopes.

**Execution Flow:**

1.  Retrieves `telegramId` and fetches the `User` record from `prisma`, including `adminScopes`.
2.  If the user is not found or inactive, replies with `user-inactive`.
3.  Logs `MENU_ACCESS` via `auditService`.
4.  Calls `getAuthorizedModules(user)`:
    *   Retrieves all loaded modules from `moduleLoader`.
    *   Filters modules based on `user.role` and `user.adminScopes` (for `ADMIN` role, checks `sectionSlug` against scoped sections).
5.  Calls `showDynamicMenu(ctx, user, modules)`:
    *   Constructs an `InlineKeyboard` with role-specific system buttons (e.g., "Users", "Sections" for Super Admins).
    *   Appends buttons for each `authorized module`, using its `icon` and `name`.
6.  Sends the menu message.
7.  Error handling: Logs and replies with a generic error.

### 3.3. `usersHandler` & `userActionsHandler` (`bot/handlers/users.ts`)

Provides Super Admin functionality for managing users within the system.

*   **`usersHandler`**: Triggered by `/users` command. Lists the first 10 users with their status and role, providing inline buttons to `user:view:<telegramId>`.
*   **`userActionsHandler`**: Handles callback queries starting with `user:`.
    *   **`user:view:<telegramId>`**: Calls `showUserDetails` to display detailed information and management options for a specific user.
    *   **`user:toggle:<telegramId>`**: Toggles `isActive` status. If deactivated, it clears the user's session from `redis` to force a logout.
    *   **`user:role:<telegramId>:<newRole>`**: Updates the user's `role` in `prisma`.
    *   **`user:scopes:<telegramId>`**: Calls `showUserScopes` to manage admin scopes for an `ADMIN` user.
    *   **`user:scope_assign:<telegramId>:<sectionId>`**: Assigns a new admin scope via `adminScopeService.assignScope()`.
    *   **`user:scope_revoke:<telegramId>:<sectionId>`**: Revokes an admin scope via `adminScopeService.revokeScope()`.

**Internal Helpers:**

*   **`showUserDetails(ctx, telegramId)`**: Fetches user details, constructs an inline keyboard with buttons for toggling status, changing role, and managing scopes (if `ADMIN`).
*   **`showUserScopes(ctx, telegramId)`**: Lists current scopes for an admin and provides options to assign/revoke scopes from available sections. Interacts with `adminScopeService.getScopes()` and `prisma.section`.

### 3.4. `approvalsHandler` (`bot/handlers/approvals.ts`)

Processes callback queries for approving or rejecting join requests.

**Execution Flow:**

1.  Parses `action` (`approve` or `reject`) and `requestId` from the callback query.
2.  Performs an **atomic transaction** using `prisma.$transaction`:
    *   Fetches the `JoinRequest` to ensure it's `PENDING`. If not, returns an `already-handled` error.
    *   If `approve`:
        *   `upsert`s a `User` record (creating if new, updating if existing) with `Role.EMPLOYEE` and `isActive: true`.
        *   Updates the `JoinRequest` status to `APPROVED`.
    *   If `reject`:
        *   Updates the `JoinRequest` status to `REJECTED`.
3.  If `already-handled`, informs the admin and updates the message.
4.  On successful approval/rejection:
    *   Queues a notification for the target user via `queueNotification()` (e.g., `JOIN_REQUEST_APPROVED`).
    *   Answers the callback query and edits the original message to reflect the outcome.
5.  Logs the action via `logger`.
6.  Error handling: Logs and replies with a generic error.

### 3.5. `fallbackHandler` (`bot/handlers/fallback.ts`)

A simple handler that replies with a generic "unsupported message" error (`errors-unsupported-message`) for any message type not caught by other, more specific handlers or conversations.

## 4. Conversations

Conversations enable multi-step interactions with users, maintaining state across multiple messages.

### 4.1. `joinConversation` (`bot/conversations/join.ts`)

Guides new users through the process of submitting a join request or, for the `INITIAL_SUPER_ADMIN_ID`, bootstrapping as the first Super Admin.

**Key Features:**

*   **Multi-step flow**:
    1.  Asks for Full Arabic Name (`askForArabicName`).
    2.  Asks for Nickname (optional, `waitForSkippable`, auto-generates if skipped).
    3.  Asks for Egyptian Phone Number (`askForPhone`).
    4.  Asks for Egyptian National ID (`askForNationalId`), which extracts birth date and gender.
    5.  Confirmation screen (`waitForConfirm`).
*   **`createMessageTracker()`**: Used to track all messages sent during the conversation.
*   **`deleteTrackedMessages()`**: Ensures all conversation-related messages are deleted before the final result, providing a clean UX.
*   **Cancellation**: The `cancel()` helper function handles cleanup and provides a retry button.
*   **`joinRequestService.createOrBootstrap()`**: This service call handles the core logic of either creating a new `JoinRequest` or bootstrapping the first user as a `SUPER_ADMIN`.
*   **Admin Notification**: If a join request is created, `notifyAdmins()` is called to alert administrators.
*   **Error Handling**: Cleans up tracked messages on error.

## 5. Module Loader (`packages/core/src/bot/module-loader.ts`)

The `ModuleLoader` is a critical component for the bot's extensibility, allowing new features to be added as independent modules without modifying the core.

**Purpose:**

*   **Dynamic Discovery**: Scans the `modules` directory for new modules.
*   **Configuration Loading**: Dynamically imports `config.ts` from each module to get its `ModuleDefinition`.
*   **i18n Integration**: Loads module-specific locale files (`ar.ftl`, `en.ftl`) into the global `i18n` instance.
*   **Conversation Registration**: Registers module-defined `addEntryPoint` and `editEntryPoint` conversations with `grammy`.
*   **Database Synchronization**: `upsert`s module records in `prisma.module`, linking them to `Section`s.
*   **Error Handling**: Catches loading errors and `notifyAdminsOfFailure()` to alert Super Admins.
*   **Performance Monitoring**: Logs loading duration (QA-001).

**Key Methods:**

*   **`loadModules(bot: Bot<BotContext>)`**: The main method, called during bot initialization (`bot/index.ts`). It orchestrates the entire loading process.
*   **`loadModuleLocales(slug, localesDir)`**: Handles loading `ar.ftl` and `en.ftl` files for a given module.
*   **`notifyAdminsOfFailure(bot, slug, reason)`**: Sends a Telegram message to all active Super Admins if a module fails to load.
*   **`getLoadedModules()`**: Returns a sorted list of successfully loaded modules.
*   **`getModule(slug)`**: Retrieves a specific loaded module by its slug.

## 6. Internationalization (`packages/core/src/bot/i18n.ts`)

The bot uses `@grammyjs/i18n` with Fluent syntax for internationalization.

*   **`i18n` instance**: Created with `defaultLocale: 'ar'` and `directory` pointing to `../locales`.
*   **Module Integration**: The `ModuleLoader` extends this by dynamically loading `ar.ftl` and `en.ftl` files from each module's `locales` directory, allowing modules to define their own localized strings.
*   **Usage**: Handlers and conversations use `ctx.t('key-name', { params })` to retrieve localized messages.

## 7. Interactions with External Services and Database

The Bot Core & Handlers module heavily relies on and interacts with other parts of the codebase:

*   **`prisma` (Database)**: Used extensively across all handlers and conversations for user management, join requests, admin scopes, and module synchronization.
*   **`@grammyjs/conversations`**: The core library for multi-step flows.
*   **`@al-saada/module-kit`**: Defines the `ModuleDefinition` interface used by the `ModuleLoader`.
*   **`joinRequestService`**: Handles the business logic for creating and bootstrapping join requests.
*   **`notifications`**: Used by `approvalsHandler` to queue notifications for users.
*   **`auditService`**: Logs user actions, such as `MENU_ACCESS`.
*   **`adminScopeService`**: Manages administrative permissions for `ADMIN` users.
*   **`rbacService`**: Performs runtime permission checks for module access.
*   **`redis` (Cache)**: Used for session storage (`sessionMiddleware`) and conversation draft management (`draftMiddleware`).
*   **`bot/utils/conversation.ts`**: Provides utility functions for conversations (e.g., `createMessageTracker`, `waitForTextOrCancel`).
*   **`bot/utils/user-inputs.ts`**: Provides reusable functions for common user input patterns (e.g., `askForArabicName`).
*   **`bot/utils/formatters.ts`**: Provides utility functions for formatting data (e.g., `formatArabicDate`, `notifyAdmins`).

## 8. Developer Guide

### 8.1. Adding a New Command or Callback Query Handler

1.  **Define the handler function**: Create a new file in `packages/core/src/bot/handlers/` (or an appropriate subdirectory).
    ```typescript
    // packages/core/src/bot/handlers/my-feature.ts
    import type { BotContext } from '../../types/context'

    export async function myFeatureHandler(ctx: BotContext) {
      // Your logic here
      await ctx.reply(ctx.t('my-feature-message'))
    }
    ```
2.  **Import and register in `packages/core/src/bot/index.ts`**:
    ```typescript
    // packages/core/src/bot/index.ts
    import { myFeatureHandler } from './handlers/my-feature'

    // ...
    bot.command('myfeature', myFeatureHandler) // For /myfeature command
    bot.callbackQuery('my_feature_action', myFeatureHandler) // For callback_data 'my_feature_action'
    bot.callbackQuery(/^my_feature_prefix:(.+)$/, myFeatureHandler) // For regex matching
    ```
3.  **Add i18n keys**: Update `packages/core/src/locales/ar.ftl` and `en.ftl` with any new messages.

### 8.2. Creating a New Conversation

1.  **Define the conversation function**: Create a new file in `packages/core/src/bot/conversations/`.
    ```typescript
    // packages/core/src/bot/conversations/my-new-flow.ts
    import type { Conversation, ConversationFlavor } from '@grammyjs/conversations'
    import type { BotContext } from '../../types/context'
    import { waitForTextOrCancel } from '../utils/conversation'

    export async function myNewConversation(
      conversation: Conversation<ConversationFlavor & BotContext>,
      ctx: BotContext,
    ) {
      await ctx.reply(ctx.t('my-flow-start'))
      const step1 = await waitForTextOrCancel(conversation, ctx, ctx.t('my-flow-step1'))
      if (!step1) { /* handle cancel */ return }
      // ... more steps
      await ctx.reply(ctx.t('my-flow-complete', { value: step1 }))
    }
    ```
2.  **Import and register in `packages/core/src/bot/index.ts`**:
    ```typescript
    // packages/core/src/bot/index.ts
    import { myNewConversation } from './conversations/my-new-flow'

    // ...
    bot.use(createConversation(myNewConversation, 'my-new-flow'))

    // Then, trigger it from a handler:
    bot.command('start_my_flow', async (ctx) => {
      await ctx.conversation.enter('my-new-flow')
    })
    ```
3.  **Add i18n keys**: Update locale files.

### 8.3. Understanding the Middleware Stack

The order of middlewares in `bot/index.ts` is crucial. For example:
*   `sessionMiddleware` must come before any middleware or handler that needs `ctx.session`.
*   `rbacMiddleware` relies on `ctx.session` being populated.
*   `i18n` must come before any handler that uses `ctx.t()`.
*   `conversations()` must be registered before `createConversation()` calls.
*   `draftMiddleware` needs `conversations()` to be active.

When debugging, consider the order of execution and how each middleware modifies the `ctx` object or controls flow.

### 8.4. Extending with Modules

New features that are self-contained and potentially reusable should be developed as separate modules in the `modules/` directory. The `ModuleLoader` will automatically discover, load, and integrate them into the bot's functionality, including their i18n and conversations. Refer to the `module-kit` documentation for details on creating new modules.