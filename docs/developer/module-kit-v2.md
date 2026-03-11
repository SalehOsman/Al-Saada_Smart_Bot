# Module Kit V2: Schema-Driven App Factory

**Version:** 0.9.0 (Final Draft)
**Last Updated:** 2026-03-11
**Status:** 🚧 Design Phase — Not Yet Implemented
**Dependencies:** Phase 4 (AI Assistant) must complete first
**Document Owner:** Technical Advisor

---

## 1. Abstract

Module Kit V2 transforms the current Module Kit from a **scaffolding + conversation-helpers toolkit** into a **Schema-Driven App Factory**. Developers define modules via declarative YAML Blueprints. A Generator Engine automatically produces: database schemas, Zod validators, Telegram conversation flows, and i18n locale files — reducing manual code to near-zero.

**Core Principles:**
1. **Zero-Code is the default.** Custom code is the exception.
2. **Buttons-First UX.** Prefer inline keyboard selections over free text input whenever possible — minimize typing.

---

## 2. Motivation & Problem Statement

### Current State (V1)

Module Kit V1 provides conversation helpers (`validate()`, `confirm()`, `save()`) and CLI scaffolding (`module:create`). However, building a module still requires:

1. Manually writing `conversation.ts` with step-by-step `validate()` calls
2. Manually writing `schema.prisma` with correct Prisma types
3. Manually creating i18n keys in `ar.ftl` and `en.ftl`
4. Manually writing Zod validation schemas
5. Manually handling relational lookups (e.g., fetching employee names)

**Result:** A simple CRUD module takes hours of repetitive boilerplate.

### Desired State (V2)

A developer writes a single YAML file:

```yaml
module:
  slug: employee-withdrawal
  name: "سحب سلفة عامل"
  icon: "💰"

fields:
  - name: employeeId
    type: relation
    targetModel: Employee
    displayField: fullName
    label: "employee-withdrawal-field-employee"
    required: true
```

Runs `npm run module:generate employee-withdrawal.yaml`, and gets a fully working module in minutes — with database, validation, conversation flow, and i18n files generated automatically.

---

## 3. Design Overview

### Core Architecture

```
┌─────────────────────────────────────────────┐
│              YAML Blueprint                  │
│    (Module definition + fields + hooks)      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│           Generator Engine                   │
│  ┌──────────┐ ┌──────────┐ ┌─────────────┐ │
│  │ Schema   │ │ Validator│ │ Locale      │ │
│  │ Generator│ │ Generator│ │ Generator   │ │
│  └──────────┘ └──────────┘ └─────────────┘ │
│  ┌──────────────────────────────────────┐   │
│  │ Conversation Engine (Runtime)        │   │
│  │ Reads fields → Renders steps → Saves │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
                   │
                   ▼
┌──────────────────────────────────────────────┐
│              Generated Output                 │
│  schema.prisma │ validators.ts │ ar/en.ftl    │
│  config.ts (auto-generated)                   │
│  + Conversation Engine handles UI at runtime  │
└──────────────────────────────────────────────┘
```

### Zero-Code by Default, Code When Needed

| Approach | When to Use | Developer Effort |
|----------|-------------|-----------------|
| **Blueprint Only** (Default) | Standard CRUD modules — data collection, lookup, save | YAML file only — minutes |
| **Blueprint + Hooks** (Extension) | Computed fields, custom validations, external integrations | YAML + `hooks.ts` — minimal code |
| **Blueprint + Custom Override** (Rare) | Complex multi-branch workflows, non-linear conversations | YAML + `conversation.ts` override |

> **The 90/10 Rule (Constitution Principle II):** A typical module should be 90% configuration and at most 10% custom code. If a module needs more than 10% custom code, the Module Kit likely needs a new helper.

### Buttons-First UX Principle

The Conversation Engine **MUST prefer inline keyboard buttons over free text input** in every possible scenario:

| Field Type | UI Rendering | User Action |
|-----------|-------------|-------------|
| `boolean` | ✅ نعم / ❌ لا buttons | Tap button |
| `select` | Inline keyboard buttons | Tap option |
| `multiSelect` | Toggle buttons + ✅ Done | Tap to toggle, tap Done |
| `relation` | Dynamic buttons from DB | Tap to select |
| `date` | Date picker buttons (Year → Month → Day) or quick buttons (Today, Tomorrow) | Tap buttons |
| `number` | Quick-select common values + manual input option | Tap or type |
| `text` | Free text (only when buttons are impossible) | Type |
| `photo`/`document`/`file` | Upload prompt | Send file |
| Optional fields | ⏭ Skip button always visible | Tap Skip |
| Confirmation | ✅ Confirm / ✏️ Edit / ❌ Cancel buttons | Tap button |

> **Rule:** If a field has a finite, predictable set of values — use buttons. Free text is the **last resort**, not the default.

---

## 4. Blueprint Specification

### 4.1 Module Metadata

```yaml
module:
  slug: employee-withdrawal        # Unique kebab-case identifier
  version: "1.0.0"                 # Semantic Versioning (Major.Minor.Patch)
  sectionSlug: finance             # Parent section slug
  name: "employee-withdrawal-name" # i18n key (Arabic in ar.ftl)
  nameEn: "employee-withdrawal-name-en" # i18n key (English in en.ftl)
  icon: "💰"                       # Emoji icon
  description: "employee-withdrawal-desc" # i18n key (optional)
  draftTtlHours: 24                # Redis draft TTL (optional)
  orderIndex: 1                    # Menu order (optional)
  requires: [employees]            # Module dependencies (optional)

  # Auto-generated features
  autoFields: true                 # Auto-add: createdAt, updatedAt, createdBy, updatedBy
  recordPrefix: "WDR"              # Auto-numbering: WDR-001, WDR-002, ...
  softDelete: true                 # Use deletedAt instead of hard delete

  # Record-level status workflow (optional)
  hasStatus: true
  statusFlow: [PENDING, APPROVED, REJECTED]
  defaultStatus: PENDING

  # Duplicate prevention (optional)
  uniqueConstraint: [employeeId, reportDate]
  duplicateErrorKey: "withdrawal-error-duplicate"
```

