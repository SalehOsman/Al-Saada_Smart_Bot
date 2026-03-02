# Tasks: AI Assistant - Comprehensive Operational Partner

**Input**: Design documents from `/specs/002-ai-assistant/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/
**Feature Branch**: `002-ai-assistant`

**Tests**: This specification includes unit test tasks but excludes integration/E2E tests. Test tasks are explicitly labeled and can be skipped if not following TDD approach.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Package**: `packages/ai-assistant/` (Layer 4 monorepo package)
- **Database**: `prisma/schema/ai-assistant.prisma`
- **Tests**: `packages/ai-assistant/tests/unit/`
- **Locales**: `packages/ai-assistant/locales/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create packages/ai-assistant/ directory structure per implementation plan
- [ ] T002 Initialize TypeScript project with tsconfig.json for strict mode (Node.js ≥20)
- [ ] T003 [P] Create package.json with dependencies: @ai-sdk/core, @ai-sdk/openai, @ai-sdk/google, @ai-sdk/anthropic, ollama, pg, @grammyjs/conversations, zod, pino, tesseract.js, pdf-parse, @google-cloud/text-to-speech
- [ ] T004 [P] Setup Vitest testing configuration in packages/ai-assistant/vitest.config.ts
- [ ] T005 [P] Create ESLint and Prettier configuration files in packages/ai-assistant/
- [ ] T006 [P] Create locale files: packages/ai-assistant/locales/ar.ftl and packages/ai-assistant/locales/en.ftl
- [ ] T007 Create source directories: src/models/, src/services/, src/handlers/, src/middleware/, src/types/, tests/unit/
- [ ] T008 Create prisma/schema/ai-assistant.prisma file with base structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Schema

- [ ] T009 Define AIInteraction model in prisma/schema/ai-assistant.prisma
- [ ] T010 [P] Define AISuggestion model in prisma/schema/ai-assistant.prisma
- [ ] T011 [P] Define ScheduledReport model in prisma/schema/ai-assistant.prisma
- [ ] T012 [P] Define PrivacyRule model in prisma/schema/ai-assistant.prisma
- [ ] T013 [P] Define DocumentAnalysis model in prisma/schema/ai-assistant.prisma
- [ ] T014 [P] Define VoiceSession model in prisma/schema/ai-assistant.prisma
- [ ] T015 Define AIConfig model in prisma/schema/ai-assistant.prisma
- [ ] T016 Define pgvector extension and embedding table structure in prisma/schema/ai-assistant.prisma

### Type Definitions

- [ ] T017 Create src/types/config.ts with AIConfig, OperatingMode, CloudProvider types
- [ ] T018 Create src/types/modes.ts with FastMode, SmartMode, TrainingMode definitions
- [ ] T019 Create src/types/ai.ts with QueryRequest, QueryResponse, DataEntryParseResult types

### Base Services

- [ ] T020 Implement LLMClientService in packages/ai-assistant/src/services/llm-client.service.ts (Vercel AI SDK + Ollama integration)
- [ ] T021 [P] Implement EmbeddingService in packages/ai-assistant/src/services/embedding.service.ts (nomic-embed-text via Ollama)
- [ ] T022 [P] Implement PrivacyService in packages/ai-assistant/src/services/privacy.service.ts (PII redaction layer)
- [ ] T023 Implement AuditLoggerMiddleware in packages/ai-assistant/src/middleware/audit-logger.middleware.ts
- [ ] T024 [P] Implement RbacFilterMiddleware in packages/ai-assistant/src/middleware/rbac-filter.middleware.ts

### Prisma Integration

- [ ] T025 Create Prisma client extension for pgvector operations in packages/ai-assistant/src/services/prisma-pgvector.service.ts
- [ ] T026 Run prisma migrate dev to create AI assistant tables

### Unit Tests (Foundational)

- [ ] T027 [P] Test LLMClientService local model inference in tests/unit/services/llm-client.service.test.ts
- [ ] T028 [P] Test EmbeddingService vector generation in tests/unit/services/embedding.service.test.ts
- [ ] T029 [P] Test PrivacyService redaction logic in tests/unit/services/privacy.service.test.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Natural Language Data Entry (Priority: P1) 🎯 MVP

**Goal**: Parse natural language Arabic input and extract structured data for module data entry

**Independent Test**: Record a fuel entry via natural language "سجّل 500 لتر سولار للشاحنة أ ب ج 1234" and verify data is correctly saved with confirmation

