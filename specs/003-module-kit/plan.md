# Implementation Plan: 003-module-kit (Layer 2 Module Kit)

**Branch**: `003-module-kit` | **Date**: 2026-03-01 | **Spec**: `specs/003-module-kit/spec.md`
**Input**: Feature specification from `specs/003-module-kit/spec.md`

## Summary

The Module Kit (Layer 2) provides a streamlined, developer-centric toolkit for building and managing bot modules. It delivers CLI scaffolding (`module:create`, `module:remove`, `module:list`), a dynamic Module Loader with auto-discovery, standardized data collection helpers (`validate`, `confirm`, `save`) with automatic PII-masked audit logs (NOT masked in notifications) and robust draft recovery via Redis with sliding TTL. The technical approach leverages Prisma 6.7.0's Multi-File Schema (`prismaSchemaFolder`) for database isolation and grammY's conversation system for stateful user interactions. All module text is strictly i18n-compliant using slug-prefixed hyphen-separated keys in Fluent `.ftl` files. Root `package.json` workspaces MUST include `modules/*` for internal dependency resolution.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode), Node.js >= 20  
**Primary Dependencies**: grammY 1.x, @grammyjs/conversations, @grammyjs/hydrate, ioredis, Pino, Vitest  
**Storage**: Prisma ORM 6.7.0 (PostgreSQL) with `prismaSchemaFolder`, Redis (ioredis) for draft storage  
**Testing**: Vitest (Unit, Integration, E2E)  
**Target Platform**: Docker-based Node.js environment  
**Project Type**: Telegram Bot Framework / Modular Engine  
**Performance Goals**: CLI scaffolding < 1 minute; ModuleLoader startup < 5 seconds; 100% reliability for automatic audit logs/notifications  
**Constraints**: Principle VII (i18n-Only User Text); Existing Layer 1 source files remain untouched. New infrastructure files (ModuleLoader, Draft Middleware) MAY be added to packages/core/ per SC-005. Minimal, non-breaking schema additions (e.g., Section.slug) are also permitted. PII masking in audit logs (Principle VI). Root `package.json` workspaces MUST include `modules/*` to allow modules to `import { defineModule } from '@al-saada/module-kit'`.  
**Scale/Scope**: Support for ~1,000 concurrent users across multiple organization-specific modules

## External Dependencies from Layer 1

The Module Kit (Layer 2) depends on the following services already implemented in `packages/core/` (Layer 1). These are NOT built as part of this feature — they are consumed via direct imports.

| Service | Location | Used By | Purpose |
|---------|----------|---------|---------|
| `auditService.log()` | `packages/core/src/services/audit-logs.ts` | `save()` helper | Creates AuditLog entries with PII redaction |
| `queueNotification()` | `packages/core/src/services/notifications.ts` | `save()` helper | Queues individual notifications via BullMQ |
| `queueBulkNotifications()` | `packages/core/src/services/notifications.ts` | `save()` helper | Queues batch notifications for multiple admins |
| `notifyAdmins()` | `packages/core/src/bot/utils/formatters.ts` | `save()` helper | Sends notifications to ALL active admins (no scope filter) |

## Design Decisions from Clarification

Decisions made during `/speckit.clarify` session (2026-03-03). These document the current implementation and identify future improvements.

| Decision | Current Implementation | Future Improvement (Backlog) |
|----------|----------------------|------------------------------|
| Redis unavailable mid-flow | Draft middleware catches Redis errors silently (try/catch + Pino log). Conversation continues normally | Add user warning via `module-kit-draft-save-unavailable` i18n key |
| save() DB failure | Throws error, draft preserved in Redis. User sees `module-kit-save-failed` | Add max 1 automatic retry before throwing. Add `module-kit-save-failed-persistent` for retry failure |
| Conversation inactivity timeout | No timeout — grammY handler stays active until user acts | Add 15-min timeout: release handler, keep draft, notify via `module-kit-conversation-timeout` |
| Concurrent module conversations | One active conversation per user (grammY limitation). Starting new module exits current conversation. Draft preserved in Redis | No change needed — current behavior is correct |
| confirm() with empty data | No validation — passes through | Add developer-facing error guard: throw if data object is empty |
| Scoped admin notifications | `notifyScopedAdmins()` exists as private function inside `persistence.ts` — resolves sectionSlug → Section → AdminScope → ADMINs + all SUPER_ADMINs | No change needed — function works correctly despite being a separate function rather than inline logic |

