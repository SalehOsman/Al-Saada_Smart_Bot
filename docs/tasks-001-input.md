Generate the task breakdown for Feature 001 (Platform Core) based on the spec, plan, and data-model in specs/001-platform-core/.

Follow these guidelines strictly:

## Task Sizing
- Each task should be completable in 1-4 hours maximum
- Each task should result in exactly ONE commit
- If a task is too large, split it into sub-tasks
- Each task must have a clear "done" criteria

## Task Organization
Tasks should follow this exact execution order (dependencies are critical):

### Group 1: Project Scaffolding (must be first — everything depends on this)
- Initialize monorepo structure (root package.json, tsconfig, eslint, etc.)
- Create packages/core/ with its own package.json and tsconfig
- Create Docker Compose (PostgreSQL 16 + Redis 7)
- Create .env.example with Zod validation schema
- Setup Prisma with initial schema (all 7 tables from data-model.md)
- Run first migration
- Setup Pino logger
- Setup Vitest configuration

### Group 2: Bot Foundation (depends on Group 1)
- Initialize grammY bot with Hono webhook server
- Create Redis connection (ioredis singleton)
- Create Prisma client singleton
- Create grammY session storage adapter using Redis
- Create error handling middleware (catches errors, sends Arabic message)
- Create i18n setup with Arabic .ftl files (basic messages: welcome, error, loading, etc.)

### Group 3: User & Auth System (depends on Group 2)
- Create /start command handler with user lookup logic
- Implement first-user-becomes-Super-Admin bootstrap
- Create join request conversation flow (name + phone input with Egyptian validation)
- Save join request to database with PENDING status
- Create notification to admins about new join request
- Create "pending approval" response for returning visitors
- Create role-based menu dispatcher (shows different menu per role)

### Group 4: RBAC System (depends on Group 3)
- Create RBAC middleware (checks role on every update)
- Implement canAccess(userId, sectionId?, moduleId?) function
- Create AdminScope service (assign/revoke admin permissions)
- Create user management handlers (Super Admin: list users, change role, activate/deactivate)
- Create join request approval/rejection flow (Admin/Super Admin)
- Unit tests for RBAC middleware and canAccess function

### Group 5: Section Management (depends on Group 4)
- Create section CRUD service (create, read, update, delete, reorder)
- Create section management handlers for Super Admin
- Create section menu display (list active sections as buttons)
- Create "empty section" message when no modules exist
- Create section enable/disable toggle
- Integration tests for section CRUD

### Group 6: Module Loader (depends on Group 5)
- Create ModuleConfig TypeScript type/interface
- Create module discovery service (scans modules/ directory)
- Create module registry (Map<string, ModuleConfig>)
- Create module validation (skip invalid configs with warning log)
- Create registerModule() and getModulesBySection() API
- Create module list display within sections
- Unit tests for module loader

### Group 7: Maintenance Mode (depends on Group 2)
- Create maintenance mode middleware (checks Redis flag)
- Create maintenance toggle command (Super Admin only)
- Create Arabic maintenance message for blocked users
- Store maintenance status in Redis
- Unit test for maintenance middleware

### Group 8: Notification System (depends on Group 2)
- Setup BullMQ with Redis connection
- Create notification service (queue-based message sending)
- Create notification types enum (SYSTEM, JOIN_REQUEST, APPROVAL, REJECTION, ANNOUNCEMENT)
- Create notification history storage in database
- Create notification delivery worker
- Integration test for notification flow

### Group 9: Audit Logging (depends on Group 2)
- Create audit log service
- Create audit middleware (auto-logs significant actions)
- Define auditable actions list (login, role_change, section_create, etc.)
- Create audit log viewer for Super Admin (recent logs via bot command)
- Ensure NO sensitive data is logged
- Unit tests for audit service

### Group 10: Session Management (depends on Group 2)
- Create Redis session service with 24-hour TTL
- Create session middleware (load/save on every message)
- Store navigation state (currentSection, currentModule, currentStep)
- Handle session expiry gracefully
- Unit tests for session service

### Group 11: Integration & Polish (depends on all above)
- End-to-end test: complete user journey (new user → join request → approval → employee menu)
- End-to-end test: Super Admin journey (bootstrap → create section → manage users)
- Verify 80% code coverage
- Code cleanup and final linting
- Update quickstart.md with actual commands
- Final commit and tag v0.1.0

## Important Notes for Task Generation
- Mark parallel tasks with [P] — tasks in Groups 7, 8, 9, 10 can run in parallel
- Every task must include the exact file path where code should be created/modified
- Every task must have a "Done when:" criteria
- Do NOT include any Flow Block or module creation tasks — those are Feature 002 and 003
- The modules/ directory should be created but left EMPTY
- All user-facing messages must be in Arabic
- All error messages must be user-friendly Arabic (never show raw errors)