### Models

- [ ] T030 [P] [US1] Create AIInteraction.model.ts in packages/ai-assistant/src/models/ai-interaction.model.ts with tracking for data entry operations

### Services

- [ ] T031 [P] [US1] Implement QueryService in packages/ai-assistant/src/services/query.service.ts (natural language parsing logic per FR-001 — QueryService is implementation of 'natural language parsing' requirement)
- [ ] T032 [US1] Implement RAGService in packages/ai-assistant/src/services/rag.service.ts (vector search + context building) — use pgvector cosine distance operator for similarity search: ORDER BY embedding <=> $1 ASC LIMIT k. Reference research.md pgvector patterns for raw SQL integration via Prisma.$queryRaw.
- [ ] T033 [US1] Integrate QueryService with RAGService for data entry schema mapping in packages/ai-assistant/src/services/query.service.ts

### Handlers

- [ ] T034 [US1] Implement AICommandHandler in packages/ai-assistant/src/handlers/ai-command.handler.ts (/ai command for data entry)
- [ ] T035 [US1] Add data entry confirmation flow in packages/ai-assistant/src/handlers/ai-command.handler.ts
- [ ] T036 [US1] Add fallback to step-by-step conversation in packages/ai-assistant/src/handlers/ai-command.handler.ts

### Bot Integration

- [ ] T037 [US1] Register /ai command in packages/core/src/bot.ts with AICommandHandler
- [ ] T038 [US1] Wire LLMClientService with QueryService in packages/ai-assistant/src/handlers/ai-command.handler.ts

### Locale

- [ ] T039 [US1] Add Arabic locale keys for data entry in packages/ai-assistant/locales/ar.ftl
- [ ] T040 [US1] Add English locale keys for data entry in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T041 [P] [US1] Test QueryService parsing accuracy in tests/unit/services/query.service.test.ts
- [ ] T042 [P] [US1] Test RAGService similarity search in tests/unit/services/rag.service.test.ts
- [ ] T043 [P] [US1] Test AICommandHandler confirmation flow in tests/unit/handlers/ai-command.handler.test.ts

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Natural Language Data Querying (Priority: P1) 🎯 MVP

**Goal**: Answer natural language Arabic questions about business data with RBAC enforcement

**Independent Test**: Ask "كم لتر سولار استهلكنا هذا الشهر؟" and verify accurate Arabic response respecting user permissions

### Services

- [ ] T044 [P] [US2] Extend QueryService for question-answering in packages/ai-assistant/src/services/query.service.ts
- [ ] T045 [US2] Extend RAGService with RBAC filtering in packages/ai-assistant/src/services/rag.service.ts

### Handlers

- [ ] T046 [US2] Extend AICommandHandler for Q&A in packages/ai-assistant/src/handlers/ai-command.handler.ts
- [ ] T047 [US2] Add RBAC enforcement to query responses in packages/ai-assistant/src/handlers/ai-command.handler.ts

### Middleware

- [ ] T048 [US2] Integrate RbacFilterMiddleware in AICommandHandler in packages/ai-assistant/src/handlers/ai-command.handler.ts

### Locale

- [ ] T049 [US2] Add Arabic locale keys for Q&A responses in packages/ai-assistant/locales/ar.ftl
- [ ] T050 [US2] Add English locale keys for Q&A responses in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T051 [P] [US2] Test QueryService Q&A accuracy in tests/unit/services/query.service.test.ts
- [ ] T052 [P] [US2] Test RBAC filtering in tests/unit/services/rag.service.test.ts
- [ ] T053 [P] [US2] Test ambiguous query handling in tests/unit/handlers/ai-command.handler.test.ts

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Smart Report Generation (Priority: P2)

**Goal**: Generate reports on demand with AI-generated insights

**Independent Test**: Generate "/report daily" report and verify it contains accurate metrics, proper formatting, and relevant insights

### Models

- [ ] T054 [P] [US3] Create ScheduledReport.model.ts in packages/ai-assistant/src/models/scheduled-report.model.ts

### Services

- [ ] T055 [P] [US3] Implement ReportService in packages/ai-assistant/src/services/report.service.ts
- [ ] T055B [US3] Add topic-specific report filtering to ReportService in packages/ai-assistant/src/services/report.service.ts — implement topic parameter (e.g., 'sales', 'fuel', 'expenses') that filters data by module/section before generating report. Per FR-014. Used by /report [period] [topic] command.
- [ ] T056 [US3] Add AI insight generation to ReportService in packages/ai-assistant/src/services/report.service.ts