**Version Semantics:**

| Change Type | Version Bump | Example |
|------------|-------------|--------|
| Breaking: remove/rename field | Major (2.0.0) | Remove `amount` field |
| Additive: new field, new validator | Minor (1.1.0) | Add `bankAccount` field |
| Non-structural: label, hint, display | Patch (1.0.1) | Fix i18n key typo |

The Generator auto-increments the version on `module:migrate` and keeps a `CHANGELOG.md` in the module directory.

### 4.2 Permissions

```yaml
permissions:
  view: [SUPER_ADMIN, ADMIN, EMPLOYEE]
  create: [SUPER_ADMIN, ADMIN]
  edit: [SUPER_ADMIN, ADMIN]
  delete: [SUPER_ADMIN]
  approve: [SUPER_ADMIN, ADMIN]   # Optional — requires Approval Workflow
```

### 4.3 Field Types

| Type | Prisma Type | Telegram UI | Validator |
|------|------------|-------------|-----------|
| `text` | `String` | Free text input | Min/max length |
| `textarea` | `String @db.Text` | Multi-line text input | Min/max length |
| `number` | `Int` | Numeric input (Arabic-Indic digit support) | Range, integer check |
| `decimal` | `Decimal` | Numeric with decimal (non-monetary) | Range, precision |
| `money` | `Float` | Numeric with currency formatting | Positive, precision |
| `date` | `DateTime` | Date picker buttons (Year→Month→Day) | Valid date, range |
| `time` | `String` | Time picker buttons (Hour→Minute) + quick: Now | Valid HH:MM format |
| `boolean` | `Boolean` | ✅ نعم / ❌ لا inline buttons | — |
| `select` | `String` | Inline keyboard buttons | Options list |
| `multiSelect` | `String[]` | Multi-select toggle buttons + ✅ Done | Options list, min/max |
| `email` | `String` | Free text + auto-validate format | Email format check |
| `phone` | `String` | Free text + auto-validate | egyptianPhone (default), international |
| `photo` | `String` | Photo upload → `file_id` | File size limit |
| `document` | `String` | Document upload (PDF/Excel) → `file_id` | File size, allowed types |
| `file` | `String` | Any file upload → `file_id` | File size limit |
| `location` | `Float, Float` | 📍 Share Location button (Telegram native) | Valid coordinates |
| `rating` | `Int` | ⭐⭐⭐⭐⭐ Star buttons (1-5) | Range 1-5 |
| `barcode` | `String` | Photo upload → scan + decode barcode/QR | Valid barcode format |
| `relation` | Foreign Key | Dynamic buttons / Typeahead search | Exists in target model |
| `computed` | (varies) | Hidden — auto-generated | — |

### 4.4 Field Definition

Each field supports the following properties:

| Property | Required | Description |
|----------|----------|-------------|
| `name` | Yes | Field name in camelCase |
| `type` | Yes | One of the 19 field types above |
| `label` | Yes | i18n key for the question prompt |
| `errorKey` | Yes | i18n key for validation error message |
| `required` | Yes | `true` = required, `false` = shows Skip button |
| `hint` | No | i18n key for placeholder/hint text (e.g., "مثال: 5000") |
| `default` | No | Default value (`today` for dates, or a fixed value) |
| `validators` | No | Array of built-in validators |
| `showIf` | No | Conditional display rule |
| `visibleTo` | No | Role-based field visibility (default: all roles) |
| `targetModel` | Relation only | Prisma model name to query |
| `displayField` | Relation only | Field to show in buttons |
| `searchMode` | Relation only | `buttons` (default) or `typeahead` for large datasets |
| `maxButtons` | Relation only | Max buttons before auto-switching to typeahead (default: 20) |
| `options` | Select only | Array of i18n keys for choice options |
| `maxSizeMB` | File types only | Maximum file size in MB |
| `allowedTypes` | Document only | Allowed MIME types (e.g., `["application/pdf"]`) |
| `generator` | Computed only | Hook function reference |

**Complete Example:**

```yaml
fields:
  - name: employeeId               # Relation with search support
    type: relation
    targetModel: Employee
    displayField: fullName
    searchMode: typeahead           # Type to search (for large tables)
    maxButtons: 15                  # Show buttons if ≤ 15 records
    label: "withdrawal-field-employee"
    errorKey: "withdrawal-error-employee"
    required: true
    
  - name: amount
    type: money
    label: "withdrawal-field-amount"
    hint: "withdrawal-hint-amount"  # Placeholder: "مثال: 5000"
    errorKey: "withdrawal-error-amount"
    required: true
    validators:
      - positive                    # > 0
      - max: 100000                 # Maximum value
    
  - name: reportDate
    type: date
    label: "withdrawal-field-date"
    errorKey: "withdrawal-error-date"
    default: today                  # Auto-fills with current date
    required: true

  - name: leaveType
    type: select
    label: "leave-field-type"
    options:
      - "leave-option-sick"
      - "leave-option-annual"
      - "leave-option-unpaid"
    required: true
    
  - name: medicalReport
    type: document                  # PDF/Excel upload
    label: "leave-field-report"
    maxSizeMB: 10
    allowedTypes: ["application/pdf"]
    required: false
    showIf:
      field: leaveType
      equals: "leave-option-sick"

  - name: salary
    type: money
    label: "employee-field-salary"
    errorKey: "employee-error-salary"
    required: true
    visibleTo: [SUPER_ADMIN, ADMIN] # Employees cannot see this field
    
  - name: signatureImage
    type: photo
    label: "withdrawal-field-signature"
    required: false                 # Optional → Skip button shown

  - name: employeeCode
    type: computed                  # Not asked — auto-generated
    generator: hooks.generateEmployeeCode
```

