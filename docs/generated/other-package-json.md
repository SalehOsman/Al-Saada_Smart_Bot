# Other — package.json

This `package.json` file serves as the central manifest for the `al-saada-smart-bot` project, defining its metadata, dependencies, and a comprehensive set of scripts for development, testing, building, and maintenance. It's crucial for understanding the project's structure, available commands, and required tooling.

Unlike traditional code modules, `package.json` is a declarative configuration file. It doesn't contain executable code itself, but rather dictates how the project's code is managed and run.

## Project Overview

The `package.json` defines the `al-saada-smart-bot` as a private, module-type (ESM) project.

*   **`name`**: `al-saada-smart-bot` - The project's identifier.
*   **`type`**: `module` - Specifies that all `.js` files in this project are ECMAScript modules (ESM) by default, enabling `import`/`export` syntax without special configuration.
*   **`version`**: `0.1.0` - The current version of the project.
*   **`private`**: `true` - Indicates that this package is not intended to be published to the npm registry.
*   **`engines`**: `node: ">=20"` - Specifies that Node.js version 20 or higher is required to run this project.

## Monorepo Structure (`workspaces`)

This project is structured as a monorepo, managed by npm/yarn/pnpm workspaces. The `workspaces` field defines the directories where individual sub-packages (or "modules" in this context) reside.

```json
"workspaces": [
  "packages/*",
  "modules/*"
]
```

This configuration means:
*   Any directory directly under `packages/` (e.g., `packages/core`, `packages/utils`) is treated as a separate workspace.
*   Any directory directly under `modules/` (e.g., `modules/chatbot`, `modules/integrations`) is also treated as a separate workspace.

This structure allows for shared dependencies, simplified linking between internal packages, and a unified development workflow across multiple related components.

```mermaid
graph TD
    A[al-saada-smart-bot (Root)] --> B[packages/*]
    A --> C[modules/*]
```

## Development Scripts (`scripts`)

The `scripts` section is the primary interface for developers to interact with the project. It defines a set of named commands that automate common tasks.

### Documentation

*   **`docs:api`**: `typedoc`
    *   Generates API documentation from TypeScript source files using TypeDoc.
*   **`docs:api:watch`**: `typedoc --watch`
    *   Generates API documentation and watches for changes, regenerating automatically.

### Development & Build

*   **`dev`**: `tsx --env-file=.env packages/core/src/main.ts`
    *   Starts the main application in development mode. It uses `tsx` to execute `packages/core/src/main.ts` directly, loading environment variables from `.env`.
*   **`dev:watch`**: `tsx watch packages/core/src/main.ts`
    *   Starts the main application in development mode with file watching, automatically restarting on changes.
*   **`build`**: `tsup packages/core/src/main.ts --format esm --dts`
    *   Builds the main application for production using `tsup`. It outputs an ESM bundle and generates TypeScript declaration files (`.d.ts`).

### Testing

*   **`test`**: `vitest`
    *   Runs all tests using Vitest.
*   **`test:coverage`**: `vitest run --coverage`
    *   Runs all tests and generates a code coverage report.
*   **`test:watch`**: `vitest --watch`
    *   Runs tests in watch mode, re-running affected tests on file changes.

### Code Quality

*   **`lint`**: `eslint .`
    *   Lints all project files using ESLint to enforce code style and catch potential issues.
*   **`lint:fix`**: `eslint . --fix`
    *   Lints files and automatically fixes fixable issues.
*   **`typecheck`**: `tsc --noEmit`
    *   Performs a full TypeScript type check across the project without emitting any JavaScript files.

### Database Management (Prisma)

*   **`db:migrate`**: `prisma migrate dev`
    *   Applies pending database migrations in a development environment.
*   **`db:generate`**: `prisma generate`
    *   Generates Prisma Client based on the `prisma/schema` file, making it available for type-safe database interactions.
*   **`db:studio`**: `prisma studio`
    *   Opens Prisma Studio, a graphical user interface for viewing and editing database data.

### Docker

*   **`docker:up`**: `docker-compose up -d`
    *   Starts Docker services defined in `docker-compose.yml` in detached mode.
*   **`docker:down`**: `docker-compose down`
    *   Stops and removes Docker services.

### Monorepo Module Management

These are custom scripts designed to streamline the creation and removal of modules within the monorepo. They are implemented as TypeScript files executed via `tsx`.

*   **`module:create`**: `tsx scripts/module-create.ts`
    *   Executes a script to interactively create a new module (likely prompting for name, type, etc.).
*   **`module:remove`**: `tsx scripts/module-remove.ts`
    *   Executes a script to interactively remove an existing module.
*   **`module:list`**: `tsx scripts/module-list.ts`
    *   Executes a script to list all existing modules in the monorepo.

## Dependencies

### Runtime Dependencies (`dependencies`)

These packages are required for the application to run in production.

*   **`dotenv`**: `^17.3.1`
    *   Loads environment variables from a `.env` file into `process.env`.

### Development Dependencies (`devDependencies`)

These packages are used during development, testing, building, and linting, but are not required for the application to run in production.

*   **`@antfu/eslint-config`**: `^2.8.1`
    *   A popular ESLint configuration preset.
*   **`@types/inquirer`**: `^9.0.9`
    *   TypeScript type definitions for the `inquirer` package.
*   **`commitlint`**: `^19.2.1`
    *   Lints commit messages to ensure they conform to a specified format.
*   **`eslint`**: `^8.57.0`
    *   The core ESLint linter.
*   **`husky`**: `^9.0.11`
    *   Enables Git hooks (e.g., pre-commit, pre-push) to automate tasks like linting or testing before commits/pushes.
*   **`inquirer`**: `^9.3.8`
    *   A collection of common interactive command-line user interfaces, likely used by the `module:*` scripts.
*   **`lint-staged`**: `^15.2.2`
    *   Runs linters on Git staged files, improving performance and ensuring only relevant files are checked.
*   **`tsup`**: `^8.0.2`
    *   A fast, zero-config bundler for TypeScript projects, used for the `build` script.
*   **`tsx`**: `^4.7.2`
    *   A tool to run TypeScript files directly in Node.js without pre-compilation, used for `dev` and custom scripts.
*   **`typedoc`**: `^0.25.12`
    *   A documentation generator for TypeScript projects.
*   **`typescript`**: `^5.4.3`
    *   The TypeScript compiler.
*   **`vitest`**: `^1.4.0`
    *   A fast unit test framework powered by Vite.

## Prisma Configuration

*   **`prisma`**: `{ "schema": "prisma/schema" }`
    *   Specifies the location of the Prisma schema file, which defines the database model and relations.

## Contributing and Development Workflow

Developers should familiarize themselves with the `scripts` section, as these are the primary commands for:

*   **Starting the application**: `npm run dev` or `npm run dev:watch`
*   **Running tests**: `npm test`
*   **Building for production**: `npm run build`
*   **Maintaining code quality**: `npm run lint`, `npm run typecheck`
*   **Managing the database**: `npm run db:migrate`, `npm run db:generate`, `npm run db:studio`
*   **Managing monorepo modules**: `npm run module:create`, `npm run module:remove`, `npm run module:list`

The `workspaces` configuration is key to understanding how different parts of the `al-saada-smart-bot` project are organized and interact within the monorepo. When adding new dependencies to a specific workspace, ensure they are installed within that workspace's `package.json` rather than the root, unless they are shared development tools.
