# Other — README.md

The `README.md` file serves as the primary entry point and high-level overview for the **Al-Saada Smart Bot** project. It is crucial for developers as it outlines the project's purpose, architecture, setup instructions, core components, and development methodology. While not a code module itself, it acts as the foundational documentation guiding developers on how to understand, set up, and contribute to the codebase.

---

## 1. Project Overview

The Al-Saada Smart Bot is a **ready-made, extensible platform** designed to streamline daily business operations for Egyptian companies via Telegram. Its core innovation lies in allowing businesses to define custom "modules" for specific workflows (e.g., fuel entry, attendance, leave requests) without writing extensive boilerplate code. The platform then automatically generates the necessary bot interactions, including data validation, confirmation, persistence, and auditing.

**Key Developer Takeaways:**
*   **Platform-centric:** The project is built as a platform, meaning its core value is its extensibility through custom modules.
*   **Telegram-native:** All user interaction happens within Telegram, leveraging `grammY` for bot development.
*   **Arabic-first:** Strong emphasis on localization for the Egyptian market, including specific data validators and cultural contexts.

## 2. Architecture: A Layered Approach

The project employs a clear three-layered architecture, designed for modularity and extensibility. Developers primarily interact with Layer 3, building upon the stable foundations of Layers 1 and 2.

```mermaid
graph TD
    L3[Layer 3: Custom Modules] --> L2
    L2[Layer 2: Module Kit] --> L1
    L1[Layer 1: Platform Core] --> INF[Infrastructure]

    subgraph L3_Details [Layer 3: Modules (Custom)]
        M1(Fuel)
        M2(Attendance)
        M3(Leave)
        M4(Expenses)
        M5(...)
    end

    subgraph L2_Details [Layer 2: Module Kit (Fixed)]
        V(validate)
        C(confirm)
        S(save)
        D(drafts)
        P(PII)
    end

    subgraph L1_Details [Layer 1: Platform Core (Fixed)]
        B(Bot)
        R(RBAC)
        SEC(Sections)
        A(Auth)
        AUD(Audit)
    end

    subgraph INF_Details [Infrastructure]
        PG(PostgreSQL)
        RD(Redis)
        DC(Docker)
    end

    L3_Details --> L2_Details
    L2_Details --> L1_Details
    L1_Details --> INF_Details
```

### 2.1. Layer 1: Platform Core (`packages/core/`)
This layer provides the fundamental building blocks of the bot. It is stable and generally not modified by module developers.

*   **Bot Engine:** Handles Telegram API interactions using `grammY`.
*   **Authentication (Auth):** Manages user identity and session.
*   **Role-Based Access Control (RBAC):** Defines and enforces permissions across the system (Super Admin, Admin, Employee, Visitor).
*   **Sections:** Organizes modules into logical categories for users.
*   **Audit Log:** Records significant system events and user actions.

### 2.2. Layer 2: Module Kit (`packages/module-kit/`)
This internal package provides a set of reusable tools and helpers for building modules. Developers leverage these utilities when defining their custom workflows.

*   **Validation:** Standardized data validation routines.
*   **Confirmation:** Mechanisms for users to review and confirm their input.
*   **Persistence:** Tools for saving module data to the database.
*   **Drafts:** Functionality to save incomplete module entries as drafts.
*   **PII Handling:** Utilities for managing Personally Identifiable Information securely.

### 2.3. Layer 3: Custom Modules (`modules/`)
This is the primary layer for developers extending the platform. Each module defines a specific business process, including its input fields, validation rules, and conversation flow.

*   **Module Definition:** Developers define the structure and behavior of their specific business operations.
*   **Conversation Flows:** Modules dictate the sequence of user interactions, leveraging the `grammY/conversations` plugin.

## 3. Key Technologies and Project Structure

The project is built with a modern TypeScript/Node.js stack, emphasizing robustness and maintainability.

### 3.1. Tech Stack Highlights
*   **Runtime:** Node.js ≥20, TypeScript 5.x (strict mode).
*   **Bot Framework:** `grammY` with `@grammyjs/conversations` for managing multi-step user interactions and `hydrate` for efficient state management.
*   **Database:** PostgreSQL 16, managed with `Prisma ORM` using a multi-file schema for better organization.
*   **Caching:** Redis 7 via `ioredis` for performance-critical operations.
*   **Internationalization:** `@grammyjs/i18n` using Fluent `.ftl` files, crucial for the Arabic-first approach.
*   **Testing:** `Vitest` with 112 passing tests, indicating a strong commitment to code quality.
*   **Logging:** `Pino` for structured and efficient logging.
*   **Infrastructure:** Docker Compose for easy setup and consistent environments.