### Handlers

- [ ] T057 [US3] Implement ReportHandler in packages/ai-assistant/src/handlers/report.handler.ts (/report [period] [topic] command — parses period (daily/weekly/monthly) and optional topic parameter for FR-013 and FR-014)
- [ ] T058 [US3] Add report formatting (text, image, PDF) in packages/ai-assistant/src/handlers/report.handler.ts

### Scheduled Reports

- [ ] T059 [US3] Implement scheduled report cron job in packages/ai-assistant/src/services/report.service.ts
- [ ] T060 [US3] Add BullMQ queue for async report generation in packages/ai-assistant/src/services/report.service.ts

### Locale

- [ ] T061 [US3] Add Arabic locale keys for reports in packages/ai-assistant/locales/ar.ftl
- [ ] T062 [US3] Add English locale keys for reports in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T063 [P] [US3] Test ReportService generation in tests/unit/services/report.service.test.ts
- [ ] T064 [P] [US3] Test AI insight accuracy in tests/unit/services/report.service.test.ts
- [ ] T065 [P] [US3] Test ReportHandler command parsing in tests/unit/handlers/report.handler.test.ts

**Checkpoint**: All P1 and P2 core stories should now be functional

---

## Phase 6: User Story 4 - Proactive Business Suggestions (Priority: P2)

**Goal**: Analyze patterns and send targeted suggestions to relevant admins

**Independent Test**: Trigger a pattern (e.g., employee late arrivals) and verify suggestion is sent to correct admin with actionable content

### Models

- [ ] T066 [P] [US4] Create AISuggestion.model.ts in packages/ai-assistant/src/models/ai-suggestion.model.ts

### Services

- [ ] T067 [P] [US4] Implement SuggestionService in packages/ai-assistant/src/services/suggestion.service.ts
- [ ] T068 [US4] Add pattern analysis logic to SuggestionService in packages/ai-assistant/src/services/suggestion.service.ts (covers FR-019 pattern analysis, FR-020 threshold-based triggers, FR-022 configurable frequency/sensitivity, FR-023 actionable content)
- [ ] T069 [US4] Add suggestion routing based on AdminScope in packages/ai-assistant/src/services/suggestion.service.ts

### Background Processing

- [ ] T070 [US4] Implement cron job for pattern analysis in packages/ai-assistant/src/services/suggestion.service.ts
- [ ] T071 [US4] Add duplicate suggestion prevention in packages/ai-assistant/src/services/suggestion.service.ts (covers FR-024 acknowledgment tracking and duplicate prevention)

### Handlers

- [ ] T072 [US4] Add suggestion acknowledgment handler in packages/ai-assistant/src/handlers/ai-command.handler.ts

### Locale

- [ ] T073 [US4] Add Arabic locale keys for suggestions in packages/ai-assistant/locales/ar.ftl
- [ ] T074 [US4] Add English locale keys for suggestions in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T075 [P] [US4] Test SuggestionService pattern detection in tests/unit/services/suggestion.service.test.ts
- [ ] T076 [P] [US4] Test AdminScope routing in tests/unit/services/suggestion.service.test.ts
- [ ] T077 [P] [US4] Test duplicate prevention in tests/unit/services/suggestion.service.test.ts

**Checkpoint**: Proactive suggestions now functional

---

## Phase 7: User Story 5 - Document Analysis and Data Extraction (Priority: P2)

**Goal**: Parse uploaded documents, extract structured data, and enable document Q&A

**Independent Test**: Upload invoice image and verify accurate data extraction with option to save as expense

### Models

- [ ] T078 [P] [US5] Create DocumentAnalysis.model.ts in packages/ai-assistant/src/models/document-analysis.model.ts

### Services

- [ ] T079 [P] [US5] Implement DocumentParserService in packages/ai-assistant/src/services/document-parser.service.ts
- [ ] T080 [US5] Add Tesseract OCR integration for Arabic in packages/ai-assistant/src/services/document-parser.service.ts
- [ ] T081 [US5] Add structured data extraction logic in packages/ai-assistant/src/services/document-parser.service.ts
- [ ] T082 [US5] Add PDF parsing support in packages/ai-assistant/src/services/document-parser.service.ts

### Handlers

