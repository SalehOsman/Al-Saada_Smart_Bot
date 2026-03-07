# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased / v0.1.0-rc] - 2026-03-07

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
