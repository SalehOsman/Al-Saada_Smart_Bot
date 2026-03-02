# Data Model: 003-module-kit (Layer 2 Module Kit)

This document describes the persistence layer and in-memory structures for the Module Kit.

## 1. Prisma Multi-File Schema

The project uses Prisma's `prismaSchemaFolder` preview feature.

### 1.1 `prisma/schema/main.prisma`
Contains generators, datasources, and shared enums.
Added:
- `NotificationType.MODULE_OPERATION`
- `AuditAction.MODULE_CREATE`
- `AuditAction.MODULE_UPDATE`
- `AuditAction.MODULE_DELETE`

### 1.2 `prisma/schema/platform.prisma`
Contains core platform models (User, Section, Module, etc.).
Updated:
- `Section`: Added `slug String @unique`.

### 1.3 `prisma/schema/modules/*.prisma`
Module-specific schema snippets, managed via CLI.

## 2. In-Memory Interfaces

### 2.1 `ModuleDefinition` (packages/module-kit/src/types.ts)
```typescript
export interface ModuleDefinition {
  slug: string;
  sectionSlug: string;
  name: string; // i18n key
  nameEn: string; // i18n key
  icon: string;
  permissions: {
    view: Role[];
    create: Role[];
    edit: Role[];
    delete: Role[];
  };
  draftTtlHours?: number;
  orderIndex?: number;
  addEntryPoint: (conversation: Conversation<BotContext>, ctx: BotContext) => Promise<void>;
  editEntryPoint?: (conversation: Conversation<BotContext>, ctx: BotContext) => Promise<void>;
  auditAction?: AuditAction;
}
```

## 3. Redis Persistence (Drafts)

- **Key**: `draft:{userId}:{moduleSlug}`
- **Value**: JSON stringified object:
  ```json
  {
    "data": { ...ctx.session },
    "conversations": { ...grammY conversation state },
    "updatedAt": number
  }
  ```
- **TTL**: Configurable per module (default 24h).

## 4. Audit Log Data

- **PII Masking**: Applied to `phone`, `nationalId`, `taxId` in `AuditLog.details`.
- **Formats**:
  - Phone: `+20*******12`
  - National ID: `299***********`
  - Other: `***MASKED***`