### 4.5 Built-in Validators

| Validator | Applies To | Description |
|-----------|-----------|-------------|
| `positive` | number, money | Value > 0 |
| `min: N` | number, text | Minimum value or length |
| `max: N` | number, text, money | Maximum value or length |
| `egyptianPhone` | text | 11-digit Egyptian phone (010/011/012/015) |
| `egyptianNationalId` | text | 14-digit Egyptian national ID |
| `afterField: X` | date | Must be after another date field |
| `beforeField: X` | date | Must be before another date field |
| `regex: pattern` | text | Custom regex pattern |
| `unique` | text, number | Must be unique in the module's table |

### 4.6 Conditional Fields (`showIf`)

For **single fields** that conditionally appear based on another field's value:

```yaml
- name: medicalReport
  type: photo
  showIf:
    field: leaveType
    equals: "leave-option-sick"

- name: returnDate
  type: date
  showIf:
    field: leaveType
    in: ["leave-option-sick", "leave-option-annual"]
```

### 4.7 Branching Paths (`branches`)

For **entire conversation paths** that change based on a user's selection. Use when multiple fields depend on the same choice:

```yaml
fields:
  - name: employeeId
    type: relation
    targetModel: Employee
    displayField: fullName
    label: "advance-field-employee"
    required: true

  - name: advanceType
    type: select
    label: "advance-field-type"
    options:
      - "advance-option-in-kind"      # سلفة عينية
      - "advance-option-cash"         # سلفة نقدية
    required: true

branches:
  trigger: advanceType               # The field that determines the path

  paths:
    - when: "advance-option-in-kind"
      fields:
        - name: itemDescription
          type: text
          label: "advance-field-item"
          required: true
        - name: quantity
          type: number
          label: "advance-field-quantity"
          required: true
        - name: warehouse
          type: relation
          targetModel: Warehouse
          displayField: name
          label: "advance-field-warehouse"
          required: true

    - when: "advance-option-cash"
      fields:
        - name: amount
          type: money
          label: "advance-field-amount"
          required: true
          validators: [positive, { max: 50000 }]
        - name: bankAccount
          type: text
          label: "advance-field-bank"
          hint: "advance-hint-bank"
          required: false

# Fields after branches = shared (appear for ALL paths)
  - name: signatureImage
    type: photo
    label: "advance-field-signature"
    required: true
```

**Conversation Flow:**
```
┌─ Shared Fields ──────────────────────────┐
│  1. Select Employee (← buttons)       │
│  2. Select Advance Type (← buttons)  │
└────────────┬────────────────────┘
             │
   ┌────────┴────────┐
   ▼                     ▼
┌─ In-Kind ────┐   ┌─ Cash ───────┐
│ 3. Item desc  │   │ 3. Amount       │
│ 4. Quantity   │   │ 4. Bank account │
│ 5. Warehouse  │   └─────┬─────────┘
└────┬────────┘        │
     └────────┬───────┘
              ▼
┌─ Shared (after branch) ──────────┐
│  6. Signature Photo                  │
│  7. ✅ Confirm / ✏️ Edit / ❌ Cancel    │
└──────────────────────────────────┘
```

> **`showIf` vs `branches`:** Use `showIf` for 1-2 conditional fields. Use `branches` when an entire path of questions changes based on one choice.

### 4.8 Field Groups (Step-Based Wizard)

For complex modules, fields can be organized into visual step groups:

```yaml
steps:
  - group: personal-info
    label: "withdrawal-step-personal"     # i18n key for step header
    fields:
      - name: employeeId
        type: relation
        # ...
        
  - group: financial-info
    label: "withdrawal-step-financial"
    fields:
      - name: amount
        type: money
        # ...
      - name: signatureImage
        type: photo
        # ...
```

> **Note:** If `steps` is omitted, all fields are rendered sequentially in a single step (flat mode). Both flat and grouped modes are valid.

### 4.9 Display Configuration

Controls how records appear in list views (Bot + future Dashboard):

```yaml
display:
  listFields: [recordNumber, employeeId, amount, status, createdAt]
  sortBy: createdAt
  sortOrder: desc
  searchable: [employeeId, recordNumber]
  summary:
    title: "{recordNumber} — {employee.fullName}"
    subtitle: "{amount} EGP · {status}"
```

### 4.10 Notification Rules

Define who gets notified on record lifecycle events:

```yaml
notifications:
  onCreate: [ADMIN]              # Notify admins when a new record is created
  onStatusChange:                # Notify on status transitions
    APPROVED: [EMPLOYEE]         # Notify the employee when approved
    REJECTED: [EMPLOYEE]         # Notify the employee when rejected
  onDelete: [SUPER_ADMIN]        # Notify super admin on deletion
```

### 4.11 Export Configuration

