# Other — scripts

This document provides an overview and detailed explanation of the utility scripts located in the `scripts/` directory. These scripts are designed to streamline common module management tasks within the application, such as scaffolding new modules, listing existing ones, and safely removing them.

## Overview

The `scripts` module comprises a set of standalone TypeScript utilities that interact with the application's module structure and Prisma schema. They are intended for developer use to manage the lifecycle of feature modules.

The primary scripts are:

*   **`module-create.ts`**: Scaffolds a new module with a predefined structure and essential files.
*   **`module-list.ts`**: Lists all discovered modules and their basic configuration.
*   **`module-remove.ts`**: Deletes an existing module's files and associated schema.

## Module Creation (`scripts/module-create.ts`)

The `module-create.ts` script automates the process of setting up a new module. It generates the necessary directory structure, configuration files, conversation stubs, Prisma schema placeholder, locale files, and basic tests, significantly reducing manual setup time.

### Purpose

To quickly scaffold a new feature module, ensuring it adheres to the project's standard structure and integrates correctly with the module system and Prisma.

### Usage

The script supports both interactive and non-interactive (command-line argument-driven) modes.

**Interactive Mode:**
Run the script with an optional initial slug. If no slug is provided, or if more details are needed, `inquirer` prompts will guide you.

```bash
node scripts/module-create.ts [initial-slug]
```

**Non-Interactive Mode:**
For automated workflows or testing, provide all necessary details as command-line arguments.

```bash
node scripts/module-create.ts <slug> --non-interactive \
  --name="اسم الوحدة" \
  --nameEn="Module Name" \
  --sectionSlug="operations" \
  --icon="🚀" \
  --includeEdit \
  --includeHooks
```

**Arguments:**

*   `<slug>` (positional): The unique, lowercase, hyphen-separated identifier for the module (e.g., `fuel-entry`). Required in non-interactive mode.
*   `--non-interactive`: Flag to enable non-interactive mode.
*   `--name=<string>`: Arabic display name (i18n key). Default: `${slug}-name`.
*   `--nameEn=<string>`: English display name (i18n key). Default: `${slug}-name-en`.
*   `--sectionSlug=<string>`: The slug of the section this module belongs to (e.g., `operations`). Validated against the database. Default: `operations`.
*   `--icon=<string>`: An emoji icon for the module. Default: `📦`.
*   `--includeEdit`: Flag to include an `edit.conversation.ts` file.
*   `--includeHooks`: Flag to include a `hooks.ts` file.

### Workflow

The script follows a structured process to create a new module:

```mermaid
graph TD
    A[Start module-create.ts] --> B{Get Slug & Mode};
    B -- Interactive --> C[Prompt for Slug & Details (inquirer)];
    B -- Non-Interactive --> D[Parse Slug & Details from args];
    C --> E{Validate Slug & Check for existing dir};
    D --> E;
    E -- Invalid/Exists --> F[Exit with Error];
    E -- Valid/New --> G{Validate sectionSlug against Prisma DB};
    G -- DB Error (warn) --> H[Continue];
    G -- Valid --> H;
    H --> I[Create modules/<slug> directory & subdirs];
    I --> J[Generate & Write module files];
    J --> K[Copy schema.prisma to prisma/schema/modules/];
    K --> L[Run npx prisma generate];
    L --> M[Success & Exit];
    F --> M;
```

1.  **Slug Acquisition & Validation**: Determines the module slug from arguments or interactive prompts. It validates the slug format and ensures no module with the same slug already exists.
2.  **Module Details Acquisition**: Gathers module metadata (names, section, icon) and feature flags (`includeEdit`, `includeHooks`) either interactively or from command-line arguments.
3.  **Section Slug Validation**: Connects to the database via `PrismaClient` to verify that the provided `sectionSlug` corresponds to an existing `Section` record. A warning is issued if the database is unreachable, allowing the process to continue (Issue F1).
4.  **Directory Creation**: Creates the main module directory (`modules/<slug>`) and essential subdirectories (`locales`, `tests`).
5.  **File Generation**: Populates the new module directory with templated files:
    *   `config.ts`: Defines module metadata, permissions, and entry points using `defineModule`.
    *   `add.conversation.ts`: A stub for the module's "add" conversation flow.
    *   `edit.conversation.ts` (optional): A stub for the "edit" conversation flow, if `--includeEdit` is specified.
    *   `hooks.ts` (optional): A stub for module lifecycle hooks, if `--includeHooks` is specified.
    *   `schema.prisma`: A commented-out placeholder for module-specific Prisma models.
    *   `locales/ar.ftl`, `locales/en.ftl`: Basic FTL translation files for the module's name.
    *   `tests/flow.test.ts`: A basic Vitest test file.
    *   `package.json`: A minimal `package.json` for monorepo workspace integration.
