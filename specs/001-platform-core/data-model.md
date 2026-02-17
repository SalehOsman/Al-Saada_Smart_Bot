# Data Model: Platform Core (Layer 1)

**Date**: 2026-02-17
**Feature**: Platform Core (Layer 1)
**Branch**: `001-platform-core`

## Database Overview

This document defines the complete database schema for Platform Core (Layer 1) of Al-Saada Smart Bot. The schema supports user management, RBAC, section administration, audit logging, and notification systems.

## Core Tables

### User - Telegram Bot Users
Stores all bot users with their profile and role information.

```prisma
model User {
  telegramId    BigInt   @id @unique @map("telegram_id")
  firstName     String   @map("first_name")
  lastName      String?  @map("last_name")
  phone         String?  // Egyptian phone format: 01[0125][0-9]{8}
  role          Role     @default(VISITOR)
  isActive      Boolean  @default(true) @map("is_active")
  language      String   @default("ar") // ISO 639-1
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relationships
  joinRequests  JoinRequest[]
  auditLogs    AuditLog[]
  notifications Notification[]
  adminScopes  AdminScope[]
  createdSections Section[] @relation("SectionCreator")
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
  id           String    @id @default(nanoid())
  userId       BigInt    @map("user_id")
  name         String
  phone        String    // Egyptian phone format validation
  message      String?
  status       Status    @default(PENDING)
  reviewedBy   BigInt?   @map("reviewed_by")
  reviewedAt   DateTime?  @map("reviewed_at")
  createdAt    DateTime  @default(now()) @map("created_at")

  // Relationships
  user         User      @relation(fields: [userId], references: [telegramId])
  reviewer     User?     @relation("ReviewAdmin", fields: [reviewedBy], references: [telegramId])

  @@map("join_requests")
}

enum Status {
  PENDING
  APPROVED
  REJECTED
}
```

### Section - Dynamic Departments/Containers
Dynamic sections that organize modules in the bot interface.

```prisma
model Section {
  id          String    @id @default(nanoid())
  name        String    // Arabic name
  nameEn      String    // English name
  icon        String    // Emoji (e.g., "📁", "💼")
  isActive    Boolean   @default(true) @map("is_active")
  orderIndex  Int       @default(0) @map("order_index")
  createdAt   DateTime  @default(now()) @map("created_at")
  updatedAt   DateTime  @updatedAt @map("updated_at")
  createdBy   BigInt?   @map("created_by")

  // Relationships
  creator     User?     @relation("SectionCreator", fields: [createdBy], references: [telegramId])
  modules     Module[]
  adminScopes AdminScope[] @relation("SectionScope")

  @@map("sections")
}
```

### Module - Discovered Module Configurations
Modules discovered at runtime with their configuration metadata.

```prisma
model Module {
  id          String    @id @default(nanoid())
  name        String    // Module name in Arabic
  nameEn      String    // Module name in English
  sectionId   String    @map("section_id")
  icon        String    // Menu icon emoji
  isActive    Boolean   @default(true) @map("is_active")
  orderIndex  Int       @default(0) @map("order_index")
  configPath  String    @map("config_path") // Relative path to module.config.ts
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relationships
  section     Section   @relation(fields: [sectionId], references: [id])
  adminScopes AdminScope[] @relation("ModuleScope")

  @@map("modules")
}
```

### AuditLog - System Audit Trail
Comprehensive logging of all significant system actions.

```prisma
model AuditLog {
  id          String    @id @default(nanoid())
  userId      BigInt    @map("user_id")
  action      String    // Action type (e.g., "LOGIN", "SECTION_CREATE", "USER_APPROVE")
  targetType  String?   @map("target_type") // Entity type (User, Section, Module, etc.)
  targetId    String?   @map("target_id")   // Entity ID
  details     Json?     // Additional context as JSON
  createdAt   DateTime  @default(now()) @map("created_at")

  // Relationships
  user        User      @relation(fields: [userId], references: [telegramId])

  @@map("audit_logs")
}
```

### Notification - Queue Notifications
Queue-based notification system with read tracking.

```prisma
model Notification {
  id        String            @id @default(nanoid())
  userId    BigInt            @map("user_id")
  type      NotificationType
  title     String
  message   String
  isRead    Boolean           @default(false) @map("is_read")
  createdAt DateTime          @default(now()) @map("created_at")

  // Relationships
  user      User              @relation(fields: [userId], references: [telegramId])

  @@map("notifications")
}

enum NotificationType {
  SYSTEM
  JOIN_REQUEST
  APPROVAL
  REJECTION
  ANNOUNCEMENT
}
```

### AdminScope - Admin Permissions
Fine-grained permission system for admin users.