- [ ] T083 [US5] Implement document upload handler in packages/ai-assistant/src/handlers/document.handler.ts
- [ ] T084 [US5] Add document Q&A handler in packages/ai-assistant/src/handlers/document.handler.ts
- [ ] T085 [US5] Add save-to-module integration in packages/ai-assistant/src/handlers/document.handler.ts

### File Storage

- [ ] T086 [US5] Implement file upload validation (size 25MB max, 500 pages PDF) in packages/ai-assistant/src/services/document-parser.service.ts
- [ ] T087 [US5] Add file storage integration in packages/ai-assistant/src/services/document-parser.service.ts

### Locale

- [ ] T088 [US5] Add Arabic locale keys for documents in packages/ai-assistant/locales/ar.ftl
- [ ] T089 [US5] Add English locale keys for documents in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T090 [P] [US5] Test DocumentParserService OCR accuracy in tests/unit/services/document-parser.service.test.ts
- [ ] T091 [P] [US5] Test data extraction accuracy in tests/unit/services/document-parser.service.test.ts
- [ ] T092 [P] [US5] Test file validation in tests/unit/handlers/document.handler.test.ts

**Checkpoint**: Document analysis now functional

---

## Phase 8: User Story 6 - Voice Interaction (Priority: P3)

**Goal**: Enable voice input for queries and commands with optional TTS

**Independent Test**: Enable voice mode, speak Arabic query, and verify accurate transcription and response

### Models

- [ ] T093 [P] [US6] Create VoiceSession.model.ts in packages/ai-assistant/src/models/voice-session.model.ts

### Services

- [ ] T094 [P] [US6] Implement VoiceService in packages/ai-assistant/src/services/voice.service.ts
- [ ] T095 [US6] Add Whisper STT integration (OpenAI API + local fallback) in packages/ai-assistant/src/services/voice.service.ts
- [ ] T096 [US6] Add Google TTS integration for Arabic in packages/ai-assistant/src/services/voice.service.ts
- [ ] T097 [US6] Add audio caching to reduce API calls in packages/ai-assistant/src/services/voice.service.ts

### Handlers

- [ ] T098 [US6] Implement VoiceHandler in packages/ai-assistant/src/handlers/voice.handler.ts
- [ ] T099 [US6] Add voice mode toggle in packages/ai-assistant/src/handlers/voice.handler.ts
- [ ] T100 [US6] Integrate VoiceHandler with AICommandHandler in packages/ai-assistant/src/handlers/voice.handler.ts

### Locale

- [ ] T101 [US6] Add Arabic locale keys for voice in packages/ai-assistant/locales/ar.ftl
- [ ] T102 [US6] Add English locale keys for voice in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T103 [P] [US6] Test VoiceService transcription in tests/unit/services/voice.service.test.ts
- [ ] T104 [P] [US6] Test TTS generation in tests/unit/services/voice.service.test.ts
- [ ] T105 [P] [US6] Test VoiceHandler mode toggling in tests/unit/handlers/voice.handler.test.ts

**Checkpoint**: Voice interaction now functional

---

## Phase 9: User Story 7 - AI Settings and Configuration (Priority: P3)

**Goal**: Allow Super Admins to configure AI modes, providers, privacy, and schedules

**Independent Test**: Access settings, change operating mode, and verify behavior changes

### Models

- [ ] T106 [P] [US7] Create PrivacyRule.model.ts in packages/ai-assistant/src/models/privacy-rule.model.ts

### Services

- [ ] T107 [P] [US7] Extend PrivacyService for per-field redaction in packages/ai-assistant/src/services/privacy.service.ts
- [ ] T108 [US7] Add settings persistence in packages/ai-assistant/src/services/privacy.service.ts

### Handlers

- [ ] T109 [US7] Implement SettingsHandler in packages/ai-assistant/src/handlers/settings.handler.ts (/ai-settings command)
- [ ] T110 [US7] Add operating mode configuration in packages/ai-assistant/src/handlers/settings.handler.ts
- [ ] T111 [US7] Add cloud provider selection in packages/ai-assistant/src/handlers/settings.handler.ts
- [ ] T112 [US7] Add privacy filter configuration in packages/ai-assistant/src/handlers/settings.handler.ts
- [ ] T113 [US7] Add scheduled report configuration in packages/ai-assistant/src/handlers/settings.handler.ts

### RBAC

- [ ] T114 [US7] Add SUPER_ADMIN only access to settings in packages/ai-assistant/src/handlers/settings.handler.ts

### Locale

