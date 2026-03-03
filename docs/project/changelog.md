# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added

-   (2026-03-03) System documentation phase C (Arabic user guides), phase B (API references), and phase A (directory restructuring).
-   (2026-03-02) Layer 2 (Module Kit) implementation including dynamic module loader, CLI generators, validation utilities, persistence handling, and AI Assistant integration planning.
-   (2026-02-27) Phase 9 Zero-Defect Gate blocking requirements to constitution.
-   (2026-02-27) Core user management, join request approval processes, and generic RBAC (Role-Based Access Control) using `AdminScope`.
-   (2026-02-27) Audit Service and centralized Notification Delivery Worker.
-   (2026-02-24) Constitution v2.0.0 outlining Principle VII (i18n-Only).
-   (2026-02-20) Core generic start handler, authentication bootstrap logic, menu router, and join request conversations.
-   (2026-02-17) SpecKit CLI automated checklist, analysis, and validation generators.
-   (2026-02-17) Project scaffolding including PostgreSQL Schema via Prisma, generic test environment via Vitest, session caching via Redis, and linting environment.

### Changed

-   (2026-03-02) Integrated `003-module-kit` into main incorporating specification remediations and documentation.
-   (2026-03-02) Realigned the AI documentation to explicitly document Smart Mode confidence thresholds and pgvector indexing configurations.
-   (2026-02-23) Unified the `/start` flow migrating bootstrap logic entirely into `joinRequestService`.
-   (2026-02-22) Consolidated the Grammy JS conversational flow state methodologies.
-   (2026-02-17) Migrated project governance and constitution to v1.3.0 introducing generic hooks principles.

### Fixed

-   (2026-03-02) Rectified multiple documentation discrepancies regarding the Vercel AI SDK integration methodologies and Voice Session modes.
-   (2026-02-25) Replaced all hardcoded string invocations within handlers/services with localized `i18n` `.ftl` counterparts.
-   (2026-02-25) Restructured Database Schema definitions replacing pure strings with bounded Enums (e.g., `AuditAction`, `NotificationType`).
-   (2026-02-24) Aligned `AdminScope` model relationships using explicit `sectionId` constraints.
-   (2026-02-22) Fixed Telegram Context context bindings for BigInt operations parsing numeric Telegram IDs safely.

### Removed

-   (2026-03-03) Deprecated `docs/wiki` and obsolete architectural references (e.g., "Flow Engine" design patterns).
-   (2026-03-01) Abolished "003-flow-engine" specifications permanently replacing them with "003-module-kit".
-   (2026-02-22) Purged legacy AI agent output buffers to align with standard project conventions.
