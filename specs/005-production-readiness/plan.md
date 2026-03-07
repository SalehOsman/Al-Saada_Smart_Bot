# Implementation Plan: Production Readiness

**Branch**: `005-production-readiness` | **Date**: 2026-03-05 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-production-readiness/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Feature 005: Production Readiness implements critical infrastructure and operational capabilities required for production deployment. The feature consists of four main components: (1) Automated database backups with encryption, (2) Error monitoring and alerting with PII filtering, (3) Rate limiting and automatic retry for resilience, and (4) Automated CI/CD pipeline for code quality gates.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode) - Node.js ≥20
**Primary Dependencies**: grammY 1.x, @grammyjs/conversations, @grammyjs/hydrate, @grammyjs/ratelimiter, @grammyjs/auto-retry, @sentry/node, Prisma, Pino
**Storage**: PostgreSQL 16
**Testing**: Vitest
**Target Platform**: Linux server (production deployment)
**Project Type**: web-service
**Performance Goals**: Database backup completes within 5 minutes, error alerts delivered within 60 seconds, CI/CD pipeline completes within 10 minutes
**Constraints**: Sentry must be opt-in via environment variable, PII must be filtered before sending, backups stored locally (no cloud storage for this feature)
**Scale/Scope**: ~200 users, single organization deployment

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Platform-First, Module-Second
✅ **PASS**: Feature is infrastructure/operational layer (Core) - no modules being created.

### Principle II: Config-Driven Architecture
✅ **PASS**: All configuration is via environment variables and config files. No hardcoded values.

### Principle III: Helper Reusability
⚠️ **OBSERVATION**: Feature creates new capabilities (backup service, error monitoring) that could be extracted as reusable services for future features.

### Principle IV: Test-First Development
✅ **PASS**: Testing strategy defined in spec (CI/CD pipeline).

### Principle V: Egyptian Business Context
✅ **PASS**: Telegram alerts in Arabic, timezone (Africa/Cairo) assumed for backup scheduling.

### Principle VI: Security & Privacy
✅ **PASS**: PII filtering explicitly required before sending to Sentry. Backups encrypted. Super Admin only receives alerts and can restore backups.

### Principle VII: i18n-Only User Text
✅ **PASS**: All user-facing messages use i18n keys. No Arabic strings in code.

### Principle VIII: Simplicity Over Cleverness
✅ **PASS**: Using established libraries (@grammyjs packages) rather than custom implementations. Standard pg_dump for backups.

### Principle IX: Monorepo Structure
✅ **PASS**: Implementation follows existing monorepo structure with packages/core.

### Principle X: Zero-Defect Gate
✅ **PASS**: CI/CD pipeline ensures all tests and linting pass before merge.

### Principle XI: Observability
✅ **PASS**: **STRICT ALIGNMENT** - Spec explicitly requires:
- Sentry opt-in via SENTRY_DSN environment variable ✅
- PII filtering via beforeSend hook ✅
- Self-hosted Sentry option supported ✅
- Error alerts sent to SUPER_ADMIN via Telegram ✅

**Constitution Gate**: ✅ **PASS** - All principles aligned. No violations requiring justification.

## Project Structure

### Documentation (this feature)

```text
specs/005-production-readiness/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
packages/core/src/
├── bot/
│   ├── monitoring/           # Sentry integration and error handling
│   │   ├── sentry.service.ts
│   │   ├── sentry.middleware.ts
│   │   └── error-alert.service.ts
│   ├── middleware/           # Rate limiting and auto-retry middleware
│   │   ├── rate-limit.middleware.ts
│   │   └── auto-retry.middleware.ts
│   ├── services/              # Backup service
│   │   └── backup.service.ts
│   └── utils/                # PII filtering utilities
│       └── pii-filter.ts
└── locales/
    ├── ar.ftl              # Arabic error monitoring and backup messages
    └── en.ftl              # English error monitoring and backup messages

.github/workflows/
├── ci.yml                 # Main CI/CD pipeline
├── lint.yml              # Linting check (separate for clarity)
└── test.yml              # Test execution check

scripts/
└── backup.sh              # Database backup script
```