Define how records are exported to Excel/PDF reports:

```yaml
export:
  enabled: true
  formats: [excel, pdf]
  fields: [recordNumber, employeeId, amount, status, createdAt]
  headers:                        # i18n keys for column headers
    recordNumber: "export-header-number"
    employeeId: "export-header-employee"
    amount: "export-header-amount"
    status: "export-header-status"
    createdAt: "export-header-date"
```

### 4.12 Flows Configuration

Control which CRUD operations are available for the module:

```yaml
flows:
  list: true              # Enable record list view
  view: true              # Enable single record view
  edit: true              # Enable record editing
  delete: true            # Enable record deletion
  search: true            # Enable search functionality
  statusActions: true     # Enable approve/reject buttons in view
```

> **Default:** All flows are `true`. Set to `false` to disable specific operations.

### 4.13 Display Pagination

```yaml
display:
  pageSize: 5             # Records per page in list view (default: 5)
```

### 4.14 Cross-Record Validation

Validation rules that span **multiple records** (not just the current field):

```yaml
crossValidation:
  - rule: monthlyLimit
    description: "Total employee advances this month cannot exceed 10,000 EGP"
    query: "SUM(amount) WHERE employeeId = current.employeeId AND createdAt.month = current.month"
    max: 10000
    errorKey: "withdrawal-error-monthly-limit"

  - rule: dailyCount
    description: "Max 3 withdrawals per employee per day"
    query: "COUNT WHERE employeeId = current.employeeId AND createdAt.date = today"
    max: 3
    errorKey: "withdrawal-error-daily-count"
```

The Conversation Engine evaluates cross-validation rules in `beforeSave` — if the rule fails, the user sees the error and can edit or cancel.

### 4.15 Custom Actions

Beyond standard CRUD buttons, modules can define **custom action buttons** in View:

```yaml
actions:
  - name: printReceipt
    label: "withdrawal-action-print"
    icon: "🖨"
    handler: hooks.ts#printReceipt
    roles: [SUPER_ADMIN, ADMIN]

  - name: sendReminder
    label: "withdrawal-action-remind"
    icon: "🔔"
    handler: hooks.ts#sendReminder
    roles: [SUPER_ADMIN]
    showWhen: { status: PENDING }       # Only visible for pending records

  - name: duplicateEntry
    label: "withdrawal-action-duplicate"
    icon: "📋"
    handler: hooks.ts#duplicateEntry
    roles: [SUPER_ADMIN, ADMIN]
```

These appear as additional buttons in the View Record screen:
```
┌──────────────────────────────┐
│ 📄 WDR-001 — أحمد محمد          │
│ ...                          │
│                              │
│ ✏️ تعديل  |  🗑 حذف  |  ↩️ رجوع  │
│ 🖨 طباعة إيصال  |  📋 نسخ       │  ← Custom Actions
└──────────────────────────────┘
```

### 4.16 Dashboard Widget (V2.1 — Planned)

> **⚠️ V2.1 Scope** — Requires Admin Dashboard to be implemented first.

Each module can define summary metrics for the admin dashboard:

```yaml
dashboard:
  widget: true
  summary:
    - metric: pending-count
      label: "withdrawal-widget-pending"
      query: "COUNT WHERE status = PENDING"
      icon: "⏳"
    - metric: today-total
      label: "withdrawal-widget-today"
      query: "SUM(amount) WHERE createdAt.date = today"
      icon: "💰"
    - metric: month-total
      label: "withdrawal-widget-month"
      query: "SUM(amount) WHERE createdAt.month = current.month"
      icon: "📈"
```

---

## 5. CRUD Flows (User Interface)

The Conversation Engine renders a complete CRUD interface for each module, fully driven by the Blueprint. All interactions use **Buttons-First** UX.

### 5.1 Module Entry Point

When the user opens a module, they see the main menu:

```
┌──────────────────────────────┐
│ 💰 سحب السلف - القائمة الرئيسية │
│                              │
│ ➕ إضافة سجل جديد              │
│ 📋 عرض السجلات                │
│ 🔍 بحث                        │
│ ↩️ رجوع                       │
└──────────────────────────────┘
```

Buttons shown depend on user permissions:
- `create` permission → ➕ إضافة
- `view` permission → 📋 عرض + 🔍 بحث

### 5.2 List View

Displays records using `display.listFields` with pagination:

```
┌──────────────────────────────┐
│ 📋 سحب السلف — السجلات       │
│                              │
│ WDR-001 — أحمد محمد          │
│   💰 5,000 EGP · ✅ APPROVED   │
│                              │
│ WDR-002 — سعيد علي            │
│   💰 3,200 EGP · ⏳ PENDING    │
│                              │
│ WDR-003 — محمود خالد          │
│   💰 1,500 EGP · ❌ REJECTED   │
│                              │
│ ◀ السابق  صف1/3  ▶ التالي      │
│ ↩️ رجوع                       │
└──────────────────────────────┘
```

Each record is a **clickable button** → opens View.

### 5.3 View Record

Displays all fields of a single record with action buttons:

```
┌──────────────────────────────┐
│ 📄 WDR-001                    │
│                              │
│ 👤 الموظف: أحمد محمد            │
│ 💰 المبلغ: 5,000 EGP            │
│ 📅 التاريخ: 11/03/2026           │
│ 📊 الحالة: ✅ APPROVED           │
│ 🖼 التوقيع: [photo displayed]    │
│                              │
│ ✏️ تعديل  |  🗑 حذف  |  ↩️ رجوع  │
└──────────────────────────────┘
```

