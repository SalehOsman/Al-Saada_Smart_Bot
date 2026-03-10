# Implementation Plan: AI Assistant - Comprehensive Operational Partner

**Branch**: `002-ai-assistant` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-ai-assistant/spec.md`

## Summary

The AI Assistant transforms the platform from a reactive tool to a proactive operational partner. It enables natural language data entry (reducing form navigation), Arabic Q&A on business data (with RBAC enforcement), smart report generation with AI insights, proactive business suggestions, document analysis with data extraction, and voice interaction. The architecture follows the Teacher-Student model: Qwen2.5:7b (local) handles all queries first for speed and privacy; cloud models (Gemini/GPT/Claude) review and refine when needed. RAG uses pgvector on PostgreSQL for embeddings, with privacy filtering for cloud model calls.

**New Features (2026-03-10)**:
- Hybrid OCR with pluggable providers (Gemini Vision + DeepSeek-OCR)
- AI Toolkit API for module integration (@al-saada/ai-assistant/toolkit) with stable TypeScript function signatures for all 6 shared services (breaking changes require major semver bump)
- Module auto-indexing via BullMQ background jobs
- CRAG and Self-RAG quality patterns
- AI Permission Profiles (6 built-in + custom, two-layer RBAC enforcement)
- Prompt Injection Protection (NLP-based input sanitizer with AIAuditTrail logging)
- AI Audit Trail with exportable logs
- Confidence Indicator (0-100%) displayed on all AI responses
- AI Health Dashboard + Quota Management (with X-RateLimit response headers and localized 429 bodies) + Emergency Shutdown
- Feedback Loop + Training Mode integration
- Conversation Memory (session-scoped, Redis-backed)
- Smart Anomaly Detection (statistical baseline, auto-calibration)
- AI Data Validation (pre-save cross-validation, advisory only)
- Scheduled AI Briefings (BullMQ cron jobs)
- AI-Assisted Approvals (data-driven recommendations)
- Business Knowledge Base (SUPER_ADMIN configurable)
- Voice Data Export (hands-free report delivery)
- Help Assistant (usage guidance with flow initiation)
- OCR PII Redaction extension (redaction step after extraction, before cloud call)

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js ≥20)
**Primary Dependencies**: Vercel AI SDK (@ai-sdk/*), Ollama SDK, pgvector, @grammyjs/conversations, BullMQ, Redis, Zod, Pino
**Storage**: PostgreSQL with pgvector extension, Redis (sessions, drafts, conversation memory, BullMQ queues), file storage for processed documents
**Testing**: Vitest with 80%+ coverage requirement
**Target Platform**: Docker containers (Linux), Telegram Bot integration
**Project Type**: Layer 4 package (standalone ai-assistant package in monorepo). Note: Layer 4 refers to architectural package structure, while Phase 4 (constitutional) refers to implementation sequence.
**Performance Goals**: Fast Mode <5s typical query, Smart Mode <10s, 90% data entry parse accuracy, 90% voice transcription accuracy, briefings delivered within 60s (99% SLA), anomaly detection false-positive rate <10%
**Constraints**: No Arabic strings in source code (i18n-only), Config-First architecture, RBAC enforcement on all AI queries (via AdminScope from 001-platform-core), PII redaction for cloud models (including OCR extraction pipeline), emergency shutdown capability within 5 seconds, Prompt Injection Protection (sanitization before RBAC check), stable AI Toolkit signatures (packages/ai-assistant/src/toolkit/index.ts), Quota Response Signalling (X-RateLimit-* headers)
**Scale/Scope**: ~1,000 users, 17 entities, 3 operating modes, 3 cloud providers, 2 voice modes (STT/TTS), 6 built-in AI permission profiles

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Prerequisite Verification: Confirm 001-platform-core v0.1.0 tag exists AND 003-module-kit v0.2.0 tag exists before starting any 002-ai-assistant implementation. This satisfies Principle I (Platform-First).

### Principle Compliance

| Principle | Status | Notes |
|------------|----------|--------|
| I. Platform-First | PASS | Layer 1 & 2 (Core + Module Kit) already exist; this is Layer 4 |
| II. Config-First | PASS | AI settings configurable via bot; model selection via config; privacy rules per field; OCR provider configurable |
| III. Helper Reusability | PASS | AI Toolkit API exports shared services to all modules without duplication |
| IV. Test-First | PASS | Unit tests required before implementation; 80%+ coverage |
| V. Egyptian Business Context | PASS | Arabic-first with RTL, Egyptian formats supported; Business Knowledge Base for domain context |
| VI. Security & Privacy | PASS | PII redaction layer for cloud; local model gets full access; all interactions logged; AI Audit Trail; two-layer RBAC enforcement |
| VII. i18n-Only User Text | PASS | No Arabic in source code; all via .ftl locale files |
| VIII. Simplicity Over Cleverness | PASS | Start with local model only; add cloud review in Phase B; Training Mode is read-only background processing |
| IX. Monorepo Structure | PASS | packages/ai-assistant/ as standalone Layer 4 package; toolkit export for modules |
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
│   ├── document-analysis.openapi.yaml
│   ├── voice-service.openapi.yaml
│   ├── quota-management.openapi.yaml
│   ├── knowledge-base.openapi.yaml
│   └── audit-trail.openapi.yaml
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
│   │   ├── document-analysis.model.ts
│   │   ├── ai-permission-profile.model.ts
│   │   ├── ai-audit-trail.model.ts
│   │   ├── ai-feedback.model.ts
│   │   ├── ai-quota.model.ts
│   │   ├── emergency-shutdown-state.model.ts
│   │   ├── ai-health-status.model.ts
│   │   ├── business-knowledge-entry.model.ts
│   │   ├── anomaly-detection.model.ts
│   │   ├── data-validation-alert.model.ts
│   │   ├── briefing-job.model.ts
│   │   ├── approval-recommendation.model.ts
│   │   ├── onboarding-status.model.ts
│   │   └── voice-session.model.ts
│   ├── services/
│   │   ├── llm-client.service.ts      # Unified interface for local + cloud models
│   │   ├── rag.service.ts              # Vector search + context building (CRAG, Self-RAG)
│   │   ├── embedding.service.ts         # Generate embeddings
│   │   ├── privacy.service.ts          # PII redaction for cloud
│   │   ├── document-parser.service.ts  # Hybrid OCR (Gemini Vision + DeepSeek-OCR)
│   │   ├── voice.service.ts            # Whisper STT + TTS + Voice Export
│   │   ├── query.service.ts            # Natural language parsing
│   │   ├── report.service.ts           # Report generation + insights
│   │   ├── suggestion.service.ts       # Proactive pattern analysis
│   │   ├── permission-service.ts       # AI profile enforcement
│   │   ├── audit-service.ts            # Audit trail logging + export
│   │   ├── health-dashboard.service.ts # Health monitoring + quota tracking
│   │   ├── feedback-service.ts         # User feedback collection
│   │   ├── conversation-memory.service.ts # Redis-backed session context
│   │   ├── anomaly-detection.service.ts  # Statistical baseline + alerts
│   │   ├── data-validation.service.ts   # Pre-save cross-validation
│   │   ├── briefing-service.ts          # Scheduled briefings (BullMQ)
│   │   ├── approval-service.ts           # AI-assisted approval recommendations
│   │   ├── knowledge-base.service.ts     # Business knowledge CRUD
│   │   ├── onboarding.service.ts         # AI-assisted user onboarding
│   │   ├── module-indexer.service.ts    # Auto-index modules on registration
│   │   └── help-assistant.service.ts     # Usage guidance + flow initiation
│   ├── toolkit/                          # Exported to all modules
│   │   └── index.ts                     # Re-exports: OCR, RAG, voice, report, etc.
│   ├── handlers/
│   │   ├── ai-command.handler.ts       # /ai command
│   │   ├── voice.handler.ts            # Voice interaction
│   │   ├── report.handler.ts           # /report command
│   │   ├── settings.handler.ts         # /ai-settings command
│   │   ├── permission.handler.ts        # Permission profile management
│   │   ├── knowledge-base.handler.ts    # Business knowledge CRUD
│   │   ├── briefing.handler.ts         # Scheduled briefing configuration
│   │   └── help.handler.ts             # Usage guidance
│   ├── middleware/
│   │   ├── rbac-filter.middleware.ts   # Two-layer RBAC enforcement
│   │   ├── audit-logger.middleware.ts   # Log AI interactions
│   │   ├── confidence.middleware.ts     # Add confidence scores to responses
│   │   ├── permission-check.middleware.ts # AI profile enforcement
│   │   ├── input-sanitizer.middleware.ts # Prompt injection protection (runs before RBAC)
│   │   ├── quota-headers.middleware.ts   # X-RateLimit response headers
│   │   └── emergency-shutdown.middleware.ts # Emergency shutdown gate
│   ├── jobs/
│   │   ├── anomaly-detection.job.ts     # BullMQ job for anomaly detection
│   │   ├── briefing-delivery.job.ts    # BullMQ job for scheduled briefings
│   │   └── module-indexing.job.ts      # BullMQ job for module auto-indexing
│   ├── providers/
│   │   ├── ocr/
│   │   │   ├── base-provider.ts         # OCR provider interface
│   │   │   ├── gemini-vision.provider.ts
│   │   │   └── deepseek-ocr.provider.ts
│   │   └── llm/
│   │       ├── base-provider.ts         # LLM provider interface
│   │       ├── ollama.provider.ts       # Qwen2.5:7b
│   │       ├── gemini.provider.ts       # Cloud Gemini
│   │       ├── openai.provider.ts       # Cloud GPT
│   │       └── claude.provider.ts       # Cloud Claude
│   └── types/
│       ├── config.ts                    # AI configuration types
│       ├── modes.ts                     # Operating mode definitions
│       ├── permissions.ts               # Permission profile types
│       └── ocr-providers.ts             # OCR provider types
├── locales/
│   ├── ar.ftl
│   └── en.ftl
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   ├── middleware/
│   │   ├── providers/
│   │   └── jobs/
│   └── integration/
└── package.json

prisma/
└── schema/
    └── ai-assistant.prisma            # AI-specific tables (17 entities)
```