**Structure Decision**: The feature implements infrastructure capabilities within the existing `packages/core` package structure. New monitoring, rate limiting, and backup services are added under `bot/`. GitHub Actions workflows are added under `.github/workflows/`. A standalone backup script is added under `scripts/` for Docker integration.

## Complexity Tracking

> No constitutional violations requiring justification.

**Design Decisions**:

| Decision | Rationale |
|----------|------------|
| Sentry integration in packages/core | Sentry is platform infrastructure, not module-specific. Follows observability requirement. |
| Rate limiting as middleware | grammY middleware pattern is standard and allows easy addition/removal. |
| Backup as standalone script | pg_dump runs outside Node.js process. Simpler than integrating into bot. Cron schedules script directly. |
| CI/CD in .github/workflows | Standard GitHub Actions location. Separate workflows for clarity. |
| PII filtering utility | Centralized PII filtering prevents duplication and ensures consistency across all error reporting. |

## Phase 0: Research

### Unknowns Resolved

No [NEEDS CLARIFICATION] markers in specification. All technical details are documented in Assumptions section.

### Technology Choices Documented

The following technologies are specified in the Assumptions section as user choices:

| Technology | Purpose | Notes |
|------------|---------|--------|
| Sentry | Error tracking and monitoring | Self-hosted option supported via configurable DSN |
| @grammyjs/ratelimiter | Rate limiting per user/command | Standard grammY middleware |
| @grammyjs/auto-retry | Automatic retry for transient failures | Exponential backoff implementation |
| GitHub Actions | CI/CD pipeline | Lint, test, prisma generate, GitNexus analysis |
| pg_dump | Database backup | Standard PostgreSQL dump utility |
| AES-256 encryption | Backup file encryption | Industry standard encryption |

### Best Practices Researched

| Area | Best Practice | Decision |
|-------|---------------|----------|
| Sentry integration | Use beforeSend hook for PII filtering | Implemented per spec requirements |
| Rate limiting | Per-user limits with clear error messages | Specified in functional requirements |
| Auto-retry | Distinguish transient vs permanent errors | Transient: network timeouts, service unavailable. Permanent: validation errors |
| CI/CD pipeline | Block merge on failed checks | Required by Zero-Defect Gate |
| Database backups | Encrypt at rest, schedule via cron | Follows security best practices |
| Backup retention | Automated deletion of old backups | Prevents disk space exhaustion |

**No further research required** - All technical decisions are documented in specification assumptions.

## Phase 1: Design & Contracts

### Data Model

The feature introduces minimal new data persistence. Backup metadata is stored for tracking and audit purposes.

#### Backup Metadata

**Table**: `BackupMetadata`

| Field | Type | Description | Validation |
|--------|--------|-------------|--------------|
| id | String (nanoid) | Unique backup identifier | Required |
| fileName | String | Name of the backup file | Required, format: `backup-YYYYMMDD-HHMMSS.sql.gz.enc` |
| filePath | String | Full path to backup file | Required |
| fileSize | BigInt | Size in bytes | Required, must be > 0 |
| status | Enum | `pending`, `in_progress`, `completed`, `failed` | Required |
| startedAt | DateTime | Backup start timestamp | Required |
| completedAt | DateTime | Backup completion timestamp | Optional (null until completed) |
| createdBy | String (Telegram ID) | User who initiated backup | Required |
| retentionDays | Int | Number of days to retain backups | Default: 30 |
| errorMessage | String | Error message if failed | Optional |

**State Transitions**:
- `pending` → `in_progress` → `completed` (successful backup)
- `pending` → `in_progress` → `failed` (backup failed)

#### Error Alert Tracking

No persistent storage for error alerts - Sentry handles this. Alert throttling is implemented in-memory for current session.

