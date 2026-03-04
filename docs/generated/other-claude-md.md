# Other — CLAUDE.md

This document provides an overview of the `_Al-Saada_Smart_Bot` project's development guidelines and detailed documentation for the **AI Assistant (Layer 4)** module. It is intended for developers who need to understand, contribute to, or integrate with this codebase.

---

## _Al-Saada_Smart_Bot Development Guidelines

This section outlines the general development environment, project structure, and coding standards for the `_Al-Saada_Smart_Bot` project.

### Active Technologies

The project leverages a modern TypeScript-centric stack for its core and AI capabilities, alongside specialized tools for specific functionalities.

*   **Core Development**: TypeScript 5.x (Node.js ≥20) with Hono (for core services) and grammY 1.x (for bot interactions).
*   **AI Assistant**: Vercel AI SDK, Ollama SDK, and pgvector for advanced AI features.
*   **Bot Enhancements**: `@grammyjs/conversations` and `@grammyjs/hydrate` for rich bot interactions.
*   **Data Storage**: PostgreSQL with `pgvector` extension for vector embeddings.

### Project Structure

The codebase is organized into a monorepo structure using `pnpm`, with distinct packages for core functionalities, modules, and utilities.

```text
packages/
├── core/          # Platform Core (Layer 1) - Foundational services and utilities.
├── module-kit/    # Module Kit (Layer 2) - Provides helpers and abstractions for building modules.
├── ai-assistant/  # AI Assistant (Layer 4) - The primary AI-driven capabilities.
└── validators/    # Egyptian validation library - Specific validation logic.

modules/            # Contains all feature-specific modules, including their configurations and conversation flows.
```

### Development Commands

Standard `pnpm` scripts are available for common development tasks:

*   **Build**: `pnpm build` - Compiles TypeScript code.
*   **Test**: `pnpm test` - Executes unit and integration tests.
*   **Lint**: `pnpm lint` - Checks code for style and potential errors.
*   **Type Check**: `pnpm typecheck` - Verifies TypeScript types across the project.
*   **Prisma Migrations**: `pnpm prisma migrate dev` - Manages database schema changes using Prisma.

### Code Style and Quality

Adherence to these guidelines ensures consistency and maintainability:

*   **TypeScript Strict Mode**: All TypeScript code must compile under strict mode.
*   **Localization**: No Arabic strings are permitted directly in source code. Use `.ftl` locale files for all localized content.
*   **Input Validation**: Zod is mandatory for all input validation schemas.
*   **Logging**: Pino is used for structured logging across the application.
*   **Test Coverage**: A minimum of 80% test coverage is required for all new or modified code.

---

## AI Assistant (Layer 4) Module (002-ai-assistant)

The `ai-assistant` module is Layer 4 of the `_Al-Saada_Smart_Bot` architecture, providing advanced AI capabilities such as natural language understanding, RAG (Retrieval Augmented Generation), voice interaction, and report generation.

### Purpose

The AI Assistant module is responsible for:
*   Processing natural language queries from users.
*   Interacting with various Large Language Models (LLMs), both local and cloud-based.
*   Performing Retrieval Augmented Generation (RAG) against a vector database of business data.
*   Handling speech-to-text (STT) and text-to-speech (TTS) for voice interactions.
*   Redacting Personally Identifiable Information (PII) for privacy.
*   Generating structured reports and proactive suggestions.

### Architecture & Package Structure

The `packages/ai-assistant/` directory is structured to separate concerns into services, handlers, middleware, and data models.

```
packages/ai-assistant/
├── src/
│   ├── services/               # Core business logic and external API integrations
│   │   ├── llm-client.service.ts      # Unified interface for LLM interactions (Ollama, Vercel AI SDK)
│   │   ├── rag.service.ts              # Handles vector search and retrieval from pgvector
│   │   ├── embedding.service.ts         # Generates text embeddings using nomic-embed-text
│   │   ├── privacy.service.ts          # Manages PII redaction and privacy rules
│   │   ├── document-parser.service.ts    # Extracts text and data from documents (OCR)
│   │   ├── voice.service.ts           # Integrates Whisper (STT) and Google TTS
│   │   ├── query.service.ts           # Parses natural language queries and orchestrates responses
│   │   ├── report.service.ts          # Logic for generating and scheduling reports
│   │   └── suggestion.service.ts      # Provides proactive AI-driven suggestions
│   ├── handlers/               # Entry points for bot commands and conversation flows
│   │   ├── ai-command.handler.ts       # Handles the `/ai` command for general AI queries
│   │   ├── voice.handler.ts           # Manages voice interaction sessions
│   │   ├── report.handler.ts          # Handles the `/report` command for report generation
│   │   └── settings.handler.ts        # Manages the `/ai-settings` command for user/admin AI preferences
│   ├── middleware/             # Intercepts requests for cross-cutting concerns
│   │   ├── rbac-filter.middleware.ts   # Enforces Role-Based Access Control (RBAC)
│   │   └── audit-logger.middleware.ts  # Logs AI interaction metadata for auditing
│   └── models/                 # Defines data structures and schemas
│       ├── ai-interaction.model.ts
│       ├── ai-suggestion.model.ts
│       ├── scheduled-report.model.ts
│       ├── privacy-rule.model.ts
│       ├── document-analysis.model.ts
│       └── voice-session.model.ts
├── locales/                    # Localization files for Arabic and English
│   ├── ar.ftl
│   └── en.ftl
└── tests/                      # Unit and integration tests for the module
```

