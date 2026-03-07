# Contract: Module Kit Helpers

Standardized functions for data collection, validation, and persistence.

## 1. `validate<T>()`

Standardized prompt + validation + retry loop.

```typescript
export interface ValidateOptions<T> {
  /** The i18n key for the prompt message */
  promptKey: string;

  /** The i18n key for the error message when validation fails */
  errorKey: string;

  /** The field name in the draft/object (e.g., "quantity") */
  field: keyof T;

  /** Validation function (boolean or throw) */
  validator: (val: string) => boolean | Promise<boolean>;

  /** Format function before storing (e.g., parseInt, trim) */
  formatter?: (val: string) => any;

  /** Maximum retries (default 3) */
  maxRetries?: number;
}

export async function validate<T>(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
  options: ValidateOptions<T>
): Promise<T[keyof T] | undefined>;
```

## 2. `confirm<T>()`

Summary screen with targeted editing support.

```typescript
export interface ConfirmOptions<T> {
  /** The draft data to display in the summary */
  data: T;

  /** Map of field name to i18n key for labeling the summary row */
  labels: Record<keyof T, string>;

  /** List of field names that are editable from the summary */
  editableFields: (keyof T)[];

  /** Function to re-ask the question for a specific field */
  reAsk: (field: keyof T) => Promise<void>;
}

export async function confirm<T>(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
  options: ConfirmOptions<T>
): Promise<boolean>;
```

## 3. `save<T>()`

Encapsulated persistence with automatic auditing and notifications. Notifications are sent automatically to all administrators who have scope for the module's section (based on `AdminScope` table).

```typescript
export interface SaveOptions<T> {
  /** The module's unique slug */
  moduleSlug: string;

  /** Database write callback (Prisma callback) - named dbAction to distinguish from audit.action */
  dbAction: (prisma: PrismaClient) => Promise<any>;

  /** Audit log metadata */
  audit: {
    action: AuditAction;
    targetType: string;
    details?: any;
  };
}

export async function save<T>(
  ctx: BotContext,
  options: SaveOptions<T>
): Promise<void>;
```