Action buttons respect permissions:
- `edit` permission → ✏️ تعديل
- `delete` permission → 🗑 حذف
- `approve` permission + `PENDING` status → ✅ موافقة | ❌ رفض

### 5.4 Edit Flow

Shows current values as buttons — user taps the field they want to change:

```
┌──────────────────────────────┐
│ ✏️ تعديل WDR-001               │
│ اختر الحقل الذي تريد تعديله:    │
│                              │
│ 💰 المبلغ: 5,000 EGP   ← Button  │
│ 📅 التاريخ: 11/03/2026 ← Button  │
│ ↩️ إلغاء                      │
└──────────────────────────────┘
→ User taps "المبلغ" → FieldRenderer asks for new value
→ Saves → Shows updated View
```

> **Note:** Only editable fields appear (auto-fields like `createdAt`, `computed` fields, and `recordNumber` are not shown). Field renderers reuse the same Buttons-First logic from Create flow.

### 5.5 Delete Flow

Confirmation with buttons — no typing:

```
┌──────────────────────────────┐
│ ⚠️ هل تريد حذف WDR-001؟       │
│ 👤 أحمد محمد — 5,000 EGP       │
│                              │
│ ✅ نعم، احذف  |  ❌ لا، إلغاء    │
└──────────────────────────────┘
```

If `softDelete: true` → record is archived (not permanently deleted).

### 5.6 Search Flow

Search criteria are presented as **buttons** based on `display.searchable` fields:

```
┌──────────────────────────────┐
│ 🔍 بحث في سحب السلف            │
│                              │
│ 👤 بحث بالموظف    ← buttons/type│
│ 📊 بحث بالحالة    ← buttons      │
│ 📅 بحث بالتاريخ   ← date picker  │
│ 🔢 بحث برقم السجل ← type         │
│ ↩️ رجوع                       │
└──────────────────────────────┘
```

Search by status → inline buttons (PENDING, APPROVED, REJECTED).
Search by employee → relation typeahead (same as Create flow).
Search by date → date picker buttons.
Results → same List View with pagination.

### 5.7 Status Actions

When `flows.statusActions: true` and user has `approve` permission, View shows status buttons for `PENDING` records:

```
┌──────────────────────────────┐
│ 📄 WDR-002 — ⏳ PENDING         │
│ ...                          │
│                              │
│ ✅ موافقة  |  ❌ رفض  |  ↩️ رجوع  │
└──────────────────────────────┘
```

Approval/Rejection → triggers `onApproval`/`onRejection` hooks + notification rules + audit log.

### 5.8 CRUD Engine Architecture

```
ConversationEngine (extended)
├── CreateFlow          # Existing: fields → validate → confirm → save
├── ListFlow            # Query records → render list → pagination
│   └── ListRenderer    # Formats records using display.summary template
├── ViewFlow            # Fetch record → render all fields → action buttons
│   └── ViewRenderer    # Formats single record with labels + media
├── EditFlow            # Show editable fields as buttons → re-validate → save
├── DeleteFlow          # Confirmation → soft/hard delete → audit
├── SearchFlow          # Criteria buttons → filter query → ListFlow
└── StatusFlow          # Approve/Reject buttons → status update → notify
```

---

## 6. Lifecycle Hooks

Hooks are **optional extensions** for developers who need custom logic beyond what the Blueprint covers.

### Available Hooks

```yaml
hooks:
  beforeSave: ./hooks.ts#beforeSave
  afterSave: ./hooks.ts#afterSave
  onStepValidate: ./hooks.ts#onStepValidate
  beforeDelete: ./hooks.ts#beforeDelete
  afterDelete: ./hooks.ts#afterDelete
  onApproval: ./hooks.ts#onApproval
  onRejection: ./hooks.ts#onRejection
  onView: ./hooks.ts#onView
```

### Hook TypeScript Interface

```typescript
// hooks.ts — Developer writes this file ONLY when needed
import type { ModuleHooks } from '@al-saada/module-kit'

export const hooks: ModuleHooks<WithdrawalData> = {
  // Compute derived fields before database write
  beforeSave: async (data, ctx) => {
    data.employeeCode = await generateNextCode(data.employeeId)
    return data
  },

  // Post-save actions (notifications, external APIs)
  afterSave: async (savedRecord, ctx) => {
    await notifyEmployee(savedRecord.employeeId, 'withdrawal-approved')
  },

  // Cross-field validation after each step
  onStepValidate: async (step, data, ctx) => {
    if (step === 'amount' && data.amount > 50000) {
      throw new ValidationError('withdrawal-error-max-amount')
    }
  },
}
```

### Hooks Requiring Approval Workflow

> **⚠️ Note:** `onApproval` and `onRejection` hooks depend on an **Approval Workflow system** that will be designed as part of V2. This system will enable multi-step approval chains (e.g., Admin approves → Super Admin confirms).

---

## 7. Generator Engine

### What It Generates

When `npm run module:generate blueprint.yaml` runs:

| Generated File | Purpose |
|---------------|---------|
| `schema.prisma` | Prisma model with correct types + relations + indexes |
| `config.ts` | `defineModule()` with metadata + permissions |
| `locales/ar.ftl` | Arabic i18n keys for all labels + errors |
| `locales/en.ftl` | English i18n keys (auto-translated or placeholder) |
| `validators.ts` | Zod schema matching field definitions |
| `hooks.ts` | Skeleton file (only if `hooks` or `computed` fields exist) |
| `tests/module.test.ts` | Auto-generated contract tests |
| `package.json` | Workspace-compatible package definition |

