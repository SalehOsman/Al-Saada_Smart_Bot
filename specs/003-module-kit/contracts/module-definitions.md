# Contract: Module Definition Interface

This defines the structure of the `config.ts` file exported by every module.

```typescript
export interface ModuleDefinition {
  /** Unique module identifier (e.g., "fuel-entry") */
  slug: string;

  /** Slug of the section this module belongs to */
  sectionSlug: string;

  /** Primary Arabic display name (i18n key) */
  name: string;

  /** Secondary English display name (i18n key) */
  nameEn: string;

  /** Emoji icon for the bot menu */
  icon: string;

  /** Granular user roles required for access */
  permissions: {
    view: Role[];
    create: Role[];
    edit: Role[];
    delete: Role[];
  };

  /** Optional Redis TTL for conversation drafts (in hours, default 24) */
  draftTtlHours?: number;

  /** Order in the section's menu */
  orderIndex?: number;

  /** The grammY conversation handler (Create entry point) */
  addEntryPoint: (conversation: Conversation<BotContext>, ctx: BotContext) => Promise<void>;

  /** The grammY conversation handler (Edit entry point) */
  editEntryPoint?: (conversation: Conversation<BotContext>, ctx: BotContext) => Promise<void>;
}
```

## Usage Example (`modules/fuel-entry/config.ts`)

```typescript
import { defineModule } from '@al-saada/module-kit';

export default defineModule({
  slug: 'fuel-entry',
  sectionSlug: 'operations',
  name: 'fuel-entry-name',
  nameEn: 'fuel-entry-name-en',
  icon: '⛽',
  permissions: {
    view: ['ADMIN', 'EMPLOYEE', 'SUPER_ADMIN'],
    create: ['ADMIN', 'EMPLOYEE'],
    edit: ['ADMIN'],
    delete: ['SUPER_ADMIN'],
  },
  addEntryPoint: addFuelEntryConversation,
  editEntryPoint: editFuelEntryConversation,
});
```
