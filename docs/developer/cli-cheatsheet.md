# Developer CLI Cheatsheet

**Last Updated:** 2026-03-03

This document is a comprehensive CLI reference for developers working on the Al-Saada Smart Bot. It covers the daily workflow, NPM scripts, Docker, Prisma, Redis, and troubleshooting commands.

---

## 1. Daily Workflow

What you need to run every day to develop and test the bot locally:

**Start of Day:**
```bash
npm run docker:up      # Start PostgreSQL and Redis containers
npm run db:generate    # Always ensure Prisma targets match your local schema
npm run dev            # Start the bot with hot-reloading
```

**After Pulling Changes (git pull):**
```bash
npm install            # Install any new dependencies
npm run db:migrate     # Apply any new database schema changes
npm run db:generate    # Regenerate Prisma Client
```

**Before Committing:**
```bash
npm run typecheck      # Ensure TypeScript compiles without errors
npm run lint           # Run ESLint (or npm run lint:fix)
npm test               # Ensure Vitest suites pass
```

**End of Day:**
```bash
npm run docker:down    # Stop and clean up containers preserving volumes
```

---

## 2. NPM Scripts Reference

All scripts defined in `package.json`. Run them prefixed with `npm run`.

| Command | Internal Execution | Purpose |
|---------|-------------------|---------|
| `docs:api` | `typedoc` | Generates static HTML reference docs from code comments into `docs/api`. |
| `docs:api:watch` | `typedoc --watch` | Actively regenerates TypeDoc HTML when TypeScript files change. |
| `dev` | `tsx --env-file=.env packages/core/src/main.ts` | **Primary development command**. Runs the bot using `tsx`, loading `.env` variables automatically. |
| `dev:watch` | `tsx watch packages/core/src/main.ts` | Runs the bot and restarts automatically on file changes (`watch` mode). |
| `build` | `tsup packages/core/src/main.ts --format esm --dts` | Builds the production bundle emitting ES modules and TypeScript definitions to `dist/`. |
| `test` | `vitest` | Runs the Vitest test suite once. |
| `test:coverage` | `vitest run --coverage` | Runs the test suite and generates a test coverage report. |
| `test:watch` | `vitest --watch` | Runs Vitest in watch mode, rerunning relevant tests on save. |
| `lint` | `eslint .` | Runs ESLint analysis across the repository. |
| `lint:fix` | `eslint . --fix` | Runs ESLint and automatically fixes formatting/syntax where possible. |
| `typecheck` | `tsc --noEmit` | Validates TypeScript strict typing without producing compiled JavaScript files. |
| `db:migrate` | `prisma migrate dev` | Applies pending migrations to the local PostgreSQL database. |
| `db:generate` | `prisma generate` | Generates the Prisma Client based on all schemas in `prisma/schema/`. |
| `db:studio` | `prisma studio` | Opens the Prisma visual database browser on port 5555. |
| `docker:up` | `docker-compose up -d` | Starts PostgreSQL on port 5434 and Redis on port 6379 in detached mode. |
| `docker:down` | `docker-compose down` | Stops the running Docker containers. |
| `module:create` | `tsx scripts/module-create.ts` | Interactive scaffolding generator for creating new Layer 2 bot modules. |
| `module:remove` | `tsx scripts/module-remove.ts` | Safely removes and unregisters an existing module and its Prisma models. |
| `module:list` | `tsx scripts/module-list.ts` | Lists all detected and registered modules. |

---

## 3. Docker Commands

Beyond the helper npm scripts, you may need these direct Compose/Docker commands.

- `docker-compose up -d`: Start background infrastructure containers.
- `docker-compose down`: Stop containers without destroying data volumes.
- `docker-compose restart`: Quickly restart the containers.
- `docker-compose logs -f al-saada-postgres`: View live scrolling database logs.
- `docker-compose logs -f al-saada-redis`: View live scrolling Redis logs.
- `docker exec -it al-saada-postgres psql -U al_saada_user -d al_saada_bot`: Access the raw database via the `psql` interactive prompt.
- `docker exec -it al-saada-redis redis-cli`: Open the interactive `redis-cli` prompt.
- `docker-compose down -v`: **DESTRUCTIVE**. Stops containers and forcefully deletes named volumes, resetting your DB/Redis.
- `docker-compose build --no-cache`: Force a complete clean rebuild of the Docker images ignoring the local build cache.