### Conversation Engine (Runtime)

Instead of generating a static `conversation.ts`, V2 uses a **dynamic Conversation Engine** that reads the Blueprint at runtime:

```
ConversationEngine
├── FieldRenderer           # Renders the correct UI per field type
│   ├── TextRenderer        # Free text → waitForText (last resort)
│   ├── TextareaRenderer    # Multi-line text → waitForText
│   ├── NumberRenderer      # Quick-select common values + manual input
│   ├── DecimalRenderer     # Decimal input with precision
│   ├── MoneyRenderer       # Quick-select common amounts + manual input
│   ├── DateRenderer        # Date picker buttons (Year→Month→Day) + Today/Tomorrow
│   ├── TimeRenderer        # Time picker buttons (Hour→Minute) + Now
│   ├── BooleanRenderer     # ✅ نعم / ❌ لا inline buttons
│   ├── SelectRenderer      # Options → inline keyboard buttons
│   ├── MultiSelectRenderer # Toggle buttons + ✅ Done button
│   ├── EmailRenderer       # Free text + auto-validate email format
│   ├── PhoneRenderer       # Free text + auto-validate phone format
│   ├── PhotoRenderer       # Photo → waitFor('message:photo')
│   ├── DocumentRenderer    # Document (PDF/Excel) → waitFor('message:document')
│   ├── FileRenderer        # Any file → waitFor('message:document')
│   ├── LocationRenderer    # 📍 Share Location button (Telegram native)
│   ├── RatingRenderer      # ⭐⭐⭐⭐⭐ Star buttons (1-5)
│   ├── BarcodeRenderer     # Photo upload → barcode/QR decode
│   └── ReferenceRenderer   # DB lookup → dynamic buttons / typeahead search
├── StepManager             # Orders fields, handles showIf, field groups
├── DraftIntegration        # Syncs with existing Redis draft system
├── ValidatorExecutor       # Runs built-in + custom validators
├── HookExecutor            # Calls beforeSave/afterSave hooks
├── StatusManager           # Handles record status transitions
├── NotificationDispatcher  # Sends notifications per notification rules
└── ConfirmationBuilder     # Auto-generates confirm() summary with edit buttons
```

---

## 8. AI Integration

### Strategic Decision

Module Kit V2 is **deliberately deferred until after Phase 4 (AI Assistant)**. This enables powerful AI-driven capabilities:

### AI-Powered Features

| Feature | Description |
|---------|-------------|
| **Intent-to-App** | Admin describes a module in natural language → AI generates the YAML Blueprint → Generator builds the module |
| **Auto-Localization** | AI generates contextually accurate Arabic/English i18n keys for all fields |
| **Smart Suggestions** | AI suggests missing fields based on the module type (e.g., "A custody module usually needs a receipt photo") |
| **Blueprint Validation** | AI reviews Blueprint for logical errors before generation |

### Example: Intent-to-App Flow

```
Admin: "أريد موديولاً لتسجيل إجازات الموظفين — يحتاج اسم الموظف،
        تاريخ البداية والنهاية، نوع الإجازة، وتقرير طبي اختياري للمرضية"

AI → Generates YAML Blueprint:
  - employeeId: relation → Employee.fullName
  - startDate: date (required)
  - endDate: date (required, afterField: startDate)
  - leaveType: select [sick, annual, unpaid]
  - medicalReport: photo (showIf: leaveType = sick)

AI → Generates i18n keys (ar.ftl + en.ftl)
AI → Runs Generator Engine
Result: Fully working module in seconds
```

---

## 9. Module Lifecycle States

Every module transitions through a defined lifecycle:

```
DRAFT → ACTIVE → DISABLED → DEPRECATED → ARCHIVED
  │                  │            │
  └── (not visible   └── (hidden  └── (read-only,
       to users)        from menu)    data preserved)
```

| State | Visibility | Data Writes | Description |
|-------|-----------|-------------|-------------|
| `DRAFT` | Hidden | Allowed (dev only) | Under development/testing |
| `ACTIVE` | Visible | Allowed | Production — users can interact |
| `DISABLED` | Hidden | Blocked | Temporarily disabled by admin |
| `DEPRECATED` | Visible (read-only) | Blocked | Data viewable, no new entries |
| `ARCHIVED` | Hidden | Blocked | Fully retired, data preserved |

---

## 10. Module Creation Channels

Module Kit V2 supports **three creation channels**, each targeting a different user:

| Channel | Target User | Version | Status |
|---------|------------|---------|--------|
| **CLI Interactive** | Developer (terminal) | V2.0 | 📐 Designed |
| **Telegram Builder** | Admin (mobile) | V2.0 | 📐 Designed |
| **Web Dashboard** | Admin/Manager (browser) | V2.1 | 📝 Planned |

> All three channels produce the same YAML Blueprint → same Generator Engine → same output. The Blueprint is the single source of truth.

### 10.1 CLI Commands

### Current (V1)

| Command | Description |
|---------|-------------|
| `npm run module:create` | Interactive scaffolding (boilerplate) |
| `npm run module:list` | List all discovered modules |
| `npm run module:remove` | Remove module files + schema |

### New in V2

| Command | Description |
|---------|-------------|
| `npm run module:generate <file.yaml>` | Generate module from Blueprint |
| `npm run module:generate --interactive` | AI-assisted interactive Blueprint builder |
| `npm run module:validate <slug>` | Validate module compliance (10 rules) |
| `npm run module:migrate <slug>` | Re-generate after Blueprint changes |
| `npm run module:export <slug>` | Export module as shareable Blueprint |

