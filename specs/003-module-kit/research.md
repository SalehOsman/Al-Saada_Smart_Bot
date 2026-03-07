# Research: 003-module-kit (Layer 2 Module Kit)

This document consolidates technical decisions and research findings for the implementation of the Module Kit.

## 1. Prisma Multi-File Schema (GA in 6.7.0)

**Decision**: Use the `prismaSchemaFolder` structure for modular database isolation.

**Rationale**:
- Each module can maintain its own `.prisma` file, reducing merge conflicts and improving maintainability.
- Prisma 6.7.0 (GA) automatically merges all files in the designated folder without explicit imports.

**Implementation Details**:
- **Main Schema**: `prisma/schema/main.prisma` contains `datasource` and `generator` blocks.
- **Module Schemas**: `prisma/schema/modules/{slug}.prisma`.
- **Configuration**: Set `"prisma": { "schema": "prisma/schema" }` in `package.json`.
- **Scaffolding**: The CLI tool will copy the module's schema snippet to the `prisma/schema/modules/` directory and run `npx prisma generate`.

**Alternatives Considered**:
- **Manual Merging**: Rejected as error-prone and violates the "Config-First" principle.
- **Single Large File**: Rejected due to scalability and developer experience issues.

## 2. grammY Conversations & Redis Persistence

**Decision**: Store conversation state in the existing Redis-backed session storage.

**Rationale**:
- `@grammyjs/conversations` natively stores state in `ctx.session.conversation`.
- Layer 1 already has a robust Redis session implementation with 24h TTL.

**Implementation Details**:
- **Draft Middleware**: Wrap the entry points of modules with a middleware that manages the "resume draft" prompt.
- **Sliding TTL**: The `sessionMiddleware` already resets the TTL on every interaction. No extra logic needed for "sliding" behavior beyond ensuring interactions continue to update the session.
- **Configurable TTL**: Add `draftTtlHours` to the module configuration. If present, the `save()` helper or middleware can manually set a different Redis TTL for that specific draft key (e.g., `draft:{userId}:{moduleSlug}`).

**Alternatives Considered**:
- **Database-backed Drafts**: Rejected as Redis is faster and already configured for session-like temporary data.

## 3. Dynamic Module Discovery

**Decision**: Use filesystem scanning (`fs.readdirSync`) and dynamic `import()` at startup.

**Rationale**:
- Aligns with the "Never Hardcoded" principle of the Constitution.
- Allows modules to be added/removed just by managing files in the `modules/` folder.

**Implementation Details**:
- **Scanner**: `ModuleLoader` scans `modules/*/config.ts`.
- **Registration**: Validate each `config.ts` exports a valid `ModuleDefinition` (slug, permissions, icon, etc.).
- **Error Handling**: Wrap `import()` in try-catch. If a module fails, log the error and notify all `SUPER_ADMIN`s via the existing notification service.

## 4. Automatic Notifications & Audit Logs

**Decision**: Implement a `save()` helper that encapsulates transaction-based persistence, auditing, and multi-user notifications.

**Implementation Details**:
- **Audit**: Use the existing `auditService.log()`.
- **Notifications**:
    - Query `adminScopeService` (new method needed: `getAdminsForModule(moduleId)`) to find all admins with access to the module.
    - Fetch all `SUPER_ADMIN`s from the `User` table.
    - Dispatch notifications via `notificationService`.
- **Concurrency**: Use Last-Write-Wins (LWW). Simple `prisma.upsert()` or `prisma.update()` is sufficient for the organization's scale (~200 users).

## 5. i18n-Only User Text (Principle VII)

**Decision**: Strict enforcement of `.ftl` files for all module-specific text.

**Rationale**:
- Avoids encoding issues and maintains clean source code.
- Required by the Constitution.

**Implementation Details**:
- Scaffolding will create `modules/{slug}/locales/ar.ftl` and `en.ftl`.
- `ModuleLoader` will register these locales with the global i18n instance.
- Developers must use `ctx.t('{slug}.message_key')`.

---
**Status**: All research tasks complete. Ready for Phase 1 Design.
