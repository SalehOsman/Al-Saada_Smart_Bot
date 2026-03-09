# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [v0.3.0] - 2026-03-09

This release completes Feature 005: Production Readiness — all 26 tasks across 7 phases. The platform is now ready for production deployment with monitoring, backups, resilience, and CI/CD.

### Added
- **Sentry Integration (US2):** Opt-in error monitoring via SENTRY_DSN with automatic PII filtering (Egyptian phone numbers, national IDs, emails) in beforeSend hook. Self-hosted Sentry supported.
- **Error Alerts (US2):** Real-time Telegram notifications to all active SUPER_ADMINs on unhandled exceptions, with 5-minute in-memory throttling per error signature.
- **Automated Backups (US1):** Daily encrypted database backups using pg_dump + AES-256-GCM. Configurable schedule, retention policy, and encryption key. SUPER_ADMIN commands: /backup, /backups with two-step interactive restore approval.
- **Rate Limiting (US3):** Per-user request limiting via @grammyjs/ratelimiter with SUPER_ADMIN bypass. Configurable via RATE_LIMIT_* environment variables.
- **Auto-Retry (US3):** Automatic retry for transient Telegram API failures (429, 502, 503, 504, ETIMEDOUT, ECONNRESET) via @grammyjs/auto-retry with exponential backoff, max 3 attempts.
- **CI/CD Pipeline (US4):** GitHub Actions workflows for ESLint, Vitest, Prisma schema validation, and TypeScript typecheck on every PR and push to main.
- **274 tests passing** with clean typecheck and lint.

### Changed
- PII filter pattern order optimized: National ID matched before phone to prevent incorrect masking.
- Error handler enriched with Sentry tags (user_role) and ErrorAlertService integration.
- Sentry middleware positioned after session middleware for proper role context.
- Removed legacy backup service (services/backup.ts) — replaced by bot/services/backup.service.ts.

### Security
- ErrorAlertService uses dependency injection (setBotApi) instead of circular import.
- Sentry.setUser sends only Telegram ID — no username or PII.
- Optional chaining on ctx.session?.role in error handler for robustness.

---

## [v0.1.0] - 2026-03-07 (no separate tag — merged into v0.3.0)

This release represents the completion of Layer 1 (Platform Core) Phases 1 through 9, and the stabilization phase of Phase 10. The platform engine is now fully active with 80.97% test coverage.

### Added
- **RBAC System:** Full Role-Based Access Control (Super Admin, Admin, Employee, Visitor) with scoped permissions (AdminScope) by section or module.
- **Section Hierarchy:** Core support for main sections and sub-sections with depth limits and cascading deletion protection.
- **Dynamic Module Loader:** Infrastructure to automatically discover and load modules from the `modules/` directory at startup.
- **Redis Session Management:** Persistent 24-hour sessions replacing in-memory maps, including navigation breadcrumbs (`currentMenu`).
- **Audit Logging Engine:** Comprehensive auditing for 28 distinct system actions, with PII masking restricted properly to logs only.
- **Maintenance Mode:** Global toggle restricting access to Super Admins only during upgrades.
- **Settings Menu:** In-bot UI for Super Admins to manage maintenance, defaults, and system health checks.
- **Join Request Flow:** Fully functional onboarding flow for Visitors to request access, pending Admin approval.
- **Automated Testing:** 239 active tests passing with strict 80% code coverage enforced on engine code (services, middlewares, utils, validators).
- **Module Kit Infrastructure:** Preparation for Layer 2 dynamic conversation blocks and CLI scaffolding tools.

### Changed
- Refactored Telegram polling to adhere to flood control limits using graceful timeouts and BullMQ for notifications.
- Updated Constitution to v2.5.0 clarifying the "engine code" boundaries for Zero-Defect Gates.
- Changed development methodology to strictly enforce "Spec-First, Code-Second" rule (Rule 12).
- Migrated test configuration to Vitest workspaces separating fast unit tests from slower CLI E2E scripts.

## [v0.0.1] - 2026-02-20

### Added
- Initial monorepo scaffolding (core, module-kit, validators).
- Basic grammY bot setup with Hono dev server.
- Database container initialization (PostgreSQL + Prisma).
- Foundational `spec.md` and `plan.md` outlines.