### Interactive Blueprint Builder

The `--interactive` flag launches a **selections-first CLI wizard** powered by Inquirer.js + AI suggestions. The developer selects from choices at every step — typing is minimized:

```
┌─────────────────────────────────────────────────────────────┐
│  🛠️  Module Kit V2 — Interactive Blueprint Builder    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ? Module name (slug): employee-withdrawal  ← type only this  │
│                                                             │
│  ? Select section:            ← Selection (from DB)          │
│    ▸ 🏢 المالية (finance)                                       │
│      📦 العمليات (operations)                                   │
│      👥 الموارد البشرية (hr)                                   │
│      + Create new section                                    │
│                                                             │
│  ? Select template:           ← Selection (from templates)   │
│    ▸ 💰 Salary Advance (advance-request.yaml)                  │
│      📄 Expense Report (expense-report.yaml)                  │
│      ✨ Start from scratch                                    │
│      🤖 AI: Describe in natural language                      │
│                                                             │
│  ┌─ Adding Fields ───────────────────────────────────────┐ │
│  │                                                       │ │
│  │  ? Field name: amount              ← type              │ │
│  │                                                       │ │
│  │  ? Field type:                     ← Selection          │ │
│  │    ▸ 💰 money          🤖 AI suggests: money             │ │
│  │      🔢 number                                          │ │
│  │      📝 text                                            │ │
│  │      📅 date                                            │ │
│  │      ... (all 12 types)                                 │ │
│  │                                                       │ │
│  │  ? Required:                      ← Selection           │ │
│  │    ▸ Yes                                               │ │
│  │      No                                                │ │
│  │                                                       │ │
│  │  ? Validators:                    ← Multi-select        │ │
│  │    ☑ positive          🤖 AI suggests: positive, max     │ │
│  │    ☐ min                                               │ │
│  │    ☑ max: ___                                           │ │
│  │    ☐ egyptianPhone                                     │ │
│  │                                                       │ │
│  │  ? Link to another table?         ← Selection           │ │
│  │    ▸ No                                                │ │
│  │      Yes → Select table:                                │ │
│  │        ▸ Employee  🤖 AI suggests: Employee             │ │
│  │          Truck                                         │ │
│  │          Section                                       │ │
│  │                                                       │ │
│  │  ? Add another field?             ← Selection           │ │
│  │    ▸ Yes                                               │ │
│  │      No → generate YAML                                │ │
│  └───────────────────────────────────────────────────┘ │
│                                                             │
│  ✅ Blueprint generated: employee-withdrawal.yaml             │
│  ✅ Run: npm run module:generate employee-withdrawal.yaml     │
└─────────────────────────────────────────────────────────────┘
```

### AI Suggestions in CLI

The AI Assistant (Phase 4) provides **recommendations** (not automatic choices) at key decision points. The developer always has final say:

| Decision Point | AI Suggestion | How |
|---------------|---------------|-----|
| Field type | Suggests type based on field name (e.g., `amount` → `money`) | 🤖 icon next to suggested option |
| Validators | Suggests validators based on field type + name | Pre-checked in multi-select |
| Relation target | Suggests relevant Prisma models from DB schema | 🤖 icon + sorted by relevance |
| Options list | Suggests common options (e.g., leave types for HR) | Pre-populated but editable |
| Module template | Suggests matching template from `templates/` | Sorted by relevance to slug |
| Missing fields | "A withdrawal module usually has: employee, amount, date" | Prompt after adding fields |

> **Key Principle:** AI only **suggests** and **highlights** — it never auto-selects. The 🤖 icon marks AI recommendations so the developer knows what's suggested vs what's default.

### 10.4 Telegram Builder (V2.0)

Admins with `SUPER_ADMIN` role can create modules directly from Telegram — no terminal access needed:

```
Admin: /module:create

┌──────────────────────────────┐
│ 🛠️ بناء موديول جديد             │
│ اختر طريقة الإنشاء:               │
│                              │
│ 🤖 وصف بالعربي (AI)             │
│ 📋 اختيار من القوالب              │
│ ✨ بناء يدوي (خطوة بخطوة)       │
└──────────────────────────────┘
```

**AI Path (وصف بالعربي):**
```
Admin: "أريد موديول لتسجيل سلف الموظفين — يحتاج اسم الموظف،
        نوع السلفة (عينية أو نقدية)، المبلغ، وتوقيع"

Bot: 🤖 تم توليد البلوبرنت:
     • slug: employee-advance
     • 4 حقول + تفريع (عينية/نقدية)
     • ترقيم تلقائي: ADV-001

     ✅ موافقة وتوليد  |  ✏️ تعديل  |  ❌ إلغاء
```

**Manual Path (خطوة بخطوة):**
Same flow as CLI Interactive but rendered as Telegram inline buttons. Each step = one message with button choices.

**Key Details:**
- Only `SUPER_ADMIN` can access `/module:create`
- Uses the same FieldRenderer logic + AI suggestions as CLI
- Generated Blueprint is saved to `modules/<slug>/blueprint.yaml`
- Generator runs on server automatically after approval

### 10.5 Web Dashboard (V2.1 — Planned)

> **⚠️ V2.1 Scope** — This channel is planned for the next iteration and will be **integrated into the project’s Admin Dashboard** (not a standalone app).

The Web Dashboard provides a premium visual experience for module creation:

