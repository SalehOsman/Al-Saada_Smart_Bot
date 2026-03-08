# Data Model: Platform Core (Layer 1)

**Date**: 2026-02-17 | **Updated**: 2026-03-08
**Feature**: Platform Core (Layer 1)
**Branch**: `001-platform-core`
**Source of Truth**: `prisma/schema/platform.prisma` + `prisma/schema/main.prisma`

## Database Overview

This document defines the complete database schema for Platform Core (Layer 1) of Al-Saada Smart Bot. The schema supports user management, RBAC, two-level section hierarchy, audit logging, and notification systems.

> [!IMPORTANT]
> If this document conflicts with `prisma/schema/*.prisma`, the Prisma files take precedence.

## Core Tables

### User - Telegram Bot Users
Stores all bot users with their profile and role information.

```prisma
model User {
  telegramId       BigInt    @id @map("telegram_id")
  id               String    @unique @default(cuid())
  fullName         String    @map("full_name")
  nickname         String?
  phone            String?   @unique
  nationalId       String?   @unique @map("national_id")
  telegramUsername  String?   @map("telegram_username")
  role             Role      @default(VISITOR)
  isActive         Boolean   @default(true) @map("is_active")
  language         String    @default("ar")
  lastActiveAt     DateTime? @map("last_active_at")
  createdAt        DateTime  @default(now()) @map("created_at")
  updatedAt        DateTime  @updatedAt @map("updated_at")

  // Relationships
  joinRequests         JoinRequest[]
  auditLogs            AuditLog[]
  notifications        Notification[]
  adminScopes          AdminScope[] @relation("AdminScopeUser")
  createdAdminScopes   AdminScope[] @relation("AdminScopeCreator")
  createdSections      Section[]    @relation("SectionCreator")
  reviewedJoinRequests JoinRequest[] @relation("ReviewAdmin")

  @@map("users")
}

enum Role {
  SUPER_ADMIN
  ADMIN
  EMPLOYEE
  VISITOR
}
```

### JoinRequest - Pending User Registrations
Manages user registration requests and approval workflow.

```prisma
model JoinRequest {
  id         String    @id @default(cuid())
  telegramId BigInt    @map("telegram_id")
  fullName   String    @map("full_name")
  nickname   String?
  phone      String
  nationalId String    @map("national_id")
  status     Status    @default(PENDING)
  reviewedBy BigInt?   @map("reviewed_by")
  reviewedAt DateTime? @map("reviewed_at")
  createdAt  DateTime  @default(now()) @map("created_at")

  // Relationships
  user     User? @relation(fields: [telegramId], references: [telegramId])
  reviewer User? @relation("ReviewAdmin", fields: [reviewedBy], references: [telegramId])

  @@map("join_requests")
}

enum Status {
  PENDING
  APPROVED
  REJECTED
}
```

### Section - Dynamic Departments/Containers (Two-Level Hierarchy)
Dynamic sections that organize modules in the bot interface. Supports main sections and sub-sections via self-referential `parentId`.

```prisma
model Section {
  id         String   @id @default(cuid())
  slug       String   @unique
  name       String   // Arabic name
  nameEn     String   // English name
  icon       String   // Emoji (e.g., "📁", "💼")
  parentId   String?  @map("parent_id") // Self-referential FK — nullable for main sections
  isActive   Boolean  @default(true) @map("is_active")
  orderIndex Int      @default(0) @map("order_index")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  createdBy  BigInt?  @map("created_by")

  // Relationships
  creator     User?      @relation("SectionCreator", fields: [createdBy], references: [telegramId])
  parent      Section?   @relation("SectionHierarchy", fields: [parentId], references: [id])
  children    Section[]  @relation("SectionHierarchy")
  modules     Module[]
  adminScopes AdminScope[]

  @@index([isActive])
  @@index([orderIndex])
  @@index([parentId])
  @@map("sections")
}
```

**Hierarchy Constraint**: Maximum 2 levels — if `parentId` is set, the referenced section MUST have `parentId = NULL`. Enforced in application code.

### Module - Discovered Module Configurations
Modules discovered at runtime with their configuration metadata.

```prisma
model Module {
  id         String   @id @default(cuid())
  slug       String   @unique
  name       String   // Module name in Arabic
  nameEn     String   // Module name in English
  sectionId  String   @map("section_id")
  icon       String   // Menu icon emoji
  isActive   Boolean  @default(true) @map("is_active")
  orderIndex Int      @default(0) @map("order_index")
  configPath String   @map("config_path")
  createdAt  DateTime @default(now()) @map("created_at")

  // Relationships
  section     Section      @relation(fields: [sectionId], references: [id])
  adminScopes AdminScope[]

  @@index([sectionId])
  @@index([isActive])
  @@index([orderIndex])
  @@map("modules")
}
```

### AuditLog - System Audit Trail
Comprehensive logging of all significant system actions.