---

## 4. Prisma Commands

The project uses Prisma ORM with the `prismaSchemaFolder` preview feature enabled, merging all files within `prisma/schema/*` logically.

- `npx prisma generate`: Rebuilds the TypeScript client (`@prisma/client`). Required after ANY schema file change.
- `npx prisma migrate dev`: Creates and applies a database migration file interactively determining changes.
- `npx prisma migrate dev --name <name>`: Create a migration applying the specified human-readable name directly.
- `npx prisma migrate reset`: **DESTRUCTIVE**. Drops the local database, recreates it, runs all migrations, and triggers seeding.
- `npx prisma db push`: Pushes the current schema layout to the database *without* generating a migration file (Prototyping/Dev only).
- `npx prisma studio`: Spawns a web GUI allowing CRUD operations on actual database data.
- `npx prisma format`: Auto-formats and aligns spacing in all `.prisma` files.
- `npx prisma validate`: Syntax-checks the schema folder logic and ensures relation consistency.

---

## 5. Redis Commands

Redis is used for temporary conversational drafts, session data, and caching.

Run these inside `redis-cli` (`docker exec -it al-saada-redis redis-cli`):

- `KEYS "draft:*"`: Lists all active conversational drafts matching the system pattern.
- `GET "draft:{userId}:{moduleSlug}"`: Inspects the JSON payload of a specific user's module draft.
- `DEL "draft:{userId}:{moduleSlug}"`: Manually deletes a stuck or corrupt draft forcing a fresh start.
- `KEYS "session:*"`: Lists all general grammY session contexts.
- `FLUSHDB`: **DESTRUCTIVE**. Wipes the active Redis database completely, terminating all user sessions/drafts.
- `TTL "draft:{userId}:{moduleSlug}"`: Checks the remaining 'Time To Live' (seconds) before a draft expires automatically.

---

## 6. Module Development Commands

Complete workflow for building a new conversational interface via Layer 2 Module Kit.

1. **Scaffold:** Run `npm run module:create`. The tool will prompt you for the module Name, Summary, and internal Slug.
2. **Review:** Check `npm run module:list` to verify the module was registered logically.
3. **Database Changes:** The scaffold creates a `[slug].prisma` file. If you added DB fields, run:
   - `npm run db:generate`
   - `npm run db:migrate`
4. **Test:** Run `npm run dev` to see the module within the `/menu` keyboard inside the bot.
5. **Delete:** Run `npm run module:remove` to completely excise a module you no longer need.

---

## 7. Testing Commands

The project enforces rigid verification via Vitest. Ensure you have zero test defects.

- `npm test`: Quickly runs the complete test suite.
- `npm run test:watch`: Runs tests interactively, retaining the prompt and watching file changes.
- `npm run test:coverage`: Runs the suite and evaluates code coverage metrics generating an HTML report.
- `npx vitest run packages/module-kit`: Runs tests explicitly scoped to an individual workspace package.
- `npx vitest run --reporter=verbose`: Outputs detailed step-by-step logs for individual tests rather than a compacted summary.

---

## 8. Code Quality Commands

Maintain strictness to adhere to constitutional principles.

- `npm run typecheck`: Runs the Type Checker. This *must* pass before commits.
- `npm run lint`: Verifies adherence to `@antfu/eslint-config`.
- `npm run lint:fix`: Rectifies superficial linting violations (spacing, string formats).
- `npm run docs:api`: Uses TypeDoc to compile inline `.ts` JSDoc comments into traversable static HTML documentation.
- `npm run docs:api:watch`: Runs TypeDoc in persistent watching mode mirroring files as you document them.

---

## 9. Git Conventions

