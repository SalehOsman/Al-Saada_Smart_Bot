# Module Development Guide

**Version**: 1.0
**Last Updated**: 2026-03-02
**Purpose**: Comprehensive guide for developing compliant modules in the Al-Saada Smart Bot platform

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

### 1. Minimal config.ts (Config Only Level)

```typescript
import { defineModule } from '@al-saada/module-kit'

export const config = defineModule({
  slug: 'fuel-entries',
  sectionSlug: 'operations',
  name: 'fuel-entries-name',
  description: 'fuel-entries-description',

  permissions: {
    view: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    create: ['SUPER_ADMIN', 'ADMIN'],
    edit: ['SUPER_ADMIN', 'ADMIN'],
    delete: ['SUPER_ADMIN'],
    approve: ['SUPER_ADMIN'],
  },

  fields: [
    {
      key: 'amount',
      type: 'number',
      label: 'fuel-entries-field-amount',
      required: true,
    },
    {
      key: 'type',
      type: 'select',
      label: 'fuel-entries-field-type',
      options: ['fuel-entries-option-diesel', 'fuel-entries-option-petrol'],
      required: true,
    },
    {
      key: 'truckId',
      type: 'reference',
      label: 'fuel-entries-field-truck',
      reference: 'Truck',
      required: true,
    },
  ],
})
```

### 2. Config with Hooks (Config + Hooks Level)

```typescript
import { defineModule } from '@al-saada/module-kit'

export const config = defineModule({
  slug: 'fuel-entries',
  sectionSlug: 'operations',
  name: 'fuel-entries-name',
  description: 'fuel-entries-description',

  permissions: {
    view: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'],
    create: ['SUPER_ADMIN', 'ADMIN'],
    edit: ['SUPER_ADMIN', 'ADMIN'],
    delete: ['SUPER_ADMIN'],
    approve: ['SUPER_ADMIN'],
  },

  fields: [
    // ... field definitions
  ],

  hooks: {
    // Validate data before moving to next step
    onStepValidate: async (step, data) => {
      if (step === 'amount' && data.amount > 1000) {
        throw new Error('fuel-entries-error-max-amount')
      }
    },

    // Run before saving to database
    beforeSave: async (data) => {
      // Calculate derived fields
      data.costPerLiter = data.totalCost / data.amount
      return data
    },

    // Run after successful save
    afterSave: async (savedData) => {
      // Trigger notifications
      await notifyTruckDriver(savedData.truckId, 'fuel-entries-notification')
    },

    // Run when record is approved
    onApproval: async (record) => {
      await updateInventory(record)
    },

    // Run when record is rejected
    onRejection: async (record, reason) => {
      await notifySubmitter(record, reason)
    },
  },
})
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

#### Option A: CLI (Recommended for Fast Scaffolding)

```bash
npm run module:create
```

Follow the interactive prompts to generate a module skeleton. The CLI will automatically:
1. **Fetch Main Sections** from the database for you to choose from.
2. **Fetch Sub-sections** based on your main section choice.
3. Allow you to **Create New** sections (Main or Sub) directly from the prompt.
4. Allow you to **Skip** sub-section selection to place the module directly in a Main Section.

#### Option B: AI Wizard

Use the `/ai create-module` command in the bot to get guided assistance from the AI Assistant.

#### Option C: Manual Creation

1. Create module directory under `modules/`
2. Create all required files manually
3. Follow the Module Contract rules

### 2. Development Steps

1. **Plan**: Define the module's purpose, fields, and workflows
2. **Configure**: Edit `config.ts` with fields and permissions
3. **Internationalize**: Add all text to both `ar.ftl` and `en.ftl`
4. **Define Schema**: Create `schema.prisma` with module tables only
5. **Implement Logic**: Add conversation flow and custom code if needed
6. **Test**: Write tests and ensure 80%+ coverage
7. **Validate**: Run `npm run module:validate <slug>` to check compliance
8. **Review**: Use `/ai review-module <slug>` for AI-assisted code review

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

- [ ] Run `npm run module:validate <slug>` — no errors
- [ ] Run `/ai review-module <slug>` — no violations
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
- **Platform Core Reference**: [platform-core-reference.md](platform-core-reference.md)
- **Architecture**: [architecture.md](architecture.md)
- **Database Schema**: [database-schema.md](database-schema.md)

---

**Document Owner**: Platform Core Team
**Contact**: For questions, contact the development team or core maintainers.