```
┌─────────────────────────────────────────────┐
│  Module Builder — Admin Dashboard              │
│                                               │
│  ┌─ Blueprint Editor ─┐  ┌─ Live Preview ───┐ │
│  │ slug: expenses   │  │ 📱 Telegram UI    │ │
│  │ fields:          │  │ ┌────────────┐  │ │
│  │  - amount ✏️ ↑↓   │◄►│ │ كم المبلغ؟  │  │ │
│  │  - category 🔄   │  │ │ [5000][1000]│  │ │
│  │  + Add field ➕   │  │ └────────────┘  │ │
│  └─────────────────┘  └───────────────┘ │
│                                               │
│  [Generate] [Validate] [Preview] [Export]      │
└─────────────────────────────────────────────┘
```

**Unique Web Capabilities (beyond CLI/Telegram):**
- Drag & Drop field reordering
- Live Telegram UI preview (how the conversation will look)
- Syntax-highlighted YAML editor with auto-complete
- Visual branch flow diagram
- One-click template selection with preview
- Bulk operations (import/export multiple modules)

**Integration Strategy:** This will be a dedicated section in the project’s planned Admin Dashboard (not a standalone app), accessible at `/admin/modules/builder`.

---

## 11. Blueprint Templates

Pre-built templates for common Egyptian business patterns:

```
templates/
├── hr/
│   ├── leave-request.yaml       # Employee leave management
│   ├── attendance.yaml         # Daily attendance tracking
│   └── employee-registration.yaml
├── finance/
│   ├── advance-request.yaml    # Salary advance / withdrawal
│   ├── expense-report.yaml     # Expense documentation
│   └── custody.yaml            # Equipment custody tracking
├── operations/
│   ├── fuel-entry.yaml         # Vehicle fuel logging
│   ├── maintenance-ticket.yaml # Equipment maintenance
│   └── daily-report.yaml       # Daily operations report
└── inventory/
    ├── stock-entry.yaml        # Inventory receipt
    └── stock-exit.yaml         # Inventory dispatch
```

---

## 12. Migration Path (V1 → V2)

Existing V1 modules (with manual `conversation.ts`) continue to work unchanged. Migration is **optional and progressive**:

1. **No breaking changes** — V1 `defineModule()` API remains supported
2. **Gradual adoption** — New modules use Blueprints, old modules stay as-is
3. **Convert tool** — `npm run module:export <slug>` can reverse-engineer a Blueprint from an existing module's config + schema (best effort)

---

## 13. Dependencies & Prerequisites

| Dependency | Reason | Status |
|-----------|--------|--------|
| Phase 4: AI Assistant | Enables Intent-to-App + Auto-Localization | 🚧 In Progress |
| Conversation Engine | New runtime component in `packages/module-kit/` | 📐 Design Phase |
| Approval Workflow | Required for `onApproval`/`onRejection` hooks | 📐 Design Phase |
| `approve` Permission | New permission type in RBAC | 📐 Design Phase |

---

## 14. Open Questions

| # | Question | Status |
|---|----------|--------|
| Q1 | Should Blueprint templates ship with the platform or be a separate package? | Open |
| Q2 | Should `module:generate` overwrite existing files or merge changes? | Open |
| Q3 | Should Conditional Fields support complex expressions (AND/OR) or only simple equals/in? | Open |
| Q4 | Should Display Configuration be in the Blueprint or a separate `display.yaml`? | Open |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | 2026-03-11 | Complete rewrite from Q&A format to RFC-style design document. Added: Blueprint Specification, Field Types reference, Conditional Fields, Field Groups, Display Configuration, Module Lifecycle States, Conversation Engine architecture, Blueprint Templates, Migration Path, AI Integration strategy, CLI Commands, Open Questions. |
| 0.2.0 | 2026-03-11 | Added: Relation typeahead search, default values, module dependencies, document/file upload types, hint text, field-level permissions. Field types expanded from 10 to 12. |
| 0.3.0 | 2026-03-11 | Added: Buttons-First UX principle, auto metadata fields, record numbering, record status workflow, notification rules, export configuration, soft delete, duplicate prevention. |
| 0.4.0 | 2026-03-11 | Added: Branching Paths (`branches`) for conditional multi-field conversation flows. Added: Interactive Blueprint Builder CLI with selections-first UX and AI suggestions. |
| 0.5.0 | 2026-03-11 | Added: Complete CRUD Flows section (List, View, Edit, Delete, Search, Status Actions) with full UX wireframes. Added: flows configuration, pageSize, CRUD Engine Architecture. |
| 0.6.0 | 2026-03-11 | Restructured CLI section as "Module Creation Channels" with 3 channels: CLI Interactive (V2.0), Telegram Builder (V2.0), Web Dashboard (V2.1 — integrated with project Dashboard). |
| 0.7.0 | 2026-03-11 | Added: Module versioning (Semantic Versioning) with auto-increment on migrate and CHANGELOG generation. |
| 0.8.0 | 2026-03-11 | **Final Draft.** Added: Cross-Record Validation, Custom Actions, Dashboard Widget (V2.1). Design complete: 16 Blueprint sections. |
| 0.9.0 | 2026-03-11 | Expanded field types from 12 to 19: added textarea, time, email, phone, decimal, location, rating, barcode. Updated Conversation Engine renderers (21 renderers). |

---

**See Also:**
- [Module Kit V1 Reference](module-kit-reference.md) — Current API documentation
- [Module Development Guide](module-development-guide.md) — How to build modules today (V1)
- [Architecture Overview](architecture.md) — System architecture
- [AI Assistant Roadmap](ai-assistant-roadmap.md) — Phase 4 dependency