6.  **Prisma Schema Integration**: Copies the generated `schema.prisma` file into the `prisma/schema/modules/` directory.
7.  **Prisma Generation**: Executes `npx prisma generate` to update the Prisma client and reflect any new schema changes.

### Key Components

*   `inquirer`: Used for interactive command-line prompts.
*   `fs`, `path`: Node.js built-in modules for file system operations.
*   `execSync`: Executes shell commands, specifically `npx prisma generate`.
*   `PrismaClient`: Interacts with the database for `sectionSlug` validation.
*   Templates: Hardcoded string templates are used to generate the initial content of various module files.

## Module Listing (`scripts/module-list.ts`)

The `module-list.ts` script provides a quick overview of all modules currently present in the `modules/` directory.

### Purpose

To list all discovered modules and display key information extracted from their `config.ts` files, aiding in module discovery and status checks.

### Usage

```bash
node scripts/module-list.ts
```

### How It Works

1.  **Directory Scan**: It scans the `modules/` directory for subdirectories.
2.  **Config Parsing**: For each subdirectory, it attempts to read the `config.ts` file.
3.  **Information Extraction**: It uses regular expressions (`content.match`) to extract the `name`, `sectionSlug`, and `icon` properties from the `config.ts` file content.
4.  **Output**: The gathered information, along with a status indicating if `config.ts` was found and parsed successfully, is displayed in a formatted table using `console.table`.

### Limitations

This script performs static analysis by parsing file content with regex. It does not execute the module's `config.ts` or load the module dynamically. Therefore, it might not catch syntax errors or complex configuration issues, but it's fast and effective for a quick overview.

## Module Removal (`scripts/module-remove.ts`)

The `module-remove.ts` script facilitates the safe deletion of an existing module's files and its associated Prisma schema snippet.

### Purpose

To remove all files related to a specific module from the codebase, including its directory and Prisma schema definition.

### Usage

```bash
node scripts/module-remove.ts <slug>
```

**Arguments:**

*   `<slug>` (positional): The slug of the module to be removed.

### Workflow

1.  **Slug Validation**: Requires a module slug as a command-line argument and verifies that the corresponding module directory exists.
2.  **Confirmation**: Prompts the user to type the module slug for confirmation, preventing accidental deletions.
3.  **File Deletion**:
    *   Recursively deletes the `modules/<slug>` directory.
    *   Deletes the `prisma/schema/modules/<slug>.prisma` file if it exists.
4.  **Prisma Generation**: Executes `npx prisma generate` to update the Prisma client after the schema file has been removed. A warning is issued if this command fails.

### Important Considerations

*   **Database Tables**: This script **does NOT drop any database tables** associated with the module. Developers must manually delete the corresponding tables from the database and then run `npx prisma migrate` to reflect these changes in the Prisma migration history.
*   **Data Loss**: Deleting a module is a destructive operation. Ensure all necessary backups or data migrations are performed before removal.

## Developer Notes

*   **Consistency**: These scripts enforce a consistent module structure, which is crucial for maintainability and scalability.
*   **Error Handling**: The scripts include basic error handling and informative messages to guide developers.
*   **Prisma Integration**: The `module-create.ts` and `module-remove.ts` scripts automatically manage the module's Prisma schema file within the `prisma/schema/modules/` directory and trigger `prisma generate`. However, database migrations (e.g., `prisma migrate dev`) are still a manual step for schema changes or deletions.
*   **Extensibility**: The templating approach in `module-create.ts` can be extended to include more boilerplate files or custom logic as the project evolves.