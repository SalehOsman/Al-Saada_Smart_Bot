# Bot Utilities

The `bot/utils` module, located at `packages/core/src/bot/utils`, provides a collection of shared, reusable utilities designed to streamline the development of Telegram bot flows. It encapsulates common patterns for user interaction, data validation, formatting, and administrative notifications, ensuring consistency and reducing boilerplate across different bot conversations.

This module is the backbone for building robust and user-friendly conversational experiences, especially for multi-step processes that require input validation, message cleanup, and clear communication.

## Module Structure

The `bot/utils` module is composed of three distinct sub-modules, each addressing a specific area of bot functionality:

*   `conversation.ts`: Handles interactive conversation flow, user input, and message management.
*   `user-inputs.ts`: Provides validated input collection for common user data, particularly for Egyptian contexts.
*   `formatters.ts`: Offers data formatting utilities and a mechanism for sending administrative notifications.

All these utilities are re-exported through `index.ts`, allowing for a unified import path:

```typescript
import {
  createMessageTracker, waitForTextOrCancel, deleteTrackedMessages,
  askForArabicName, askForPhone, askForNationalId, generateNickname,
  formatArabicDate, formatGender, notifyAdmins
} from '../utils';
```

### High-Level Dependencies

```mermaid
graph TD
    subgraph Bot Utilities (bot/utils)
        A[index.ts] --> B(conversation.ts)
        A --> C(formatters.ts)
        A --> D(user-inputs.ts)
    end

    B -- uses --> E(Grammy Conversations)
    B -- uses --> F(BotContext)
    C -- uses --> G(Prisma)
    C -- uses --> H(Notification Service)
    D -- uses --> G
    D -- uses --> I(Al-Saada Validators)
    D -- uses --> F

    style A fill:#f9f,stroke:#333,stroke-width:2px
    style B fill:#ccf,stroke:#333,stroke-width:2px
    style C fill:#ccf,stroke:#333,stroke-width:2px
    style D fill:#ccf,stroke:#333,stroke-width:2px
```

## Conversation Utilities (`conversation.ts`)

This sub-module provides essential tools for managing interactive, multi-step bot conversations. Its primary focus is on guiding users through a flow, collecting input, confirming actions, and cleaning up ephemeral messages.

### Key Concepts

*   **Message Tracking**: To maintain a clean chat interface, the module offers a mechanism to track messages sent during a conversation flow. These messages can then be deleted in bulk at the end of the flow.
*   **Standardized Prompts**: It provides helpers for common interaction patterns like waiting for text input, offering skip options, or requesting confirmation, all with built-in cancellation support.
*   **Cancellation Handling**: A unified approach to handling user cancellations, including a standardized cancellation message.

### Core Functions

#### `createMessageTracker(): MessageTracker`
Initializes an empty `MessageTracker` object. This tracker should be passed to subsequent `waitFor...` helper functions to record message IDs.

#### `trackMessage(tracker: MessageTracker, messageId: number): void`
Adds a given `messageId` to the `tracker`. This is automatically called by the `waitFor...` helpers when they send a message or receive a user response.

#### `deleteTrackedMessages(ctx: BotContext, tracker: MessageTracker): Promise<void>`
Deletes all messages recorded in the `tracker` from the user's chat. This function is crucial for cleaning up the conversation history and should typically be called before sending the final result message of a flow. It silently handles cases where messages might already be deleted or are too old.