We enforce [Conventional Commits](https://www.conventionalcommits.org/).

**Format:** `type(scope): message`

**Types:**
- `feat`: A new feature
- `fix`: A bug fix
- `chore`: Tooling, configs, or maintenance tasks (no production code change)
- `docs`: Documentation modifications only
- `refactor`: Changing logic without changing functional behavior
- `test`: Adding missing tests or refactoring existing ones

**Scopes (Optional but recommended):**
- `module-kit`: Layer 2 draft validation framework
- `core`: Platform Layer 1 (services, Prisma, session)
- `validators`: Zod logic implementations
- `ai-assistant`: Architecture pertaining to Vector/LLM systems
- `spec`: Changes related to Speckit definition documents

**Examples:**
- `feat(core): implement robust logging interceptor`
- `fix(module-kit): prevent draft overwrite race conditions`
- `docs(spec): clarify FR-014 bootstrap lock implementation`

---

## 10. SpecKit Workflow

SpecKit is the required sequence to ship *any* feature inside the project adhering to SDD (Spec-Driven Development) standards.

- **Step 1:** `/speckit.specify` — Write the functional "What & Why" requirements spec.
- **Step 2:** `/speckit.clarify` — (Optional) Discuss edge-cases and encode Q&A into the spec.
- **Step 3:** `/speckit.plan` — Write the Technical "How" execution, outlining PRISMA, REST, and Logic choices.
- **Step 4:** `/speckit.tasks` — Convert plan into highly granular checkbox action steps.
- **Step 5:** `/speckit.analyze` — Validates cross-artifact consistency. **MUST** produce 0 critical/high issues.
- **Step 6:** `/speckit.implement` — Authorized execution of tasks inside actual source code.
- **Step 7:** `/speckit.analyze` — Post-implementation final gate verification.

*See `docs/project/speckit-reference.md` for extended documentation on avoiding structural violations during requirement gathering.*

---

## 11. Troubleshooting Quick Fixes

Common local development ailments and fast resolutions:

- **Port 5434/3000/6379 already in use**:
  Kill the offending process holding the port, or execute `docker-compose down` if a ghost container is hoarding it. Alternatively, manipulate local `.env` values (e.g. `PORT=3001`).
- **Prisma Client outdated or mapping errors**:
  You or a coworker migrated a schema but didn't refresh your local bindings. Run `npm run db:generate`.
- **Redis connection refused (ECONNREFUSED)**:
  Docker Redis container crashed or wasn't loaded. Run `npm run docker:up`.
- **Bot "Already running" on GramMY initialization**:
  You have multiple Node `dev` instances running concurrently fighting for polling rights to the Telegram API. Kill orphaned node processes.
- **Module not loading / failing to show in Menu**:
  Check `npm run module:list`. Verify your `module.config.ts` exports variables correctly mapping the slugs and RBAC roles.
- **Draft or Conversation stuck in a weird UI loop**:
  Flush the memory. Extract UserID. Run `redis-cli DEL "draft:{userId}:{slug}"` or simply send `/cancel` through the Telegram Bot client explicitly.
- **Unexpected TypeScript errors occurring immediately after pull**:
  Run `npm install && npm run db:generate` to synchronize package updates and ORM logic definitions.
- **Drifted/Conflict Migrations (schema drift)**:
  Run `npx prisma migrate reset` (**DESTRUCTIVE**). Do not do this in production.

---

## 12. Environment Modes

The ecosystem defines logic branching based on the `NODE_ENV` parameter configuration (`.env`).

- **Development (`npm run dev`)**:
  `NODE_ENV=development`. Focuses on verbosity. Loads `tsx` for real-time typescript execution without emitting JS. Console logging is detailed, tracing granular draft persistence patterns.
- **Testing (`npm test`)**:
  `NODE_ENV=test`. Runs through `vitest`, aggressively mocking outgoing dependencies (like Redis, Database execution vectors, or Telegram API responses).
- **Production (`npm run build` then `node dist/main.js`)**:
  `NODE_ENV=production`. Compiles explicitly via `tsup` into highly optimized ES Modules for server execution. Console logs evaluate strictly warning/error tiers, conserving memory throughput.
