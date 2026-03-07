# Data Model: Feature 005 - Production Readiness

**Feature**: Production Readiness
**Date**: 2026-03-05
**Purpose**: Define data structures for backup metadata tracking

## Backup Metadata

The feature introduces a persistent data model for tracking database backups. This enables audit trail and status tracking for all backup operations.

### Entity: BackupMetadata

**Table**: `BackupMetadata`

| Field | Type | Description | Validation |
|--------|--------|-------------|--------------|
| id | String (nanoid) | Unique backup identifier | Required, unique |
| fileName | String | Name of the backup file | Required, format: `backup-YYYYMMDD-HHMMSS.sql.gz.enc` |
| filePath | String | Full path to backup file | Required |
| fileSize | BigInt | Size of the backup file in bytes | Required, must be > 0 |
| status | Enum | Current backup status | Required, values: `pending`, `in_progress`, `completed`, `failed` |
| startedAt | DateTime | Timestamp when backup operation started | Required |
| completedAt | DateTime | Timestamp when backup operation completed | Optional, null until completed |
| createdBy | String | Telegram ID of user who initiated backup | Required for manual backups, system for scheduled |
| retentionDays | Int | Number of days this backup should be retained | Optional, defaults to 30 |
| errorMessage | String | Error message if backup failed | Optional |

### Indexes

- Primary: `id` (unique identifier)
- Index: `status` + `completedAt` (for querying active/completed backups)
- Index: `createdBy` (for filtering backups by user)

### Relationships

No external relationships. BackupMetadata is a standalone entity for tracking backup operations.

### State Transitions

```
[manual] ─── createBackup() ──────────────┐
                                               │
                                               ▼
[pending] ───────────────────────────────────────► [in_progress]
                                               │
                                               ├─┬─────────────────────────────────────┐
                                               │ │                               │
                                               │ ▼                               ▼
                                         [completed]                     [failed]
```

**Transition Rules**:
- Manual backup creation starts in `pending` state
- Backup execution starts → `in_progress` state
- Backup completes successfully → `completed` state (fills `completedAt`)
- Backup fails → `failed` state (fills `errorMessage`)

### Prisma Schema Addition

Add to `prisma/schema/` (or appropriate schema file):

```prisma
model BackupMetadata {
  id          String   @id @default(cuid())
  fileName    String
  filePath     String
  fileSize     BigInt
  status       BackupStatus
  startedAt    DateTime @default(now())
  completedAt  DateTime?
  createdBy    String
  retentionDays Int      @default(30)
  errorMessage String?

  @@index([status, completedAt(sort: Desc)])
  @@index([createdBy])
}

enum BackupStatus {
  PENDING
  IN_PROGRESS
  COMPLETED
  FAILED
}
```

## Error Alert Tracking

The feature does not require persistent storage for error alerts. Sentry handles error tracking and alert delivery. Alert throttling is implemented in-memory for the current bot session only.

### Alert Throttling State

| Property | Type | Description |
|----------|--------|-------------|
| errorSignature | String | Hash of error type + stack trace (for deduplication) |
| lastAlertSentAt | DateTime | Timestamp when last alert was sent for this error |
| alertCount | Int | Number of alerts sent for this error in current session |

**Throttling Rules**:
- Do not send alert if same error signature was sent within last 5 minutes
- Increment alert count for repeated errors
- Always send first occurrence immediately
