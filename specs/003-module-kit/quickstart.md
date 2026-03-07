# Quickstart: Module Kit (Layer 2)

This guide shows how to create a new module from scratch using the CLI and standardized helpers.

## 1. Scaffold the Module

Run the interactive CLI tool:

```bash
npm run module:create fuel-entry
```

The tool will ask for:
- Arabic Name (e.g., تسجيل وقود)
- English Name (e.g., Fuel Entry)
- Section Slug (e.g., operations)
- Icon (e.g., ⛽)

**Result**: A new folder `modules/fuel-entry/` is created with:
- `config.ts`: Module registration.
- `add.conversation.ts`: Creation entry point.
- `edit.conversation.ts`: Editing entry point (optional).
- `schema.prisma`: Database table definition.
- `locales/ar.ftl`, `en.ftl`: Translations.

## 2. Define the Schema

In `modules/fuel-entry/schema.prisma`:

```prisma
model FuelEntry {
  id        String   @id @default(cuid())
  amount    Float
  vehicleId String
  createdAt DateTime @default(now())
}
```

The CLI automatically copies this to `prisma/schema/modules/fuel-entry.prisma` and runs `prisma generate`.

## 3. Implement the Conversation

In `modules/fuel-entry/add.conversation.ts`:

```typescript
import { validate, confirm, save } from '@al-saada/module-kit';

export async function addFuelEntryConversation(conversation: Conversation<BotContext>, ctx: BotContext) {
  const data: any = {};

  // 1. Data Collection with Validation
  data.amount = await validate(conversation, ctx, {
    field: 'amount',
    promptKey: 'fuel_entry.prompt.amount',
    errorKey: 'fuel_entry.error.amount',
    validator: (val) => !isNaN(Number(val)) && Number(val) > 0,
    formatter: (val) => Number(val),
  });

  // 2. Summary & Confirmation
  const confirmed = await confirm(conversation, ctx, {
    data,
    labels: { amount: 'fuel_entry.label.amount' },
    editableFields: ['amount'],
    reAsk: async (field) => { /* logic to re-run validation for field */ }
  });

  if (!confirmed) return;

  // 3. Persist with Automatic Audit & Notifications
  // Notifications are handled automatically based on AdminScope
  await save(ctx, {
    moduleSlug: 'fuel-entry',
    action: (prisma) => prisma.fuelEntry.create({ data }),
    audit: { action: 'MODULE_CREATE', targetType: 'FuelEntry' },
  });

  await ctx.reply(ctx.t('fuel_entry.success'));
}
```

## 4. Run & Test

Restart the bot. The `ModuleLoader` will:
1.  Discover `fuel-entry`.
2.  Register the conversation.
3.  Add "Fuel Entry" to the "Operations" menu for authorized users.
4.  Load the `.ftl` translations.

**Note**: Developers MUST define a contextual help key for every step in their module's locale files using the format `module-kit-help-{step}` (e.g., `module-kit-help-amount` for the amount step). These keys are automatically used by the `/help` command interrupt during a conversation.