**Structure Decision**: The AI Assistant is a standalone Layer 4 package (`packages/ai-assistant/`) following the monorepo structure. This separation allows independent development and testing of AI capabilities while maintaining clean integration points with the Core (via handlers and services). AI-specific database tables are defined in `prisma/schema/ai-assistant.prisma` to keep them isolated from business logic tables. The `toolkit/` directory exports shared services that any module can import via `@al-saada/ai-assistant/toolkit` for OCR, RAG, voice, report generation, and other AI capabilities without duplicating code.

## Phase 0: Outline & Research

### Research Tasks

| Unknown / Decision | Status | Output |
|--------------------|----------|---------|
| Natural language parsing approach for Arabic data entry | RESOLVED | Use structured extraction from local LLM with schema-based prompt engineering |
| Best practices for Teacher-Student AI architecture | RESOLVED | Local first, cloud review only on low confidence or explicitly requested |
| pgvector integration with Prisma | RESOLVED | Use raw SQL queries with pgvector-specific functions |
| Hybrid OCR for Arabic documents | RESOLVED | Pluggable provider interface: Gemini Vision (primary) + DeepSeek-OCR (secondary) |
| Voice STT for Arabic | RESOLVED | OpenAI Whisper API (best Arabic support) with local Whisper alternative |
| Text-to-Speech for Arabic | RESOLVED | Google Cloud TTS (best Arabic pronunciation) as primary |
| CRAG and Self-RAG implementation | RESOLVED | Relevance evaluation before generation; self-evaluation during generation |
| AI Permission Profiles architecture | RESOLVED | Six built-in profiles + custom; two-layer enforcement (system role + AI profile) |
| Conversation Memory implementation | RESOLVED | Session-scoped, Redis-backed with TTL-based cleanup |
| Smart Anomaly Detection approach | RESOLVED | Statistical baseline modeling with auto-calibration via BullMQ |
| AI Data Validation strategy | RESOLVED | Pre-save cross-validation against historical averages; advisory only, never blocks |
| Scheduled Briefings implementation | RESOLVED | BullMQ cron jobs with configurable recipients and content scope |
| Module Auto-Indexing strategy | RESOLVED | Triggered by ModuleLoader registration; BullMQ background job processes locale files, config, schema |
| Emergency Shutdown implementation | RESOLVED | System-wide flag checked at entry points; graceful degradation with unavailable message |
| AI Health Dashboard + Quota Management | RESOLVED | Real-time dashboard via `/ai-health`; per-service quotas with alerts at 80% |