**Future i18n keys (not yet implemented)**: `module-kit-draft-save-unavailable`, `module-kit-save-failed-persistent`, `module-kit-conversation-timeout`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

1. **Principle I (Platform-First)**: Module Kit is Layer 2 — built as standalone package `@al-saada/module-kit` in `packages/module-kit/`. New infrastructure files MAY be added to `packages/core/` per SC-005. ✅
2. **Principle II (Config-Driven)**: `defineModule()` and CLI scaffolding enforce config-first patterns. 90/10 rule maintained. ✅
3. **Principle III (Flow Block Reusability)**: `validate()`, `confirm()`, `save()` helpers are self-contained and work with ANY module. ✅
4. **Principle IV (Test-First)**: Vitest configured for unit + integration tests. 80% minimum coverage enforced. ✅
5. **Principle V (Egyptian Context)**: Module Kit integrates with `@al-saada/validators` for Egyptian-specific validations. ✅
6. **Principle VI (Security & Privacy)**: `save()` masks PII (phone, nationalId) in audit logs. RBAC enforced via `permissions.view` for visibility. ✅
7. **Principle VII (i18n-Only)**: All module text uses slug-prefixed hyphen-separated keys (`fuel-entry-prompt-amount`). Module names are i18n keys, not raw Arabic. ✅
8. **Principle VIII (Simplicity)**: Last-Write-Wins (LWW) for concurrency. Auto-discovery at startup avoids central registries. ✅
9. **Principle IX (Monorepo)**: Standalone `packages/module-kit/` package. Modules in `modules/` directory. ✅
10. **Principle X (Zero-Defect)**: `/speckit.analyze` will be run before any implementation. ✅

## Project Structure

### Documentation (this feature)

```text
specs/003-module-kit/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (generated by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/
├── core/                # Layer 1 (Read-only for this feature)
│   ├── src/
│   │   ├── bot/
│   │   │   ├── module-loader.ts    # Dynamic module discovery & registration
│   │   │   └── middleware/
│   │   │       └── draft.ts         # Draft middleware with sliding TTL
├── module-kit/          # @al-saada/module-kit (Layer 2 — NEW)
│   ├── src/
│   │   ├── index.ts                 # Public API: defineModule, validate, confirm, save
│   │   ├── define-module.ts         # defineModule() utility
│   │   ├── validation.ts            # validate() helper
│   │   ├── confirmation.ts          # confirm() helper with targeted editing
│   │   ├── persistence.ts           # save() with auto audit + auto notifications + PII masking
│   │   ├── pii-masker.ts            # PII masking utility for audit logs
│   │   └── types.ts                 # ModuleDefinition, SaveOptions, ValidateOptions interfaces
│   ├── tests/
│   │   ├── validation.test.ts
│   │   ├── confirmation.test.ts
│   │   └── persistence.test.ts
│   ├── package.json                 # name: "@al-saada/module-kit"
│   └── tsconfig.json
├── validators/          # Egyptian validation library (Existing)
modules/                 # Dynamic module container
├── {slug}/              # Individual module folder (e.g., fuel-entry)
│   ├── config.ts        # Module definition (defineModule)
│   ├── add.conversation.ts  # grammY conversation handler (Create)
│   ├── edit.conversation.ts # grammY conversation handler (Edit — optional)
│   ├── hooks.ts         # Lifecycle hooks (optional)
│   ├── schema.prisma    # Module-specific database schema
│   ├── locales/
│   │   ├── ar.ftl       # Arabic translations (slug-prefixed keys)
│   │   └── en.ftl       # English translations (slug-prefixed keys)
│   └── tests/
│       └── flow.test.ts # Module flow tests (mandatory)
prisma/
├── schema/              # Prisma Multi-File Schema root (prismaSchemaFolder)
│   ├── main.prisma      # datasource + generator blocks
│   ├── platform.prisma    # User, JoinRequest, Section, Module, AuditLog, Notification, AdminScope models
│   └── modules/         # Destination for module schema snippets
scripts/
├── module-create.ts     # CLI: npm run module:create
├── module-remove.ts     # CLI: npm run module:remove
└── module-list.ts       # CLI: npm run module:list
```

**Structure Decision**: Monorepo with a standalone `packages/module-kit/` package for shared Layer 2 logic, a dedicated `modules/` directory for dynamic discovery, and `scripts/` for CLI tools. This ensures zero changes to the underlying platform core (SC-005).

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|--------------------------------------|
| None | N/A | N/A |
