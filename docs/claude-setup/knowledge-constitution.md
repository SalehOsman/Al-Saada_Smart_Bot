# Constitution — Al-Saada Smart Bot (Condensed for Project Knowledge)
# Source: .specify/memory/constitution.md v2.5.0

## Project Identity
- **Name**: Al-Saada Smart Bot (بوت السعادة الذكي)
- **Type**: Modular Telegram bot platform for Egyptian business management
- **Users**: ~200, Arabic primary + English
- **Architecture**: Empty engine + dynamic config-driven modules

## Three-Layer Architecture

**Layer 1 — Platform Core (Fixed)**:
Bot engine (grammY), Auth, RBAC (4 roles), Dynamic module loader, Section management, Notifications (BullMQ), Maintenance mode, Audit logging, Redis sessions, Docker (PostgreSQL + Redis)

**Layer 2 — Module Kit (Fixed toolkit)**:
- Conversation Helpers: validate(), confirm(), save()
- ModuleLoader: auto-discovers modules from modules/*/config.ts
- Draft Middleware: Redis persistence with sliding TTL
- CLI Tools: module:create, module:remove, module:list

**Layer 3 — Modules (Variable)**:
config.ts + conversations + schema.prisma + locales/
Lifecycle hooks (optional): beforeSave, afterSave, beforeDelete
90% config / 10% hooks maximum

## RBAC Roles

| Role | Access |
|------|--------|
| Super Admin | Everything — full control |
| Admin | Scoped — assigned sections/modules only |
| Employee | Own data only |
| Visitor | Join request only |

## 11 Core Principles

**I. Platform-First**: Platform 100% complete before any module
**II. Config-Driven**: 90% config, 10% hook code max
**III. Helper Reusability**: Self-contained, any-module compatible, no duplication
**IV. Test-First**: 80%+ coverage on engine code (services, middlewares, utils, validators); UI-layer via integration/E2E
**V. Egyptian Context**: Egyptian ID, phone, governorates, EGP, Cairo timezone, Hijri
**VI. Security**: Secure bootstrap via INITIAL_SUPER_ADMIN_ID env var, no PII in logs, audit all actions
**VII. i18n-Only (NON-NEGOTIABLE)**: Zero Arabic in source code. All text in .ftl files only
**VIII. Simplicity Over Cleverness**: YAGNI, no premature optimization
**IX. Monorepo**: packages/core, module-kit, validators, ai-assistant + modules/
**X. Zero-Defect Gate (NON-NEGOTIABLE)**: Never advance with unresolved issues
**XI. Observability**: Sentry opt-in via SENTRY_DSN, PII filtered, self-hosted supported

## Technology Stack

**Core**: Node.js ≥20, TypeScript 5.x strict, grammY 1.x, Hono, Prisma + PostgreSQL, Redis (ioredis), BullMQ, Pino, Zod, @grammyjs/i18n, dayjs, nanoid, node-cron, ExcelJS, PDFKit

**AI Assistant (Phase 4)**: Vercel AI SDK, Qwen2.5:7b (Ollama local), nomic-embed-text, pgvector, Whisper STT, Google TTS

**Dev Tools**: ESLint (@antfu), Vitest, tsup/tsx, commitlint, GitNexus (dev-only MCP)

## Development Phases

1. Platform Core (001) — ✅ Complete
2. Module Kit (003) — ~90%
3. Production Readiness (005) — Next
4. AI Assistant (002) — Planned
5. Dashboard MVP — Planned
6. Advanced Features — Future

## Governance

- Constitution is highest authority
- Only Owner approves amendments
- Methodology (12 rules) is binding extension
- SpecKit + Antigravity skills are mandatory frameworks
- GitNexus blast radius check required for shared code changes
