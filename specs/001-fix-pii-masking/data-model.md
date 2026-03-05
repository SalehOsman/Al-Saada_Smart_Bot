# Data Model: Phase 1 Critical UX Fixes

**Feature**: 001-fix-pii-masking
**Date**: 2026-03-05

## Overview

This feature uses **existing entities** with **no schema changes**. All functionality is implemented at the handler and service level, extending existing capabilities.

---

## Existing Entities

### User

**Purpose**: Represents bot users with profile information.

**Fields** (all existing, no changes):

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| telegramId | BigInt | Primary Key, Unique | User's Telegram ID |
| telegramUsername | String? | Optional | @username from Telegram |
| fullName | String | Required, min 2 chars | Full name in Arabic |
| nickname | String? | Optional | Auto-generated if not provided |
| phone | String | Required, Egyptian format | 11 digits: 010/011/012/015 |
| nationalId | String | Required, @unique | 14 digits Egyptian National ID |
| role | Enum | Required | VISITOR, EMPLOYEE, ADMIN, SUPER_ADMIN |
| isActive | Boolean | Default: true | Account status |
| language | String | Default: 'ar' | 'ar' or 'en' |
| lastActiveAt | DateTime? | Optional | Last activity timestamp |
| createdAt | DateTime | Auto-generated | Account creation date |

**Display Rules** (FR-002, FR-016):
- User Profile View: Complete, unmasked display for authorized users
- Audit Logs: PII masked (first 4 digits + 10 X's for National ID)

---

### JoinRequest

**Purpose**: Pending user registration requests.

**Fields** (all existing, no changes):

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | Auto-generated | Request code |
| telegramId | BigInt | Required, FK->User | User's Telegram ID |
| fullName | String | Required | Full name in Arabic |
| nickname | String? | Optional | Display name |
| phone | String | Required | Egyptian format |
| nationalId | String | Required | 14 digits |
| status | Enum | Required | PENDING, APPROVED, REJECTED |
| createdAt | DateTime | Auto-generated | Request timestamp |
| reviewedAt | DateTime? | Optional | Review completion timestamp |
| reviewedBy | BigInt? | Optional, FK->User | Reviewing admin |

**State Transitions**:
- PENDING -> APPROVED (by Super Admin or Admin)
- PENDING -> REJECTED (by Super Admin or Admin)
- APPROVED/REJECTED -> Final states (no further transitions)

---

### AdminScope

**Purpose**: Grants ADMIN users access to specific sections/modules.

**Fields** (all existing, no changes):

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | Auto-generated | Primary Key |
| userId | BigInt | Required, FK->User | Admin user ID |
| sectionId | String? | Optional, FK->Section | Section access |
| moduleId | String? | Optional, FK->Module | Module access |
| createdAt | DateTime | Auto-generated | Assignment timestamp |
| createdBy | BigInt | Required, FK->User | Super Admin who assigned |

**Scope Rules** (Constitution Principle VII):
- `sectionId` + `moduleId` = null -> Access to entire section
- `sectionId` only + `moduleId` set -> Access to specific module only
- Scope inheritance: Section scope includes all sub-sections
- Deleted sections: FK CASCADE removes related scopes

---

### AuditLog

**Purpose**: Tracks all significant user actions.

**Fields** (all existing, no changes):

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| id | String | Auto-generated | Primary Key |
| userId | BigInt | Required, FK->User | Acting user |
| action | Enum | Required | Action type (e.g., USER_ACTIVATE) |
| targetType | String | Required | Target entity type (e.g., 'User') |
| targetId | String | Required | Target entity ID |
| details | Json? | Optional | Additional details (PII masked) |
| createdAt | DateTime | Auto-generated | Action timestamp |

**PII Masking** (Constitution Principle VI):
- `details` JSON must have PII masked before storage
- National ID: `{first4}XXXXXXXXXX` format
- Phone: `{first3}XXXXXXXX` format
- User Profile View: Display complete, original data (no masking)

---

## Redis Data Structures

### Confirmation State

**Key Pattern**: `confirmation:{telegramId}:{token}`

**TTL**: 300 seconds (5 minutes) per FR-006

**Value Structure**:
```typescript
interface ConfirmationState {
  actionType: 'activate' | 'deactivate' | 'approve_join' | 'reject_join' | 'delete'
  targetInfo: { name: string; phone?: string }
  confirmedAt: string | null
  createdAt: string // ISO timestamp
}
```

**Expiration**: After 5 minutes, user sees `confirmation-timeout` message.

---

## Relationships

```
User (1) ──────── (*) JoinRequest
User (1) ──────── (*) AdminScope (createdBy)
User (*) ──────── (1) AdminScope (userId)

Section (*) ──────── (1) AdminScope
Section (*) ──────── (1) User (via scopes)

AuditLog (N) ─────── (1) User (userId)
```

**Scope Inheritance**:
- Section scope -> All descendant sub-sections
- Module scope -> Specific module only
- SUPER_ADMIN -> Bypasses all scope checks

---

## No Database Migrations Required

This feature introduces **no schema changes**. All functionality is implemented:
1. At the handler level (`showUserProfile`, confirmation dialogs)
2. At the service level (PII masking in `audit-logs.ts`)
3. At the utility level (text truncation helper)

Existing entities are used with enhanced display capabilities only.