### Research Findings

See [research.md](./research.md) for detailed decisions and rationale covering all 17 new features.

## Phase 1: Design & Contracts

### Data Model

See [data-model.md](./data-model.md) for entity definitions, relationships, and validation rules.

### API Contracts

See `/contracts/` directory for OpenAPI specifications:
- `ai-service.openapi.yaml` — AI query and configuration endpoints
- `rag-service.openapi.yaml` — Vector search and embedding operations
- `document-analysis.openapi.yaml` — Document upload, processing, and extraction
- `voice-service.openapi.yaml` — STT, TTS, and voice export endpoints
- `quota-management.openapi.yaml` — Quota tracking and emergency shutdown
- `knowledge-base.openapi.yaml` — Business knowledge CRUD operations
- `audit-trail.openapi.yaml` — Audit log query and export

### Quickstart Guide

See [quickstart.md](./quickstart.md) for development setup and local testing.

### Agent Context Update

Agent context updated via `.specify/scripts/powershell/update-agent-context.ps1` (verified: script exists in repository). Run after Phase 1 completion: `pwsh .specify/scripts/powershell/update-agent-context.ps1`

New AI-specific technologies added (2026-03-10):
- Vercel AI SDK
- Ollama SDK (Qwen2.5:7b)
- pgvector extension
- Whisper (STT)
- Google Cloud TTS
- Gemini Vision API
- DeepSeek-OCR
- BullMQ (background jobs)
- Redis (sessions, drafts, conversation memory, queues)

## Complexity Tracking

No constitutional violations requiring justification. The implementation follows all architectural principles and phases defined in the constitution. The addition of 17 new features increases complexity but maintains separation of concerns through:
- Pluggable provider interfaces (OCR, LLM)
- Toolkit exports for module integration
- Background job isolation via BullMQ
- Two-layer RBAC enforcement for security