#### `waitForTextOrCancel(conversation, ctx, prompt, options): Promise<string | null>`
Sends a `prompt` message with a "Cancel" button. It then waits for the user's text input.
*   Returns `null` if the user taps "Cancel".
*   Returns the trimmed text string if the user sends a message.
*   **Options**: `tracker?: MessageTracker` (to track the prompt and user's response).

#### `waitForSkippable(conversation, ctx, prompt, skipLabel, options): Promise<string | '__skip__' | null>`
Similar to `waitForTextOrCancel`, but includes an additional "Skip" button. Useful for optional fields.
*   Returns `null` if the user taps "Cancel".
*   Returns the string `'__skip__'` if the user taps the "Skip" button.
*   Returns the trimmed text string if the user sends a message.
*   **Options**: `tracker?: MessageTracker`, `skipData?: string` (custom callback data for skip button).

#### `waitForConfirm(conversation, ctx, text, options): Promise<boolean>`
Sends a `text` message with "Confirm" and "Cancel" buttons.
*   Returns `true` if the user taps "Confirm".
*   Returns `false` if the user taps "Cancel".
*   **Options**: `tracker?: MessageTracker`, `confirmData?: string`, `cancelData?: string` (custom callback data).

#### `sendCancelled(ctx, message, options): Promise<void>`
Sends a standardized cancellation `message` to the user. Optionally includes a retry button.
*   **Options**: `retryLabel?: string`, `retryData?: string` (to add a button to restart the flow).

### Usage Pattern Example

```typescript
import {
  createMessageTracker, deleteTrackedMessages, waitForTextOrCancel, sendCancelled
} from './conversation'; // Assuming relative import for example

// Inside a conversation handler:
async function myConversation(conversation, ctx) {
  const tracker = createMessageTracker();
  // Bind a 'wait' function for convenience, applying the tracker
  const wait = (prompt: string) => waitForTextOrCancel(conversation, ctx, prompt, { tracker });

  const name = await wait(ctx.t('prompt-name'));
  if (name === null) {
    await deleteTrackedMessages(ctx, tracker);
    await sendCancelled(ctx, ctx.t('flow-cancelled-message'), {
      retryLabel: ctx.t('button-retry'),
      retryData: 'start_my_flow',
    });
    return;
  }

  const age = await wait(ctx.t('prompt-age'));
  if (age === null) {
    await deleteTrackedMessages(ctx, tracker);
    await sendCancelled(ctx, ctx.t('flow-cancelled-message'));
    return;
  }

  // ... more steps

  // Clean up all messages sent during the flow before sending the final result
  await deleteTrackedMessages(ctx, tracker);
  await ctx.reply(ctx.t('final-result-message', { name, age }));
}
```

## User Input Validators (`user-inputs.ts`)

This sub-module provides specialized functions for collecting and validating common user inputs, particularly tailored for Egyptian contexts. Each function implements a validation loop, repeatedly prompting the user until valid input is received or the user cancels.

A key feature is the automatic normalization of Arabic-Indic digits to standard ASCII digits, ensuring that users can type numbers using their native keyboard layouts.

### Key Concepts

*   **`WaitFn`**: A type alias for a bound `waitForTextOrCancel` function. This pattern allows input validators to be generic about *how* they prompt the user, while still leveraging the conversation utilities.
*   **Validation Loops**: Each input function contains a `while (true)` loop that prompts, validates, and re-prompts with an error message until valid input is provided or the user cancels.
*   **Arabic Digit Normalization**: All numeric input functions automatically convert Arabic-Indic digits (`٠-٩`) to ASCII digits (`0-9`) before validation.
*   **Uniqueness Checks**: For sensitive identifiers like phone numbers and national IDs, the functions include checks against the database to prevent duplicates.

### Core Functions

#### `normalizeDigits(input: string): string`
Converts any Arabic-Indic or Extended Arabic-Indic digits within a string to their standard ASCII equivalents. This is internally used by numeric input validators.

#### `askForArabicName(ctx: BotContext, wait: WaitFn): Promise<string>`
Prompts the user for a full Arabic name.
*   **Validation**: Ensures the input contains only Arabic letters, spaces, and common punctuation (.,'-'), and has a minimum length of 2 characters.
*   Returns the validated name or `''` if cancelled.

#### `generateNickname(fullName: string): string`
Derives a display nickname from a full Arabic name. It intelligently handles common Arabic compound prefixes (e.g., "عبد", "أبو") to extract the first two meaningful "name units".

#### `askForPhone(ctx: BotContext, wait: WaitFn): Promise<string>`
Prompts the user for an Egyptian phone number.
*   **Normalization**: Automatically calls `normalizeDigits`.
*   **Validation**: Uses `@al-saada/validators` to ensure it's an 11-digit Egyptian number (starting with 010, 011, 012, or 015).
*   **Uniqueness**: Checks `prisma.user` to ensure the phone number is not already registered.
*   Returns the validated phone number or `''` if cancelled.

#### `askForNationalId(ctx: BotContext, wait: WaitFn): Promise<NationalIdInfo | null>`
Prompts the user for an Egyptian National ID.
*   **Normalization**: Automatically calls `normalizeDigits`.
*   **Validation**: Uses `@al-saada/validators` to ensure it's a valid 14-digit Egyptian National ID.
*   **Uniqueness**: Checks `prisma.user` to ensure the National ID is not already registered.
*   **Extraction**: Automatically extracts `birthDate` and `gender` from the National ID using `@al-saada/validators`.
*   Returns an object `{ nationalId: string, birthDate?: Date, gender?: 'MALE' | 'FEMALE' }` or `null` if cancelled.

### Usage Pattern Example

```typescript
import {
  createMessageTracker, deleteTrackedMessages, waitForTextOrCancel, sendCancelled,
  askForArabicName, askForPhone, askForNationalId, generateNickname
} from './index'; // Assuming import from bot/utils/index

// Inside a conversation handler:
async function joinConversation(conversation, ctx) {
  const tracker = createMessageTracker();
  const wait = (prompt: string) => waitForTextOrCancel(conversation, ctx, prompt, { tracker });

  const fullName = await askForArabicName(ctx, wait);
  if (!fullName) {
    await deleteTrackedMessages(ctx, tracker);
    await sendCancelled(ctx, ctx.t('join-cancelled'));
    return;
  }
  const nickname = generateNickname(fullName);

  const phone = await askForPhone(ctx, wait);
  if (!phone) {
    await deleteTrackedMessages(ctx, tracker);
    await sendCancelled(ctx, ctx.t('join-cancelled'));
    return;
  }

  const nationalIdInfo = await askForNationalId(ctx, wait);
  if (!nationalIdInfo) {
    await deleteTrackedMessages(ctx, tracker);
    await sendCancelled(ctx, ctx.t('join-cancelled'));
    return;
  }
  const { nationalId, birthDate, gender } = nationalIdInfo;

  // ... process collected data

  await deleteTrackedMessages(ctx, tracker);
  await ctx.reply(ctx.t('join-success', { nickname }));
}
```

## Formatting & Admin Notifications (`formatters.ts`)

This sub-module provides utilities for formatting data for display and a centralized mechanism for sending notifications to administrators. A core principle here is that functions return i18n keys rather than translated strings, delegating the actual translation to the caller's `ctx.t()` function.

### Key Concepts

*   **i18n Key Return**: Functions like `formatArabicDate` and `formatGender` return string keys (e.g., `'gender-male'`, `'value-unknown'`) that correspond to entries in locale (`.ftl`) files. This ensures all user-facing text is managed centrally in translation files.
*   **Admin Notification**: A dedicated function to notify all active Super Admins and Admins about significant events.

### Core Functions

#### `formatArabicDate(date: Date | undefined | null): string`
Formats a `Date` object into `DD/MM/YYYY` string format.
*   If `date` is `undefined` or `null`, it returns the i18n key `'value-unknown'`.
*   **Example**: `ctx.t(formatArabicDate(new Date('1980-09-01')))` might output `'01/09/1980'`.

#### `formatGender(gender: 'MALE' | 'FEMALE' | undefined | null): string`
Converts a gender enum value to its corresponding i18n translation key.
*   Returns `'gender-male'`, `'gender-female'`, or `'gender-unknown'`.
*   **Example**: `ctx.t(formatGender('MALE'))` might output `'ذكر'` (Arabic for male).

#### `notifyAdmins(payload: AdminNotificationPayload): Promise<void>`
Sends a notification to all active users with `SUPER_ADMIN` or `ADMIN` roles.
*   It queries the `prisma.user` table for active admins.
*   It then uses `queueBulkNotifications` from `src/services/notifications` to add notification jobs to the BullMQ queue.
*   **`AdminNotificationPayload`**: Requires a `type` (from `NotificationType` enum) and optional `params` (a `Record<string, string>`) for dynamic content in the notification message.

### Usage Pattern Example

```typescript
import { formatArabicDate, formatGender, notifyAdmins } from './index'; // Assuming import from bot/utils/index
import { NotificationType } from '@prisma/client';

// Inside a conversation or other handler:
async function processNewUser(ctx, newUser) {
  const formattedBirthDate = ctx.t(formatArabicDate(newUser.birthDate));
  const formattedGender = ctx.t(formatGender(newUser.gender));

  await ctx.reply(ctx.t('user-summary', {
    name: newUser.fullName,
    birthDate: formattedBirthDate,
    gender: formattedGender,
  }));

  // Notify admins about the new user
  await notifyAdmins({
    type: NotificationType.NEW_USER_REGISTERED,
    params: {
      userName: newUser.fullName,
      userId: newUser.telegramId.toString(),
    },
  });
}
```

## How to Contribute and Extend

When contributing to or extending the `bot/utils` module, consider the following guidelines:

*   **Modularity**: Keep functions focused on a single responsibility.
*   **i18n First**: For any user-facing text, return i18n keys from `formatters.ts` functions. Do not hardcode strings in English or Arabic within the code.
*   **Error Handling**: Input validation functions should provide clear, translatable error messages using `ctx.t()`.
*   **Message Cleanup**: If you introduce new interactive steps in a conversation, ensure they integrate with `MessageTracker` to maintain a clean chat history.
*   **Digit Normalization**: For any numeric input, consider if `normalizeDigits` from `user-inputs.ts` should be applied to handle Arabic-Indic digits.
*   **Reusability**: Before writing new logic, check if existing utilities in this module (or other shared modules) can be leveraged.
*   **Testing**: Ensure all new utilities are thoroughly tested, especially input validators, to cover various valid and invalid scenarios.