```prisma
model AuditLog {
  id         String      @id @default(cuid())
  userId     BigInt      @map("user_id")
  action     AuditAction // Typed enum — see AuditAction below
  targetType String?     @map("target_type")
  targetId   String?     @map("target_id")
  details    Json?
  createdAt  DateTime    @default(now()) @map("created_at")

  // Relationships
  user User @relation(fields: [userId], references: [telegramId])

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

### Notification - Queue Notifications (i18n-compliant)
Queue-based notification system. Uses `type` + `params` (JSONB) pattern — no hardcoded title/body fields. The notification type maps to `.ftl` i18n key patterns.

```prisma
model Notification {
  id           String           @id @default(cuid())
  targetUserId BigInt           @map("target_user_id")
  type         NotificationType
  params       Json?            // i18n template parameters (e.g., { userName, requestCode })
  isRead       Boolean          @default(false) @map("is_read")
  createdAt    DateTime         @default(now()) @map("created_at")

  // Relationships
  user User @relation(fields: [targetUserId], references: [telegramId])

  @@index([targetUserId])
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

### AdminScope - Admin Permissions (Section/Module Scoping)
Fine-grained permission system for admin users. Supports both section-level and module-level scoping with RBAC inheritance (FR-037).

```prisma
model AdminScope {
  id        String   @id @default(cuid())
  userId    BigInt   @map("user_id")
  sectionId String   @map("section_id")
  moduleId  String?  @map("module_id") // nullable — null = entire section access
  createdAt DateTime @default(now()) @map("created_at")
  createdBy BigInt   @map("created_by")

  // Relationships
  user    User    @relation("AdminScopeUser", fields: [userId], references: [telegramId])
  section Section @relation(fields: [sectionId], references: [id], onDelete: Cascade)
  module  Module? @relation(fields: [moduleId], references: [id])
  creator User    @relation("AdminScopeCreator", fields: [createdBy], references: [telegramId])

  @@unique([userId, sectionId, moduleId])
  @@index([userId])
  @@index([sectionId])
  @@map("admin_scopes")
}
```

**Scope Inheritance**: AdminScope on a main section grants access to ALL its sub-sections and their modules. AdminScope on a sub-section grants access to that sub-section's modules ONLY. `onDelete: Cascade` ensures scopes are removed when sections are deleted (FR-037).

## Enum Definitions

### Role
```prisma
enum Role {
  SUPER_ADMIN
  ADMIN
  EMPLOYEE
  VISITOR
}
```

### Status
```prisma
enum Status {
  PENDING
  APPROVED
  REJECTED
}
```

### NotificationType (7 types)
```prisma
enum NotificationType {
  JOIN_REQUEST_NEW
  JOIN_REQUEST_APPROVED
  JOIN_REQUEST_REJECTED
  USER_DEACTIVATED
  MAINTENANCE_ON
  MAINTENANCE_OFF
  MODULE_OPERATION      // Added by 003-module-kit
}
```

### AuditAction (28 total)
25 actions from 001-platform-core + 3 from 003-module-kit.

```prisma
enum AuditAction {
  // --- 001-platform-core (25 actions) ---
  USER_BOOTSTRAP
  USER_LOGIN
  USER_LOGOUT
  ROLE_CHANGE
  USER_APPROVE
  USER_REJECT
  USER_ACTIVATE
  USER_DEACTIVATE
  JOIN_REQUEST_SUBMIT
  SECTION_CREATE
  SECTION_UPDATE
  SECTION_DELETE
  SECTION_ENABLE
  SECTION_DISABLE
  MODULE_REGISTER
  MODULE_UNREGISTER
  MODULE_ENABLE
  MODULE_DISABLE
  MAINTENANCE_ON
  MAINTENANCE_OFF
  PERMISSION_CHANGE
  ADMIN_SCOPE_ASSIGN
  ADMIN_SCOPE_REVOKE
  BACKUP_TRIGGER
  BACKUP_RESTORE
  // --- 003-module-kit (3 actions) ---
  MODULE_CREATE
  MODULE_UPDATE
  MODULE_DELETE
}
```

## Data Validation Rules

### Phone Number Validation (Egyptian)
```typescript
// Operators: 010 Vodafone, 011 Etisalat, 012 Orange, 015 WE
const egyptianPhoneRegex = /^(010|011|012|015)\d{8}$/;
```

### National ID Validation (Egyptian, 14 digits)
Extracts: Century (digit 1), Birthdate (digits 2-7), Gender (digit 9: odd=MALE, even=FEMALE).

### Section Name Validation
2–50 characters. Icon must be exactly one Unicode emoji (`/^\p{Emoji}$/u`).

### Slug Validation
```typescript
const slugRegex = /^[a-z0-9-]+$/; // Lowercase, alphanumeric, dashes. Max 64 chars.
```

## Business Logic Constraints

### 1. User Role Transitions
```
VISITOR → EMPLOYEE (via admin approval)
EMPLOYEE → ADMIN (via Super Admin assignment)
ADMIN → SUPER_ADMIN (via Super Admin promotion)
Any role → INACTIVE (via admin deactivation — isActive=false)
```

### 2. Section Hierarchy Rules
- Maximum 2 levels: main section → sub-section (no 3rd level)
- Sections can only be deleted if they have ZERO active modules
- Deleting a main section cascades to delete all sub-sections (blocked if any has active modules)
- AdminScope on main section inherits to all descendant sub-sections (FR-037)

### 3. Module Discovery Rules
- Modules reside in `modules/` directory at project root
- Each module must have `module.config.ts` file
- Invalid module configs are logged but don't crash the bot
- Modules are assigned to sections via `sectionId`

### 4. Audit Log Requirements
- All 25 platform-core actions logged (+ 3 module-kit actions)
- Sensitive data (nationalId, phone, passwords, tokens) NEVER logged — replaced with `[REDACTED]`
- Audit logs are immutable and retained indefinitely

### 5. Session Management
- Sessions expire after 24 hours of inactivity (Redis TTL)
- Session keys: `session:{telegramId}`
- Session data: `role`, `currentMenu` (breadcrumb array), `telegramId`, `locale`

### 6. Notification Retention
- Notifications older than 90 days are automatically purged (daily cron at 02:00 AM Africa/Cairo)