# Implementation Plan: AI Assistant - Comprehensive Operational Partner

**Branch**: `002-ai-assistant` | **Date**: 2026-03-02 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ai-assistant/spec.md`

## Summary

The AI Assistant transforms the platform from a reactive tool to a proactive operational partner. It enables natural language data entry (reducing form navigation), Arabic Q&A on business data (with RBAC enforcement), smart report generation with AI insights, proactive business suggestions, document analysis with data extraction, and voice interaction. The architecture follows the Teacher-Student model: Qwen2.5:7b (local) handles all queries first for speed and privacy; cloud models (Gemini/GPT/Claude) review and refine when needed. RAG uses pgvector on PostgreSQL for embeddings, with privacy filtering for cloud model calls.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js ≥20)
**Primary Dependencies**: Vercel AI SDK (@ai-sdk/*), Ollama SDK, pgvector, @grammyjs/conversations, Zod, Pino
**Storage**: PostgreSQL with pgvector extension, Redis (drafts, sessions), file storage for processed documents
**Testing**: Vitest with 80%+ coverage requirement
**Target Platform**: Docker containers (Linux), Telegram Bot integration
**Project Type**: Layer 4 package (standalone ai-assistant package in monorepo). Note: Layer 4 refers to architectural package structure, while Phase 4 (constitutional) refers to implementation sequence.
**Performance Goals**: Fast Mode <5s typical query, Smart Mode <10s, 90% data entry parse accuracy, 90% voice transcription accuracy
**Constraints**: No Arabic strings in source code (i18n-only), Config-First architecture, RBAC enforcement on all AI queries (via AdminScope from 001-platform-core — see specs/001-platform-core/spec.md for AdminScope entity definition. AdminScope maps users to sections/modules they can access. All RAG queries filter results by the requesting user's AdminScope.), PII redaction for cloud models
**Scale/Scope**: ~1,000 users, 6 new entities, 3 operating modes, 3 cloud providers, 2 voice modes (STT/TTS)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle Compliance

| Principle | Status | Notes |
|------------|----------|--------|
| I. Platform-First | PASS | Layer 1 & 2 (Core + Module Kit) already exist; this is Layer 4 |
| II. Config-First | PASS | AI settings configurable via bot; model selection via config; privacy rules per field |
| III. Helper Reusability | PASS | No helpers duplicated; new AI services are self-contained |
| IV. Test-First | PASS | Unit tests required before implementation; 80%+ coverage |
| V. Egyptian Business Context | PASS | Arabic-first with RTL, Egyptian formats supported |
| VI. Security & Privacy | PASS | PII redaction layer for cloud; local model gets full access; all interactions logged (without content) |
| VII. i18n-Only User Text | PASS | No Arabic in source code; all via .ftl locale files |
| VIII. Simplicity Over Cleverness | PASS | Start with local model only; add cloud review in Phase B |
| IX. Monorepo Structure | PASS | packages/ai-assistant/ as standalone Layer 4 package |
| X. Zero-Defect Gate | PASS | Will run `/speckit.analyze` before each phase advance |

### Phase Alignment

| Constitutional Phase | This Feature | Alignment |
|--------------------|----------------|------------|
| Phase 4: AI Operational Assistant (Feature 004) | This Feature (002-ai-assistant) | Direct match — implements constitutional Phase 4 |

**GATE STATUS**: PASS

## Project Structure

### Documentation (this feature)

```text
specs/002-ai-assistant/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
│   ├── ai-service.openapi.yaml
│   ├── rag-service.openapi.yaml
│   └── document-analysis.openapi.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
packages/ai-assistant/
├── src/
│   ├── models/
│   │   ├── ai-interaction.model.ts
│   │   ├── ai-suggestion.model.ts
│   │   ├── scheduled-report.model.ts
│   │   ├── privacy-rule.model.ts
│   │   └── document-analysis.model.ts
│   ├── services/
│   │   ├── llm-client.service.ts      # Unified interface for local + cloud models
│   │   ├── rag.service.ts              # Vector search + context building
│   │   ├── embedding.service.ts         # Generate embeddings
│   │   ├── privacy.service.ts          # PII redaction for cloud
│   │   ├── document-parser.service.ts    # OCR + data extraction
│   │   ├── voice.service.ts           # STT + TTS integration
│   │   ├── query.service.ts           # Natural language parsing
│   │   ├── report.service.ts          # Report generation + insights
│   │   └── suggestion.service.ts      # Proactive pattern analysis
│   ├── handlers/
│   │   ├── ai-command.handler.ts       # /ai command
│   │   ├── voice.handler.ts           # Voice interaction
│   │   ├── report.handler.ts          # /report command
│   │   └── settings.handler.ts        # /ai-settings command
│   ├── middleware/
│   │   ├── rbac-filter.middleware.ts   # Enforce RBAC on AI queries
│   │   └── audit-logger.middleware.ts # Log AI interactions
│   └── types/
│       ├── config.ts                  # AI configuration types
│       └── modes.ts                  # Operating mode definitions
├── locales/
│   ├── ar.ftl
│   └── en.ftl
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── middleware/
│   └── integration/
└── package.json

prisma/
└── schema/
    └── ai-assistant.prisma            # AI-specific tables
```

**Structure Decision**: The AI Assistant is a standalone Layer 4 package (`packages/ai-assistant/`) following the monorepo structure. This separation allows independent development and testing of AI capabilities while maintaining clean integration points with the Core (via handlers and services). AI-specific database tables are defined in `prisma/schema/ai-assistant.prisma` to keep them isolated from business logic tables.

## Phase 0: Outline & Research

### Research Tasks

| Unknown / Decision | Status | Output |
|--------------------|----------|---------|
| Natural language parsing approach for Arabic data entry | RESOLVED | Use structured extraction from local LLM with schema-based prompt engineering |
| Best practices for Teacher-Student AI architecture | RESOLVED | Local first, cloud review only on low confidence or explicitly requested |
| pgvector integration with Prisma | RESOLVED | Use custom Prisma extension for pgvector operations |
| Arabic OCR for documents | RESOLVED | Tesseract with Arabic language pack; fallback to PaddleOCR if needed |
| Voice STT for Arabic | RESOLVED | OpenAI Whisper API (best Arabic support) with local Whisper alternative |
| Text-to-Speech for Arabic | RESOLVED | Google Cloud TTS (best Arabic pronunciation) as primary |

### Research Findings

See [research.md](./research.md) for detailed decisions and rationale.

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for entity definitions, relationships, and validation rules.

### API Contracts

See `/contracts/` directory for OpenAPI specifications:
- `ai-service.openapi.yaml` — AI query and configuration endpoints
- `rag-service.openapi.yaml` — Vector search and embedding operations
- `document-analysis.openapi.yaml` — Document upload, processing, and extraction

### Quickstart Guide

See [quickstart.md](./quickstart.md) for development setup and local testing.

### Agent Context Update

Agent context updated via `.specify/scripts/powershell/update-agent-context.ps1` (verified: script exists in repository). Run after Phase 1 completion: `pwsh .specify/scripts/powershell/update-agent-context.ps1`

New AI-specific technologies added:
- Vercel AI SDK
- Ollama integration
- pgvector
- Whisper (STT)
- Document OCR libraries

## Complexity Tracking

No constitutional violations requiring justification. The implementation follows all architectural principles and phases defined in the constitution.
