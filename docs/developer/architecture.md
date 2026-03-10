# Architecture Overview

**Last Updated:** 2026-03-10
**Version:** 1.2.0

Al-Saada Smart Bot is built on a **Four-Layer Architecture** designed for scalability, strict isolation of concerns, and ease of extending features via self-contained modules.

---

## 1. Four-Layer Architecture

### Layer 1: Platform Core (`packages/core/`)
The foundation of the bot. It handles everything that is *not* a specific business feature. (See: [Platform Core Reference](platform-core-reference.md))

- **Entry Point:** `src/main.ts` sets up the Hono web server for health checks and initializes the bot setup.
- **Bot Setup:** `src/bot/index.ts` configures grammY, the middleware chain, and the baseline error handling.
- **Services:** Singleton services for platform-wide features:
  - `AuditService`: Centralized audit logging.
  - `NotificationService`: Queueing and sending notifications.
  - `JoinRequestService`: Handling the user registration lifecycle.
  - `RBACService`: Role-based access control.
  - `AdminScopeService`: Managing scoped admin permissions.
  - `SentryService`: Real-time error tracking and PII filtering.
  - `BackupService`: Automated encrypted database backups.

### Layer 2: Module Kit (`packages/module-kit/`)
The framework for building business features. It provides a standardized API (`validate`, `confirm`, `save`) to ensure all features behave consistently. (See: [Module Kit Reference](module-kit-reference.md))
- **ModuleLoader:** Resides in `core` (`src/bot/module-loader.ts`) but acts as the bridge. It discovers, registers, and loads modules defined using the Module Kit.
- **Draft System:** Middleware (`draft.ts`) that automatically persists user input state to Redis, allowing users to resume interrupted flows.

### Layer 3: Modules (`modules/`)
The actual business features of the bot (e.g., Leave Requests, Maintenance Tickets). Each module is a self-contained package that uses the API provided by Layer 2. *Currently planned / under development.*

### Layer 4: AI Assistant (`packages/ai-assistant/` - Planned)
*(Planned / Not Yet Implemented)*
An intelligent layer utilizing local LLMs (Qwen2.5:7b) and vector databases (pgvector) to provide intelligent semantic search, RAG-based query answers, and automated tasks, strictly adhering to the RBAC rules defined in Layer 1.

---

## 2. Infrastructure

The infrastructure services are orchestrated via `docker-compose.yml`:
- **Database:** PostgreSQL 16 (`al-saada-postgres`). Serves as the primary persistent data store using Prisma ORM with a multi-file schema architecture (`prisma/schema/`).
- **Cache / Session Store:** Redis 7 (`al-saada-redis`). Used for fast, ephemeral data persistence:
  - grammY session storage.
  - Draft state persistence (enabling users to pause and resume module flows).
- **Application:** Node.js (>=20) running the built bot application via `tsx` or standard `node` build.
- **Monitoring:** Sentry integration for error tracking.
- **CI/CD:** GitHub Actions for automated linting, testing, and type-checking.

---

## 3. Package Structure

The project uses a monorepo structure (npm workspaces) to strictly isolate the layers:
```text
/
├── packages/
│   ├── core/           # Layer 1: Platform Core, Bot entry point, Services
│   ├── module-kit/     # Layer 2: Framework for building modules
│   ├── validators/     # Shared Zod validators used across the system
│   └── ai-assistant/   # Layer 4: (Planned) AI and RAG integrations
├── modules/            # Layer 3: Business feature plugins
├── prisma/
│   └── schema/         # Database models (Multi-file schema)
└── docs/               # Technical and user documentation
```

---

## 4. Middleware Chain

The bot processes every incoming Telegram update through a strict middleware chain defined in `packages/core/src/bot/index.ts`. The order is critical:
1. **Global Error Boundary & Sentry:** Catches all subsequent synchronous and asynchronous errors, reporting to Sentry.
2. **Rate Limiter:** Protects against Telegram API flood limits and user spam.
3. **Session:** Initializes session state backed by Redis.
4. **Conversations:** `@grammyjs/conversations` integration for stateful conversational flows.
5. **i18n:** Fluent-based localization (strictly limits dynamic strings; injects `ctx.t`).
6. **Auth:** Attaches the User entity to `ctx.user` (or handles bootstrap/join scenarios).
7. **Draft:** Automatically manages state persistence for active module flows in Redis.
8. **Auto-Retry:** Automatic retry for transient Telegram API failures.
9. **Hydrate:** `@grammyjs/hydrate` added for simplified Context methods.
10. **Logging:** Request lifecycle logging.

---

## 5. Key Design Decisions

- **grammY & @grammyjs/conversations:** Used exclusively for bot interaction because of its excellent TypeScript support and robust conversation handling API which maps perfectly to our module paradigm.
- **Prisma Multi-File Schema:** Chosen to prevent a monolithic `schema.prisma`. Modules and platform core have dedicated files (`main.prisma`, `platform.prisma`), making the codebase scalable and merge-conflict resistant.
- **Redis for Drafts:** Rather than storing intermediate conversational states in PostgreSQL, Redis provides lightning-fast TTL-based storage for drafts, ensuring databases are only hit for validated, confirmed, and finalized data.
- **Strict i18n-Only Principle:** Absolutely no hardcoded raw text strings are sent to users. Everything must go through `locales/*.ftl` to ensure consistent voice and easy localization.
