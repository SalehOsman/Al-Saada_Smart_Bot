# _Al-Saada_Smart_Bot Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-02

## Active Technologies
- [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION] (001-section-hierarchy)
- [if applicable, e.g., PostgreSQL, CoreData, files or N/A] (001-section-hierarchy)

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
- 001-section-hierarchy: Added [e.g., Python 3.11, Swift 5.9, Rust 1.75 or NEEDS CLARIFICATION] + [e.g., FastAPI, UIKit, LLVM or NEEDS CLARIFICATION]

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

<!-- gitnexus:start -->
# GitNexus MCP

This project is indexed by GitNexus as **_Al-Saada_Smart_Bot** (353 symbols, 656 relationships, 16 execution flows).

## Always Start Here

1. **Read `gitnexus://repo/{name}/context`** — codebase overview + check index freshness
2. **Match your task to a skill below** and **read that skill file**
3. **Follow the skill's workflow and checklist**

> If step 1 warns the index is stale, run `npx gitnexus analyze` in the terminal first.

## Skills

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