### API Contracts

This feature does not expose new user-facing APIs. Integration points are:

1. **Backup Service Interface** (internal):
   - `createBackup(trigger?: 'manual' | 'scheduled')` → BackupMetadata
   - `getBackup(id: string)` → BackupMetadata | null
   - `listBackups()` → BackupMetadata[]
   - `restoreBackup(id: string)` → Promise<void>
   - `deleteBackup(id: string)` → Promise<void>

2. **Bot Commands** (via Telegram):
   - `/backup` (Super Admin only) - Trigger manual backup
   - `/restore <id>` (Super Admin only) - Restore from backup
   - `/backups` (Super Admin only) - List available backups

3. **Sentry Integration** (internal):
   - `initSentry()` → void
   - `captureException(error: Error, context?: object)` → void
   - `sendAlertToSuperAdmin(error: Error)` → Promise<void>

**Contracts Location**: `contracts/` directory (minimal for this infrastructure feature).

### Quickstart Guide

**Purpose**: Enable Super Admin to configure and verify Production Readiness features.

#### 1. Environment Configuration

Create or update `.env` file:

```bash
# Sentry Integration (Optional - feature is opt-in)
SENTRY_DSN=https://your-sentry-dsn-or-self-hosted-url

# Backup Configuration
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"  # Cron: Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_DIR=/app/backups
BACKUP_ENCRYPTION_KEY=your-encryption-key-here

# Rate Limiting Configuration
RATE_LIMIT_ENABLED=true
RATE_LIMIT_REQUESTS_PER_MINUTE=30
RATE_LIMIT_WINDOW_MINUTES=1
```

#### 2. Database Migration

Generate and apply Prisma migration for BackupMetadata table:

```bash
pnpm db:generate
pnpm db:migrate
```

#### 3. Verify Sentry Integration

Test Sentry connection with a controlled error:

1. Set `SENTRY_DSN` in environment
2. Restart bot
3. Trigger a test action that logs an error
4. Verify error appears in Sentry dashboard
5. Verify PII is filtered (names, phone numbers, IDs should not appear)
6. Verify Telegram alert is sent to Super Admin

#### 4. Verify Backup Functionality

Test backup and restore process:

1. Ensure `BACKUP_ENABLED=true` is set
2. Trigger manual backup via `/backup` command
3. Verify backup file is created in `BACKUP_DIR`
4. Verify backup file is encrypted (`.enc` extension)
5. Trigger `/backups` command to list backups
6. Test restore via `/restore <id>` command
7. Confirm restore requires Super Admin approval

#### 5. Verify Rate Limiting

Test rate limiting behavior:

1. Send multiple rapid requests from same user
2. Verify requests are rate-limited after threshold
3. Verify clear error message is shown
4. Test that different users have independent limits
5. Test Super Admin can bypass limits for emergencies

#### 6. Verify CI/CD Pipeline

Create a test pull request to verify CI/CD:

1. Create feature branch with intentional test failure
2. Open pull request
3. Verify GitHub Actions runs all checks (lint, test, prisma generate, GitNexus analysis)
4. Verify PR is blocked from merging
5. Fix tests and verify PR becomes mergeable

### Agent Context Update

The following new technologies are being added to the project:

- **@sentry/node** - Error tracking SDK
- **@grammyjs/ratelimiter** - Rate limiting middleware
- **@grammyjs/auto-retry** - Automatic retry middleware

Run the agent context update script to register these technologies.

---
## Quality Gates

All quality gates have passed:

- ✅ Constitution Check: All principles aligned, especially Principle XI (Observability)
- ✅ No [NEEDS CLARIFICATION] markers requiring research
- ✅ Project structure defined and follows monorepo conventions
- ✅ Data model defined for backup metadata tracking
- ✅ Quickstart guide provides complete setup instructions

**Ready for Phase 2**: `/speckit.tasks` can now be executed to generate the task list.
