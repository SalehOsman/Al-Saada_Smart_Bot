# _Al-Saada_Smart_Bot Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-02

## Active Technologies

- TypeScript 5.x (Node.js ≥20) + Vercel AI SDK + Ollama SDK + pgvector (002-ai-assistant)
- grammY 1.x + @grammyjs/conversations + @grammyjs/hydrate + Hono (Core)

## Project Structure

```text
packages/
├── core/          # Platform Core (Layer 1)
├── module-kit/    # Module Kit (Layer 2)
├── ai-assistant/  # AI Assistant (Layer 4)
└── validators/    # Egyptian validation library

modules/            # All modules (config + conversations)
```

## Commands

```bash
# Build
pnpm build

# Test
pnpm test

# Lint
pnpm lint

# Type check
pnpm typecheck

# Prisma migrations
pnpm prisma migrate dev
```

## Code Style

- TypeScript strict mode
- No Arabic strings in source code (use .ftl locale files only)
- Zod for all input validation
- Pino for structured logging
- 80%+ test coverage required

## Recent Changes

- 002-ai-assistant: Added TypeScript 5.x + Vercel AI SDK + Ollama SDK + pgvector (AI Layer 4)
- 003-module-kit: Added Module Kit architecture with conversation helpers

<!-- MANUAL ADDITIONS START -->
## AI Assistant (Layer 4) - 002-ai-assistant

### Package Structure
```
packages/ai-assistant/
├── src/
│   ├── services/
│   │   ├── llm-client.service.ts      # Unified local + cloud models
│   │   ├── rag.service.ts              # Vector search (pgvector)
│   │   ├── embedding.service.ts         # nomic-embed-text
│   │   ├── privacy.service.ts          # PII redaction layer
│   │   ├── document-parser.service.ts    # OCR + data extraction
│   │   ├── voice.service.ts           # Whisper STT + TTS
│   │   ├── query.service.ts           # Natural language parsing
│   │   ├── report.service.ts          # Report generation
│   │   └── suggestion.service.ts      # Proactive suggestions
│   ├── handlers/
│   │   ├── ai-command.handler.ts       # /ai command
│   │   ├── voice.handler.ts           # Voice mode
│   │   ├── report.handler.ts          # /report command
│   │   └── settings.handler.ts        # /ai-settings command
│   ├── middleware/
│   │   ├── rbac-filter.middleware.ts   # RBAC enforcement
│   │   └── audit-logger.middleware.ts
│   └── models/
│       ├── ai-interaction.model.ts
│       ├── ai-suggestion.model.ts
│       ├── scheduled-report.model.ts
│       ├── privacy-rule.model.ts
│       ├── document-analysis.model.ts
│       └── voice-session.model.ts
├── locales/
│   ├── ar.ftl
│   └── en.ftl
└── tests/
```

### Key Technologies

| Technology | Purpose | Notes |
|------------|----------|--------|
| Vercel AI SDK | Unified LLM interface | Supports local (Ollama) + cloud (Gemini/GPT/Claude) |
| Ollama SDK | Local model inference | Qwen2.5:7b for Arabic support |
| nomic-embed-text | Embeddings | Local generation, no external API calls |
| pgvector | Vector database | PostgreSQL extension for similarity search |
| Whisper | Speech-to-Text | OpenAI Whisper API, Arabic STT |
| Google TTS | Text-to-Speech | Arabic pronunciation support |
| Tesseract | OCR | Document text extraction, Arabic language pack |

### Operating Modes

1. **Fast**: Local model only (2-5s response)
2. **Smart**: Local + cloud review (5-10s response)
3. **Training**: Background RAG improvement

### Privacy & Security

- **Local model**: Full data access, no filtering
- **Cloud models**: Context redaction layer (PII filtering)
- **RBAC**: All queries respect user role and AdminScope
- **Audit**: AI interactions logged (without question content)

### Integration Points

The AI Assistant integrates with Core via:
- Bot commands (`/ai`, `/ai-settings`, `/report`)
- Conversation handlers for natural language flows
- RAG queries against business data
- Privacy rules configuration (Super Admin only)
<!-- MANUAL ADDITIONS END -->