### 3.2. Project Structure
The repository is organized to clearly separate core platform logic from custom module implementations:

```
al-saada-smart-bot/
├── packages/                 # Core platform components
│   ├── core/                 # Layer 1: Platform Core
│   ├── module-kit/           # Layer 2: Module Kit utilities
│   └── validators/           # Shared data validators (e.g., Egyptian phone numbers)
├── modules/                  # Layer 3: Custom modules defined by developers
├── prisma/                   # Database schema definitions
│   └── schema/               # Multi-File Prisma Schema
├── scripts/                  # CLI tools for module management (create, list, remove)
└── specs/                    # SpecKit specifications for features
```

## 4. Developer Workflow and CLI Tools

The project provides a streamlined workflow for setting up the environment and developing modules.

### 4.1. Quick Start for Developers
The `README.md` provides a clear sequence of commands to get the bot running:

1.  `git clone ...`
2.  `cp .env.example .env` (configure `BOT_TOKEN`)
3.  `npm install`
4.  `npm run docker:up` (starts PostgreSQL and Redis)
5.  `npm run db:migrate` & `npm run db:generate` (sets up the database schema)
6.  `npm run dev` (starts the bot in development mode)

### 4.2. Module Management CLI
The `scripts/` directory contains essential CLI tools for module development:

*   `npm run module:create`: An interactive script to scaffold a new module, generating the necessary files and structure within the `modules/` directory. This is the primary entry point for creating new business workflows.
*   `npm run module:list`: Lists all currently defined modules.
*   `npm run module:remove`: Deletes an existing module.

These tools significantly reduce the boilerplate required to start a new module, allowing developers to focus on the specific business logic.

### 4.3. Bot Commands
Developers should be aware of the bot commands, especially administrative ones, for testing and managing the system:

*   `/start`: Initiates user registration or displays the main menu.
*   `/cancel`: Aborts the current operation, saving it as a draft.
*   `/help`: Provides context-sensitive assistance.
*   `/sections` (Super Admin): Manages the organization of modules.
*   `/maintenance on|off` (Super Admin): Controls bot availability.
*   `/audit` (Super Admin): Accesses the system's audit log.

## 5. Role-Based Access Control (RBAC)

The RBAC system is fundamental to how users interact with modules and the platform. Developers building modules must consider how their module's functionality aligns with these roles:

*   **Super Admin:** Full system control. Modules might expose administrative functions only to this role.
*   **Admin:** Scoped access to specific sections/modules. Module developers need to integrate with the RBAC system to ensure actions are authorized.
*   **Employee:** Can access personal data and submit requests via modules. Most custom modules will target this role.
*   **Visitor:** Limited to requesting to join the platform.

## 6. Egyptian Context and Localization

A significant aspect of this project is its deep integration with the Egyptian context. Developers must be mindful of these features when building or extending modules:

*   **Data Validation:** Built-in validators for Egyptian phone numbers (010/011/012/015) and the 14-digit National ID (which can extract birth date, gender, and governorate).
*   **Cultural Nuances:** Support for compound Arabic names, Egyptian Pound (EGP) currency, Africa/Cairo timezone, and both Gregorian and Hijri calendars.
*   **Internationalization:** The use of `@grammyjs/i18n` with Fluent `.ftl` files means all user-facing text should be externalized and translated.

## 7. Roadmap and Future Development

The `README.md` outlines a clear roadmap, indicating future directions for the project. Developers interested in contributing should pay attention to Phase 4, which introduces an **AI Operational Assistant**. This phase will involve:

*   **RAG + pgvector:** For Arabic Q&A over company data.
*   **OCR/Document Analysis:** Integration with Tesseract/PaddleOCR for file analysis.
*   **Speech-to-Text:** Using Whisper for voice notes.
*   **Flexible AI Models:** Support for both local (Ollama) and cloud-based (Gemini/Claude/OpenAI) models.
*   **Privacy:** Implementing `Context Redaction` to filter sensitive data before external processing.

This indicates future opportunities for developers to work with AI integrations, vector databases, and advanced data processing.

## 8. Development Methodology (SpecKit)

The project adheres to the **SpecKit** methodology for specification-driven development. This means that all features and changes are guided by a structured process:

1.  **Constitution:** The overarching principles and guidelines.
2.  **Specification:** Detailed definition of a feature.
3.  **Plan:** Technical design and architectural decisions.
4.  **Tasks:** Granular breakdown of implementation steps.
5.  **Analysis:** Review for consistency and adherence to specifications.

Developers contributing to the project are expected to follow this methodology, starting with clear specifications for any new features or modules.

---

## Call Graph & Execution Flows

As `README.md` is a documentation file and not executable code, it does not have an associated call graph or execution flow. Its purpose is to describe the project's code and its execution.