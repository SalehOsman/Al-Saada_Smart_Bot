# Other — GEMINI.md

## `GEMINI.md`: _Al-Saada_Smart_Bot Development Guidelines

The `GEMINI.md` file serves as the central, auto-generated development guideline and technology overview for the `_Al-Saada_Smart_Bot` project. Unlike typical code modules, this file does not contain executable code, functions, or classes. Instead, it provides a high-level reference for developers working on the project.

### Purpose

The primary purpose of `GEMINI.md` is to consolidate essential project information, ensuring all developers have a consistent understanding of the project's technical stack, structure, and conventions. It acts as a living document, automatically updated from feature plans to reflect the current state of the project's development environment.

### Key Information Provided

This document outlines critical aspects of the `_Al-Saada_Smart_Bot` project:

*   **Active Technologies:** Lists the core programming languages, runtimes, and libraries in use. This includes:
    *   TypeScript 5.x (strict mode)
    *   Node.js >= 20
    *   grammY 1.x
    *   @grammyjs/conversations
    *   @grammyjs/hydrate
    *   ioredis
    *   Pino
    *   Vitest (specifically for the `003-module-kit`)
*   **Project Structure:** Defines the top-level directory layout, indicating where source code (`src/`) and tests (`tests/`) are located.
*   **Commands:** Provides common development commands, such as `npm test` and `npm run lint`.
*   **Code Style:** Specifies adherence to standard TypeScript 5.x (strict mode) and Node.js >= 20 conventions.
*   **Recent Changes:** Highlights significant updates to the project's technology stack or tooling, such as the addition of the `003-module-kit` and its associated dependencies.

### Role in the Codebase

`GEMINI.md` is a documentation artifact, not an executable component of the `_Al-Saada_Smart_Bot`.

*   **No Runtime Behavior:** It does not contain any logic that is executed during the bot's operation.
*   **No API or Code Patterns:** As a Markdown file, it does not expose any functions, classes, or specific code patterns for other modules to interact with.
*   **No Call Graph/Execution Flows:** Consistent with its nature as a static document, `GEMINI.md` has no internal, outgoing, or incoming calls, and no detectable execution flows.

### Maintenance

This file is explicitly marked as "Auto-generated from all feature plans" and includes a "Last updated" timestamp. This indicates that `GEMINI.md` is intended to be automatically regenerated as project plans evolve, ensuring its contents remain current without manual intervention from developers. Developers should refer to this document for guidelines but should not manually edit its auto-generated sections.