### Key Technologies

The AI Assistant module integrates several specialized technologies to deliver its capabilities:

| Technology          | Purpose                               | Notes                                                              |
| :------------------ | :------------------------------------ | :----------------------------------------------------------------- |
| **Vercel AI SDK**   | Unified LLM Interface                 | Provides a consistent API for interacting with various LLMs (local & cloud). |
| **Ollama SDK**      | Local Model Inference                 | Used for running local LLMs, specifically Qwen2.5:7b for Arabic support. |
| **nomic-embed-text**| Embeddings Generation                 | Generates text embeddings locally, avoiding external API calls for this task. |
| **pgvector**        | Vector Database Extension             | PostgreSQL extension enabling efficient similarity search for RAG. |
| **Whisper**         | Speech-to-Text (STT)                  | Utilizes the OpenAI Whisper API for converting speech to text, with Arabic support. |
| **Google TTS**      | Text-to-Speech (TTS)                  | Provides high-quality text-to-speech synthesis, including Arabic pronunciation. |
| **Tesseract**       | Optical Character Recognition (OCR)   | Used by `document-parser.service.ts` for extracting text from images and PDFs, with Arabic language pack support. |

### Operating Modes

The AI Assistant can operate in different modes, balancing speed, accuracy, and resource usage:

1.  **Fast Mode**: Prioritizes speed by exclusively using local LLMs (e.g., Ollama). Aims for 2-5 second response times. Suitable for quick queries where high accuracy from cloud models is not critical.
2.  **Smart Mode**: Combines local LLM processing with a review or refinement step by cloud models. This mode offers higher accuracy but has a longer response time (5-10 seconds).
3.  **Training Mode**: Operates in the background, focusing on RAG improvement. This mode might involve processing new data, updating vector embeddings, or fine-tuning retrieval strategies without directly impacting user-facing responses.

### Privacy & Security

Privacy and security are paramount for the AI Assistant, especially when handling sensitive user data:

*   **Local Model Data Access**: When using local models, the system has full data access. Developers must ensure that local model deployments are secure and isolated.
*   **Cloud Model Context Redaction**: For interactions involving cloud models, a PII (Personally Identifiable Information) redaction layer (`privacy.service.ts`) is applied to filter sensitive data from the context sent to external APIs.
*   **Role-Based Access Control (RBAC)**: All AI queries and interactions are subject to RBAC enforcement via `rbac-filter.middleware.ts`, respecting the user's role and `AdminScope` to prevent unauthorized data access.
*   **Audit Logging**: AI interactions are logged by `audit-logger.middleware.ts` for auditing purposes. Crucially, the *content* of user questions is **not** logged to maintain privacy, only metadata about the interaction.

### Integration Points

The AI Assistant module integrates with the `Core` platform and other modules primarily through:

*   **Bot Commands**: Exposes commands like `/ai`, `/ai-settings`, and `/report` which are handled by the respective `handlers/` in this module.
*   **Conversation Handlers**: Participates in natural language conversation flows managed by `grammY` and `@grammyjs/conversations`, allowing for multi-turn AI interactions.
*   **RAG Queries**: Provides services for other modules to perform RAG queries against business data stored in `pgvector`.
*   **Privacy Rules Configuration**: Super Administrators can configure privacy rules via dedicated interfaces, which are then enforced by `privacy.service.ts`.

### AI Assistant Interaction Flow

A typical interaction with the AI Assistant, such as using the `/ai` command, follows a structured flow:

```mermaid
graph TD
    A[User Input /ai command] --> B(ai-command.handler.ts)
    B --> C(rbac-filter.middleware.ts)
    C --> D(audit-logger.middleware.ts)
    D --> E(query.service.ts)
    E --> F(llm-client.service.ts)
    E --> G(rag.service.ts)
    F --&gt; H[LLM Response]
    G --&gt; I[RAG Context]
    H & I --> J(privacy.service.ts)
    J --> K[Final Response to User]
```

1.  **User Input**: A user sends a command like `/ai` or engages in a natural language conversation.
2.  **Handler**: The relevant handler (e.g., `ai-command.handler.ts`) receives the input.
3.  **Middleware**: The request passes through `rbac-filter.middleware.ts` for access control and `audit-logger.middleware.ts` for logging.
4.  **Query Service**: `query.service.ts` orchestrates the AI response, potentially calling:
    *   `llm-client.service.ts` to interact with an LLM (local or cloud).
    *   `rag.service.ts` to retrieve relevant context from the vector database.
5.  **Privacy Service**: Before generating the final response, `privacy.service.ts` applies PII redaction if necessary, especially for cloud model interactions.
6.  **Response**: The final, processed response is sent back to the user.