# Module Development Guide

**Version**: 1.1
**Last Updated**: 2026-03-11
**Purpose**: Comprehensive guide for developing compliant modules in the Al-Saada Smart Bot platform

> [!IMPORTANT]
> This guide covers **Module Kit V1** — the current, implemented module framework. For the planned Schema-Driven App Factory (V2), see [Module Kit V2 Design Document](module-kit-v2.md).

## Table of Contents

1. [Module Contract](#module-contract)
2. [Module Structure](#module-structure)
3. [Code Examples](#code-examples)
4. [Development Workflow](#development-workflow)
5. [Common Mistakes](#common-mistakes)
6. [Pre-Deploy Checklist](#pre-deploy-checklist)
7. [Testing Requirements](#testing-requirements)
8. [Troubleshooting](#troubleshooting)

---

## Module Contract

Every module MUST comply with these 10 mandatory rules:

### Rule 1: defineModule() Export
`config.ts` MUST export `defineModule()` — required for ModuleLoader discovery

### Rule 2: Unique Kebab-Case Slug
The `slug` MUST be unique across all modules and use kebab-case format
- Used as identifier in Redis, database, and internationalization
- Example: `fuel-entries`, `employee-attendance`, `sales-tracker`

### Rule 3: Valid SectionSlug
The `sectionSlug` MUST match an existing `Section.slug` in the database
- Modules are organized under sections in the UI
- Support for **Hierarchical Sections**: A module can be placed in a Main Section or a Sub-section
- Common sections: `operations`, `finance`, `hr`, `inventory`

### Rule 4: Non-Empty View Permissions
The `permissions.view` object MUST be non-empty — at least one role required
- Controls which user roles can access the module
- Example roles: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `EMPLOYEE`

### Rule 5: i18n Keys Only for User Text
All user-facing text MUST use i18n keys only — no hardcoded Arabic or English text
- Follows Principle VII of the platform
- Enables bilingual platform support

### Rule 6: Key Prefix Convention
All i18n keys MUST be prefixed with `{slug}-` — prevents collisions between modules
- Example: For slug `fuel-entries`, use keys like `fuel-entries-title`, `fuel-entries-amount`

### Rule 7: Bilingual Locale Files
Both `locales/ar.ftl` and `locales/en.ftl` MUST exist
- Arabic (ar) for primary language support
- English (en) for secondary language support

### Rule 8: Module-Specific Schema Only
`schema.prisma` MUST contain only module-specific tables — no Layer 1 modifications
- Do NOT modify core tables like `User`, `Role`, `Permission`
- Use references (foreign keys) to core tables instead

### Rule 9: Test Coverage
`tests/` directory MUST exist with at least one test — Principle III requires 80% coverage
- Tests ensure module reliability and catch regressions

### Rule 10: Monorepo Workspace Compatibility
`package.json` MUST exist for monorepo workspace compatibility
- Enables proper dependency management
- Follows pnpm workspace conventions

---

## Module Structure

```
modules/
└── {slug}/                    # Module directory (kebab-case)
    ├── config.ts             # Module definition (REQUIRED)
    ├── conversation.ts        # Conversation flow
    ├── schema.prisma         # Database tables
    ├── package.json          # Dependencies (REQUIRED)
    ├── locales/
    │   ├── ar.ftl           # Arabic translations (REQUIRED)
    │   └── en.ftl           # English translations (REQUIRED)
    ├── tests/               # Test files (REQUIRED)
    │   └── {slug}.test.ts
    └── custom/              # Optional custom code
        ├── calculations.ts  # Business logic
        ├── integrations.ts  # External APIs
        └── reports.ts       # Custom reports
```

---

## Code Examples

### 1. config.ts (Module Definition)

```typescript
import { defineModule } from '@al-saada/module-kit'
import { addFuelEntry } from './conversations/add'

export const config = defineModule({
  slug: 'fuel-entries',
  sectionSlug: 'operations',
  name: 'fuel-entries-name',
  nameEn: 'fuel-entries-name-en',
  icon: '⛽',

  permissions: {
    view: ['SUPER_ADMIN', 'ADMIN'],
    create: ['SUPER_ADMIN', 'ADMIN'],
    edit: ['SUPER_ADMIN', 'ADMIN'],
    delete: ['SUPER_ADMIN'],
  },

  addEntryPoint: addFuelEntry,
  // editEntryPoint: editFuelEntry,  // Optional
})
```

### 2. Conversation Flow (add.conversation.ts)

```typescript
import type { Conversation } from '@grammyjs/conversations'
import type { BotContext } from '@al-saada/module-kit'
import { validate, confirm, save } from '@al-saada/module-kit'

export async function addFuelEntry(
  conversation: Conversation<BotContext>,
  ctx: BotContext,
) {
  // Step 1: Collect amount
  const amount = await validate(conversation, ctx, {
    field: 'amount',
    promptKey: 'fuel-entries-prompt-amount',
    errorKey: 'fuel-entries-error-amount',
    validator: val => !Number.isNaN(Number(val)) && Number(val) > 0,
    formatter: val => Number(val),
  })
  if (!amount) return

  // Step 2: Collect fuel type
  const type = await validate(conversation, ctx, {
    field: 'type',
    promptKey: 'fuel-entries-prompt-type',
    errorKey: 'fuel-entries-error-type',
    validator: val => ['diesel', 'petrol'].includes(val),
  })
  if (!type) return

  // Step 3: Confirm
  const data = { amount, type }
  const confirmed = await confirm(conversation, ctx, {
    data,
    labels: { amount: 'fuel-entries-label-amount', type: 'fuel-entries-label-type' },
    editableFields: ['amount', 'type'],
    reAsk: async (field) => { /* re-ask logic */ },
  })
  if (!confirmed) return

  // Step 4: Save
  await save(ctx, {
    moduleSlug: 'fuel-entries',
    action: async prisma => prisma.fuelEntry.create({ data }),
    audit: { action: 'MODULE_CREATE', targetType: 'FuelEntry', details: data },
  })
}
```

### 3. Custom Code Directory Structure

```typescript
// custom/calculations.ts
export function calculateEfficiency(distance: number, fuel: number): number {
  if (fuel === 0)
    return 0
  return distance / fuel
}

export function estimateNextRefuel(
  currentFuel: number,
  avgConsumption: number
): Date {
  const kmRemaining = currentFuel * avgConsumption
  const daysRemaining = kmRemaining / 100 // Assume 100km/day average
  const nextRefuel = new Date()
  nextRefuel.setDate(nextRefuel.getDate() + daysRemaining)
  return nextRefuel
}
```

### 4. Locale File Examples

#### locales/ar.ftl

```ftl
fuel-entries-name = سجل الوقود
fuel-entries-description = تسجيل كمية الوقود المستهلكة للشاحنات

fuel-entries-field-amount = الكمية (لتر)
fuel-entries-field-type = نوع الوقود
fuel-entries-field-truck = الشاحنة

fuel-entries-option-diesel = ديزل
fuel-entries-option-petrol = بنزين

fuel-entries-error-max-amount = لا يمكن أن تتجاوز الكمية 1000 لتر
fuel-entries-notification = تم تسجيل وقود جديد للشاحنة {truck}

fuel-entries-success = تم حفظ سجل الوقود بنجاح
```

#### locales/en.ftl

```ftl
fuel-entries-name = Fuel Log
fuel-entries-description = Record fuel consumption for trucks

fuel-entries-field-amount = Amount (liters)
fuel-entries-field-type = Fuel Type
fuel-entries-field-truck = Truck

fuel-entries-option-diesel = Diesel
fuel-entries-option-petrol = Petrol

fuel-entries-error-max-amount = Amount cannot exceed 1000 liters
fuel-entries-notification = New fuel entry recorded for truck {truck}

fuel-entries-success = Fuel entry saved successfully
```

### 5. Schema.prisma Example

```prisma
// Module-specific tables only - NO Layer 1 modifications

model FuelEntry {
  id        String   @id @default(cuid())
  amount    Float
  type      String
  costPerLiter Float?
  truckId   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // References to Layer 1 entities (no modification)
  truck     Truck    @relation(fields: [truckId], references: [id])
  createdBy User     @relation("FuelEntryCreator", fields: [createdById], references: [id])
  createdById String

  @@map("fuel_entries")
  @@index([truckId])
  @@index([createdAt])
}
```

### 6. Test Example

```typescript
import { beforeEach, describe, expect, it } from 'vitest'
import { config } from '../config'
import { createFuelEntry } from '../custom/calculations'

describe('FuelEntries Module', () => {
  describe('Module Contract', () => {
    it('exports defineModule', () => {
      expect(config).toBeDefined()
      expect(typeof config).toBe('object')
    })

    it('has unique kebab-case slug', () => {
      expect(config.slug).toBe('fuel-entries')
      expect(config.slug).toMatch(/^[a-z0-9-]+$/)
    })

    it('has non-empty view permissions', () => {
      expect(config.permissions.view).toBeDefined()
      expect(config.permissions.view.length).toBeGreaterThan(0)
    })

    it('has all required i18n keys with correct prefix', () => {
      const i18nKeys = ['name', 'description', 'fields']
      i18nKeys.forEach((key) => {
        expect(config[key]).toMatch(/^fuel-entries-/)
      })
    })
  })

  describe('Calculations', () => {
    it('calculates efficiency correctly', () => {
      const efficiency = createFuelEntry.calculateEfficiency(500, 50)
      expect(efficiency).toBe(10)
    })

    it('handles zero fuel amount', () => {
      const efficiency = createFuelEntry.calculateEfficiency(500, 0)
      expect(efficiency).toBe(0)
    })
  })
})
```

---

## Development Workflow

### 1. Create a New Module

#### Option A: CLI (Recommended)

```bash
npm run module:create
```

Follow the interactive prompts to generate a module skeleton. The CLI will automatically:
1. **Fetch Main Sections** from the database for you to choose from.
2. **Fetch Sub-sections** based on your main section choice.
3. Allow you to **Create New** sections (Main or Sub) directly from the prompt.
4. Allow you to **Skip** sub-section selection to place the module directly in a Main Section.

#### Option B: Manual Creation

1. Create module directory under `modules/`
2. Create all required files manually
3. Follow the Module Contract rules

> **🚧 V2 Preview:** In Module Kit V2, a third option — **AI Wizard** (`/ai create-module`) — will generate modules from natural language descriptions. See [Module Kit V2](module-kit-v2.md).

### 2. Development Steps

1. **Plan**: Define the module's purpose, fields, and workflows
2. **Configure**: Edit `config.ts` with `defineModule()` and permissions
3. **Implement**: Write `conversation.ts` using `validate()`, `confirm()`, `save()`
4. **Internationalize**: Add all text to both `ar.ftl` and `en.ftl`
5. **Define Schema**: Create `schema.prisma` with module tables only
6. **Test**: Write tests and ensure 80%+ coverage

---

## Common Mistakes

### Mistake 1: Hardcoded User Text

```typescript
// WRONG
{
  label: 'Amount in Liters',  // Hardcoded English!
}

// CORRECT
{
  label: 'fuel-entries-field-amount',  // i18n key only
}
```

### Mistake 2: Missing Key Prefix

```typescript
// WRONG
// locales/ar.ftl
name = سجل الوقود
description = تسجيل الوقود

// CORRECT
// locales/ar.ftl
fuel-entries-name = سجل الوقود
fuel-entries-description = تسجيل الوقود
```

### Mistake 3: Modifying Layer 1 Tables

```prisma
// WRONG - Don't modify core tables!
model User {
  fuelEntries FuelEntry[]
  customField String  // This violates Rule 8
}

// CORRECT - Only define module tables
model FuelEntry {
  id       String @id @default(cuid())
  amount   Float
  userId   String
  user     User   @relation(fields: [userId], references: [id])
}
```

### Mistake 4: Empty View Permissions

```typescript
// WRONG
permissions: {
  view: [],  // Violates Rule 4
  create: ['ADMIN'],
}

// CORRECT
permissions: {
  view: ['SUPER_ADMIN', 'ADMIN'],  // At least one role
  create: ['ADMIN'],
}
```

### Mistake 5: Invalid Slug Format

```typescript
// WRONG
slug: 'FuelEntries',  // Not kebab-case
slug: 'fuel_entries',  // Underscores instead of hyphens
slug: 'fuel-entries-extra-long-name'  // Not concise

// CORRECT
slug: 'fuel-entries',  // kebab-case, unique, concise
```

### Mistake 6: Missing Locale Files

```text
WRONG:
modules/
└── fuel-entries/
    ├── config.ts
    └── locales/
        └── ar.ftl  # Only one language!

CORRECT:
modules/
└── fuel-entries/
    ├── config.ts
    └── locales/
        ├── ar.ftl  # Both required
        └── en.ftl
```

### Mistake 7: No Tests

```text
WRONG:
modules/
└── fuel-entries/
    ├── config.ts
    └── locales/

CORRECT:
modules/
└── fuel-entries/
    ├── config.ts
    ├── locales/
    └── tests/
        └── fuel-entries.test.ts
```

---

## Pre-Deploy Checklist

Before deploying a module to production, verify all items:

### Module Contract Compliance

- [ ] config.ts exports defineModule()
- [ ] Slug is unique and kebab-case
- [ ] sectionSlug matches an existing Section.slug in DB
- [ ] permissions.view is non-empty
- [ ] All user-facing text uses i18n keys only
- [ ] All i18n keys are prefixed with {slug}-
- [ ] locales/ar.ftl exists with all keys
- [ ] locales/en.ftl exists with all keys
- [ ] schema.prisma contains only module-specific tables
- [ ] tests/ directory exists with at least one test

### Code Quality

- [ ] No hardcoded Arabic or English strings in source code
- [ ] No unused i18n keys in locale files
- [ ] No missing i18n keys referenced in config.ts
- [ ] Database schema has proper indexes for common queries
- [ ] Foreign keys reference existing Layer 1 tables
- [ ] Prisma migration has been generated and reviewed

### Testing

- [ ] Test coverage is at least 80%
- [ ] All tests pass locally
- [ ] Integration tests cover happy path
- [ ] Edge cases are tested (empty inputs, boundary values, etc.)
- [ ] Permission tests verify role restrictions

### Documentation

- [ ] Module has clear description in both languages
- [ ] Field labels are descriptive in both languages
- [ ] Error messages are user-friendly in both languages
- [ ] README.md exists with usage instructions (optional but recommended)

### Runtime Validation

- [ ] Module loads successfully in dev environment
- [ ] Module is accessible to configured roles
- [ ] Conversation flow completes without errors

### Performance

- [ ] No N+1 queries in custom code
- [ ] Database indexes are defined for filtered fields
- [ ] Large result sets use pagination
- [ ] Caching strategy is considered for frequently accessed data

### Security

- [ ] RBAC is properly enforced for all operations
- [ ] Input validation prevents injection attacks
- [ ] Sensitive data is properly handled
- [ ] Audit logs record important actions

---

## Testing Requirements

### Minimum Coverage: 80%

Module tests should cover:

1. **Module Contract Rules**: Verify all 10 rules are followed
2. **Field Validation**: Test required fields, constraints, and formats
3. **Permission Checks**: Ensure role-based access control works
4. **Business Logic**: Test custom calculations and integrations
5. **Error Handling**: Verify error messages and fallback behaviors
6. **Edge Cases**: Test boundary values and unexpected inputs

### Test Categories

```typescript
// 1. Unit Tests - Test isolated functions
describe('calculateEfficiency', () => {
  it('returns correct efficiency for valid inputs', () => { ... });
  it('handles zero fuel amount', () => { ... });
  it('handles negative values', () => { ... });
});

// 2. Integration Tests - Test module with database
describe('FuelEntry creation', () => {
  it('saves entry to database correctly', async () => { ... });
  it('validates required fields', async () => { ... });
  it('enforces permission checks', async () => { ... });
});

// 3. Contract Tests - Verify ModuleLoader compliance
describe('Module Contract', () => {
  it('exports defineModule', () => { ... });
  it('has valid slug format', () => { ... });
  it('has non-empty view permissions', () => { ... });
});
```

---

## Troubleshooting

### Module Not Loading

**Symptoms**: Module doesn't appear in the UI or ModuleLoader logs a warning

**Causes**:
- Rule 1 violation: `defineModule()` not exported
- Rule 2 violation: Slug is not kebab-case or already exists
- Rule 3 violation: `sectionSlug` doesn't exist in database
- Rule 4 violation: `permissions.view` is empty
- Missing locale files

**Solution**: Run `npm run module:validate <slug>` and fix reported issues

### Missing Translations

**Symptoms**: Screen shows raw i18n keys instead of translated text

**Causes**:
- Key not defined in locale file
- Key prefix doesn't match module slug
- Wrong locale file language code

**Solution**: Verify keys exist in both `ar.ftl` and `en.ftl` with correct prefix

### Permission Errors

**Symptoms**: Users with expected roles can't access the module

**Causes**:
- `permissions.view` is empty or missing roles
- User roles not assigned correctly in database
- AdminScope not configured properly

**Solution**: Check `config.ts` permissions and verify user roles

### Database Migration Fails

**Symptoms**: Prisma migration fails with errors

**Causes**:
- Attempting to modify Layer 1 tables
- Naming conflict with existing tables
- Invalid foreign key reference

**Solution**: Ensure `schema.prisma` contains only module-specific tables

### Tests Failing

**Symptoms**: Test suite has failures or low coverage

**Causes**:
- Missing test files
- Tests not covering all code paths
- Mock data not matching schema

**Solution**: Add tests for uncovered code paths and fix failing tests

---

## Additional Resources

- **Module Kit Reference**: [module-kit-reference.md](module-kit-reference.md)
- **Module Kit V2 Design**: [module-kit-v2.md](module-kit-v2.md)
- **Platform Core Reference**: [platform-core-reference.md](platform-core-reference.md)
- **Architecture**: [architecture.md](architecture.md)
- **Database Schema**: [database-schema.md](database-schema.md)

---

## 🚧 Module Kit V2 Preview

Module Kit V2 (planned after Phase 4: AI Assistant) will introduce a **Schema-Driven App Factory** approach. Key changes:

- **YAML Blueprints** replace manual `conversation.ts` files
- **Declarative `fields`** define data structure + conversation flow in one place
- **Lifecycle `hooks`** (`beforeSave`, `afterSave`, `onApproval`, etc.) for optional custom logic
- **`approve` permission** for approval workflows
- **Generator Engine** auto-creates: `schema.prisma`, validators, i18n files
- **AI Integration** for generating Blueprints from natural language

V1 modules will continue to work unchanged. Migration is optional and progressive.

**Full details:** [Module Kit V2 Design Document](module-kit-v2.md)

---

**Document Owner**: Platform Core Team
**Contact**: For questions, contact the development team or core maintainers.