- [ ] T115 [US7] Add Arabic locale keys for settings in packages/ai-assistant/locales/ar.ftl
- [ ] T116 [US7] Add English locale keys for settings in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T117 [P] [US7] Test SettingsHandler configuration in tests/unit/handlers/settings.handler.test.ts
- [ ] T118 [P] [US7] Test PrivacyService redaction in tests/unit/services/privacy.service.test.ts
- [ ] T119 [P] [US7] Test RBAC enforcement in tests/unit/handlers/settings.handler.test.ts

**Checkpoint**: AI configuration now functional

---

## Phase 10: User Story 8 - AI-Powered Module Wizard (Priority: P3)

**Goal**: Provide AI-guided module creation, code review, and scaffolding

**Independent Test**: Create new module using /ai create-module with AI guidance, then review with /ai review-module

### Services

- [ ] T120 [P] [US8] Implement ModuleWizardService in packages/ai-assistant/src/services/module-wizard.service.ts
- [ ] T121 [US8] Add interactive module creation flow in packages/ai-assistant/src/services/module-wizard.service.ts
- [ ] T122 [US8] Add Module Contract validation logic in packages/ai-assistant/src/services/module-wizard.service.ts
- [ ] T123 [US8] Add module scaffolding generation in packages/ai-assistant/src/services/module-wizard.service.ts

### Handlers

- [ ] T124 [US8] Implement /ai create-module handler in packages/ai-assistant/src/handlers/ai-command.handler.ts — implement subcommand routing in ai-command.handler.ts, parse /ai subcommands (create-module, review-module, query) and route to appropriate handler function, default to query mode for plain /ai input
- [ ] T125 [US8] Implement /ai review-module <slug> handler in packages/ai-assistant/src/handlers/ai-command.handler.ts

### CLI Integration

- [ ] T126 [US8] Add module:validate <slug> CLI command in packages/module-kit/src/cli.ts

### Locale

- [ ] T127 [US8] Add Arabic locale keys for module wizard in packages/ai-assistant/locales/ar.ftl
- [ ] T128 [US8] Add English locale keys for module wizard in packages/ai-assistant/locales/en.ftl

### Unit Tests

- [ ] T129 [P] [US8] Test ModuleWizardService scaffolding in tests/unit/services/module-wizard.service.test.ts
- [ ] T130 [P] [US8] Test Module Contract validation in tests/unit/services/module-wizard.service.test.ts

**Checkpoint**: Module wizard now functional

---

## Phase 11: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

### Cloud Model Integration

- [ ] T131 [P] Add Gemini integration to LLMClientService in packages/ai-assistant/src/services/llm-client.service.ts
- [ ] T132 [P] Add GPT integration to LLMClientService in packages/ai-assistant/src/services/llm-client.service.ts
- [ ] T133 [P] Add Claude integration to LLMClientService in packages/ai-assistant/src/services/llm-client.service.ts
- [ ] T134 Implement Smart Mode (local + cloud review) in packages/ai-assistant/src/services/llm-client.service.ts — local model processes query first. If confidence score >= threshold (configurable, default 0.8), return local answer directly without cloud review. If confidence < threshold, send to cloud model for review and refinement. On cloud failure, fall back to local answer (graceful degradation per NFR-009).

### Rate Limiting

- [ ] T135 Implement role-based rate limiting middleware in packages/ai-assistant/src/middleware/rate-limit.middleware.ts
- [ ] T136 Add rate limit quotas (200/150/100/50 per minute) in packages/ai-assistant/src/middleware/rate-limit.middleware.ts

### Observability

- [ ] T137 [P] Add structured logging with Pino in packages/ai-assistant/src/services/
- [ ] T138 [P] Add query latency tracking (P50, P95, P99) in packages/ai-assistant/src/services/llm-client.service.ts
- [ ] T138B [P] Implement model performance metrics tracking (accuracy rates, timeout rates, fallback frequency) in packages/ai-assistant/src/services/llm-client.service.ts — per NFR-012. Log metrics via Pino and expose via health check endpoint.
- [ ] T139 [P] Add error logging with correlation IDs in packages/ai-assistant/src/middleware/

### Training Mode

- [ ] T140 Implement Training Mode (background RAG improvement) in packages/ai-assistant/src/services/llm-client.service.ts
- [ ] T141 Add batch evaluation of local model answers in packages/ai-assistant/src/services/llm-client.service.ts
- [ ] T142 [US8] Implement startup RAG embedding generation from Module Kit documentation (FR-052 coverage) in packages/ai-assistant/src/services/embedding.service.ts — at service startup, generate embeddings from docs/module-development-guide.md and packages/module-kit/src/**/*.ts source files. Store in pgvector for AI Wizard queries.

