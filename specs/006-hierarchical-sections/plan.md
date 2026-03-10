# Implementation Plan: Hierarchical Sections & Advanced Module CLI

**Branch**: `006-hierarchical-sections` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-hierarchical-sections/spec.md`

## Summary

This feature introduces hierarchical sections to the Al-Saada Smart Bot platform. It enhances the `Section` model with a self-referencing relationship (`parentId`) and updates the `module:create` CLI tool to provide an interactive, database-aware wizard for selecting or creating main sections and sub-sections. Furthermore, the Platform Core's Telegram navigation is updated to support nested menus, allowing users to drill down through main sections into sub-sections before reaching modules.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js >= 20)
**Primary Dependencies**: grammY 1.x, Prisma, ioredis, BullMQ, Pino, Zod, Inquirer
**Storage**: PostgreSQL (via Prisma), Redis (for sessions and conversation drafts)
**Testing**: Vitest (80%+ coverage for engine code per Principle IV)
**Target Platform**: Docker (Linux), Telegram Bot
**Project Type**: Web Service (Bot) and CLI Tooling
**Performance Goals**: Sub-second menu navigation in Telegram; responsive CLI interaction
**Constraints**: No Arabic in source code (Principle VII), Config-First architecture (Principle II), 90/10 rule for modules
**Scale/Scope**: Support for nested sections (currently 2 levels: Main -> Sub), ~200 users

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Platform-First | PASS | Enhances Layer 1 (Core) and Layer 2 (Module Kit) infrastructure. |
| II. Config-First | PASS | Sections are dynamic DB entries; module placement is config-driven. |
| III. Helper Reusability | PASS | CLI enhancements are part of the shared Module Kit. |
| IV. Test-First | PASS | CLI logic and navigation routing require unit and integration tests. |
| V. Egyptian Context | PASS | ar/en support for section names is maintained. |
| VI. Security & Privacy | PASS | AdminScope for hierarchical sections must be correctly enforced. |
| VII. i18n-Only | PASS | All CLI prompts and bot messages must use `.ftl` keys. |
| VIII. Simplicity | PASS | Using a simple `parentId` for hierarchy instead of complex trees. |
| IX. Monorepo | PASS | Changes are isolated to `packages/core` and `packages/module-kit`. |
| X. Zero-Defect Gate | PASS | `/speckit.analyze` will be run before implementation. |

## Project Structure

### Documentation (this feature)

```text
specs/006-hierarchical-sections/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (N/A for internal CLI/Bot changes)
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
packages/core/
├── src/
│   ├── bot/
│   │   ├── handlers/
│   │   │   └── menu.ts          # Updated for nested navigation
│   │   └── menus/
│   │       └── sections.ts      # Hierarchical section navigation menus
│   └── services/
│       └── sections.ts          # Updated for hierarchical queries

prisma/
└── schema/
    └── platform.prisma          # Section model update

scripts/
└── module-create.ts             # Enhanced with Inquirer + Prisma logic
```

**Structure Decision**: Standard monorepo layout. Section hierarchy logic belongs in `packages/core` (runtime) and `packages/module-kit` (dev-time CLI).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |
