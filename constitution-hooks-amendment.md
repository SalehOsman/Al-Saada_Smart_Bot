Read the current constitution at .specify/memory/constitution.md and apply the following amendments. Update version to 1.3.0.

## Amendment 1: Update Layer 3 description in Three-Layer Architecture

Replace the current Layer 3 section with:

#### Layer 3: Modules (Variable — Config-First with Optional Hooks)
Each module consists of configuration files with optional lifecycle hooks:
- module.config.ts — Module definition (name, section, permissions, icon, menu order)
- add.flow.ts — Add record flow (ordered array of Flow Block steps + optional hooks)
- edit.flow.ts — Edit record flow
- view.config.ts — Single record view configuration
- list.config.ts — List display configuration (columns, filters, sort)
- report.config.ts — Report generation configuration
- schema.prisma — Database table definition for this module

Lifecycle Hooks (optional — only when config is insufficient):
- beforeValidate: Modify or enrich data before validation runs
- beforeSave: Custom business logic before database write (e.g., tax calculations, complex validations)
- afterSave: Post-save actions (e.g., custom notifications, external API calls)
- beforeDelete: Pre-deletion checks or cascading logic
- onApproval: Custom logic when a request is approved
- onRejection: Custom logic when a request is rejected

Hook Rules:
- Hooks are OPTIONAL — most modules should work with config alone
- Hooks must be minimal and focused (single responsibility)
- Hooks must NOT contain UI logic — UI is always handled by Flow Blocks
- Hooks must NOT replace what config can do — use config first, hooks only for exceptions
- Hooks receive typed context (data, user, prisma) and return modified data or throw errors
- All hooks are async and have access to database and services

Key rules:
- Modules are NEVER hardcoded — discovered dynamically at startup
- Sections (departments) are dynamic — created/deleted/renamed by Super Admin
- A module belongs to exactly one section
- Config handles 90%+ of module behavior — hooks handle the remaining edge cases

## Amendment 2: Update Core Principle II (Config-Driven Architecture)

Replace the current Principle II with:

### II. Config-Driven Architecture (Config-First, Code-When-Needed)
Everything that can be configuration MUST be configuration, not code. Module creation should primarily require:
- Defining flow steps (which Flow Blocks in what order)
- Specifying database fields
- Setting permissions

For complex business logic that cannot be expressed as configuration:
- Use lifecycle hooks (beforeValidate, beforeSave, afterSave, beforeDelete, onApproval, onRejection)
- Hooks must be minimal, focused, and well-documented
- A module with ZERO hooks is the ideal — hooks are the exception, not the rule

The 90/10 Rule: A typical module should be 90% configuration and at most 10% custom hook code. If a module needs more than 10% custom code, the Flow Engine likely needs a new Flow Block or feature.

## Amendment 3: Update Core Principle III (Flow Block Reusability)

Add the following to the end of Principle III:

When a hook pattern repeats across 3+ modules, it MUST be extracted into a new Flow Block or a shared utility in the Flow Engine. Hooks are for exceptional cases — repeated patterns belong in the engine.

## Amendment 4: Add Practical Example to Layer 2 description

Add the following after the Search Engine bullet in Layer 2:

**Example: Employee Registration Module (Config + Hooks)**
```
// Config handles: UI steps, field types, validation, DB mapping
steps: [
  { block: 'text_input', field: 'fullName' },
  { block: 'national_id', field: 'nationalId' },
  { block: 'currency_input', field: 'basicSalary' },
  { block: 'confirm', showSummary: true },
]

// Hook handles: Complex Egyptian tax calculation (cannot be config)
hooks: {
  beforeSave: async (data) => {
    data.taxAmount = calculateEgyptianTax(data.basicSalary);
  }
}
```

## Amendment 5: Update Amendment History

Add new row:
| 1.3.0 | 2026-02-17 | Added Hooks system to Layer 3, updated Config-Driven principle to Config-First |