```prisma
model AdminScope {
  id         String           @id @default(nanoid())
  adminUserId BigInt           @map("admin_user_id")
  scopeType  ScopeType
  scopeId    String           @map("scope_id")
  createdAt  DateTime         @default(now()) @map("created_at")

  // Relationships
  adminUser  User             @relation(fields: [adminUserId], references: [telegramId])
  section    Section?         @relation("SectionScope", fields: [scopeId], references: [id])
  module     Module?          @relation("ModuleScope", fields: [scopeId], references: [id])

  @@unique([adminUserId, scopeType, scopeId])
  @@map("admin_scopes")
}

enum ScopeType {
  SECTION
  MODULE
}
```

## Database Indexes

```prisma
// User indexes
model User {
  @@index([telegramId])
  @@index([role])
  @@index([isActive])
}

// JoinRequest indexes
model JoinRequest {
  @@index([userId])
  @@index([status])
  @@index([createdAt])
}

// Section indexes
model Section {
  @@index([isActive])
  @@index([orderIndex])
}

// Module indexes
model Module {
  @@index([sectionId])
  @@index([isActive])
  @@index([orderIndex])
}

// AuditLog indexes
model AuditLog {
  @@index([userId])
  @@index([action])
  @@index([createdAt])
}

// Notification indexes
model Notification {
  @@index([userId])
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
}

// AdminScope indexes
model AdminScope {
  @@index([adminUserId])
  @@index([scopeType, scopeId])
}
```

## Data Validation Rules

### Phone Number Validation
```typescript
// Egyptian mobile numbers only
const egyptianPhoneRegex = /^01[0125][0-9]{8}$/;
```

### Name Validation
```typescript
// Unicode-aware string validation (supports Arabic)
const nameRegex = /^[\p{L}\s\u0621-\u064A\u0660-\u0669]+$/u;
```

### Telegram ID Validation
```typescript
// Must be valid Telegram user ID
const telegramId = telegramId; // BigInt from Telegram
```

## Enum Definitions

### Role Enum
```typescript
enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN'
  ADMIN = 'ADMIN'
  EMPLOYEE = 'EMPLOYEE'
  VISITOR = 'VISITOR'
}
```

### Status Enum
```typescript
enum Status {
  PENDING = 'PENDING'
  APPROVED = 'APPROVED'
  REJECTED = 'REJECTED'
}
```

### NotificationType Enum
```typescript
enum NotificationType {
  SYSTEM = 'SYSTEM'
  JOIN_REQUEST = 'JOIN_REQUEST'
  APPROVAL = 'APPROVAL'
  REJECTION = 'REJECTION'
  ANNOUNCEMENT = 'ANNOUNCEMENT'
}
```

### ScopeType Enum
```typescript
enum ScopeType {
  SECTION = 'SECTION'
  MODULE = 'MODULE'
}
```

## Business Logic Constraints

### 1. User Role Transitions
```
VISITOR → EMPLOYEE (via admin approval)
EMPLOYEE → ADMIN (via Super Admin assignment)
ADMIN → SUPER_ADMIN (via Super Admin promotion)
Any role → INACTIVE (via admin action)
```

### 2. Section Management Rules
- Sections can only be deleted if they have no modules
- Section order must be unique and sequential
- Section names must be unique (Arabic and English)

### 3. Module Discovery Rules
- Modules must be in modules/ directory at project root
- Each module must have module.config.ts file
- Invalid module configs are logged but don't crash the bot
- Modules are automatically assigned to sections via config

### 4. Audit Log Requirements
- All user actions are logged except read-only operations
- Sensitive data (passwords, tokens) is never logged
- Audit logs cannot be deleted or modified
- Audit logs are retained indefinitely

### 5. Session Management
- Sessions expire after 24 hours of inactivity
- Session keys follow pattern: session:{telegramId}
- Session data includes navigation state for bot continuity

## Migration Strategy

### Initial Migration (001_initial)
- Create all tables with indexes
- Insert default data (empty tables ready for use)
- Set up foreign key constraints

### Future Migrations
- Add new tables for Phase 2+ features
- Modify existing tables as requirements evolve
- Maintain backward compatibility where possible

## Performance Considerations

1. **Indexing**: Critical tables have appropriate indexes for query performance
2. **JSONB Storage**: Audit log details use JSONB for flexible querying
3. **Connection Pooling**: Prisma manages database connections efficiently
4. **Session Caching**: Redis sessions reduce database load
5. **Query Optimization**: All queries designed for minimal execution time

## Security Considerations

1. **Data Sanitization**: User inputs validated before storage
2. **Sensitive Data**: Passwords and tokens never stored or logged
3. **Access Control**: RBAC enforced at database level via application logic
4. **Audit Trail**: All modifications tracked for accountability
5. **Session Security**: Redis sessions with secure configuration