### Documentation

- [ ] T143 Update CLAUDE.md with AI Assistant technologies and integration points
- [ ] T144 [P] Update docs/module-development-guide.md with AI Wizard usage
- [ ] T145 [P] Add inline JSDoc comments to all services in packages/ai-assistant/src/services/

### Security

- [ ] T146 Validate cloud API credentials before saving configuration in packages/ai-assistant/src/handlers/settings.handler.ts
- [ ] T147 Add input validation with Zod for all handlers in packages/ai-assistant/src/handlers/
- [ ] T148 Ensure no question content stored in AIInteraction per FR-043
- [ ] T148B Implement retention cleanup cron job in packages/ai-assistant/src/services/retention.service.ts — delete expired AIInteraction logs and DocumentAnalysis records based on configurable retention periods (NFR-013, NFR-014, NFR-015). Run daily via node-cron.

### Final Tests

- [ ] T149 Run all unit tests and ensure 80%+ coverage in packages/ai-assistant/tests/
- [ ] T150 Run type checking across all packages
- [ ] T151 Run quickstart.md validation from specs/002-ai-assistant/quickstart.md

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-10)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Phase 11)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational - No dependencies on other stories
- **User Story 2 (P1)**: Can start after Foundational - Shares QueryService and RAGService with US1
- **User Story 3 (P2)**: Can start after Foundational - Uses separate ReportService
- **User Story 4 (P2)**: Can start after Foundational - Uses separate SuggestionService
- **User Story 5 (P2)**: Can start after Foundational - Uses separate DocumentParserService
- **User Story 6 (P3)**: Can start after Foundational - Uses separate VoiceService
- **User Story 7 (P3)**: Can start after Foundational - Uses extended PrivacyService
- **User Story 8 (P3)**: Can start after Foundational - Uses separate ModuleWizardService

### Within Each User Story

- Models before services (or in parallel)
- Services before handlers
- Handlers before bot integration
- Core implementation before locale integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational models T009-T015 can run in parallel
- All Foundational services T021-T022 can run in parallel
- All Foundational unit tests T027-T029 can run in parallel
- Within each user story, models marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members
- All locale tasks within a story can run in parallel with implementation
- Cloud model integrations T131-T133 can run in parallel
- Observability tasks T137-T139 can run in parallel

---

## Parallel Example: User Story 1

```bash
# Launch all models for User Story 1 together:
Task: "Create AIInteraction.model.ts in packages/ai-assistant/src/models/ai-interaction.model.ts"

# Launch core services for User Story 1:
Task: "Implement QueryService in packages/ai-assistant/src/services/query.service.ts"
Task: "Implement RAGService in packages/ai-assistant/src/services/rag.service.ts"

# Launch unit tests for User Story 1 together:
Task: "Test QueryService parsing accuracy in tests/unit/services/query.service.test.ts"
Task: "Test RAGService similarity search in tests/unit/services/rag.service.test.ts"
Task: "Test AICommandHandler confirmation flow in tests/unit/handlers/ai-command.handler.test.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1-2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1 (Natural Language Data Entry)
4. Complete Phase 4: User Story 2 (Natural Language Querying)
5. **STOP and VALIDATE**: Test both stories independently
6. Deploy/demo if ready

### Incremental Delivery (All P1 & P2 Stories)

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Each story adds value without breaking previous stories

### Full Delivery (All Stories)

Follow P1 → P2 → P3 order after MVP:
1. User Stories 1-2 (P1) - Core AI interactions
2. User Stories 3-5 (P2) - Reports, suggestions, documents
3. User Stories 6-8 (P3) - Voice, settings, module wizard
4. Polish and cross-cutting concerns

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1 + User Story 2 (P1)
   - Developer B: User Story 3 + User Story 4 (P2)
   - Developer C: User Story 5 (P2) + Document Analysis
3. Later phase:
   - Developer A: User Story 6 (Voice)
   - Developer B: User Story 7 (Settings) + User Story 8 (Module Wizard)
   - Developer C: Polish tasks
4. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Unit tests are included; integration/E2E tests excluded
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
- Local model (Qwen2.5:7b via Ollama) must be installed before testing AI features
- PostgreSQL with pgvector extension required for RAG functionality
