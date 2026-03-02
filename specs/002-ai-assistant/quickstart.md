# Quickstart Guide: AI Assistant Development

**Feature**: 002-ai-assistant
**Date**: 2026-03-02
**Package**: `packages/ai-assistant`

## Prerequisites

### System Requirements
- Node.js ≥ 20
- Docker & Docker Compose (for local LLM and pgvector)
- PostgreSQL 16 with pgvector extension

### Monorepo Setup
This package is part of the Al-Saada Smart Bot monorepo. Ensure:
- Core package (`packages/core`) is built
- Module Kit (`packages/module-kit`) is built

## Local Development Setup

### 1. Install Dependencies

```bash
# From monorepo root
pnpm install
```

### 2. Start Local AI Infrastructure

```bash
# Start Ollama with Qwen2.5:7b model
docker run -d -p 11434:11434 \
  -v ollama_data:/root/.ollama \
  ollama/ollama

# Pull the model
docker exec -it <ollama_container> ollama pull qwen2.5:7b

# Or use the docker-compose extension
docker-compose up -d ollama pgvector
```

### 3. Database Setup

Ensure PostgreSQL has pgvector extension:

```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

Run Prisma migrations:

```bash
pnpm prisma migrate dev
```

### 4. Environment Variables

Create `.env` in monorepo root:

```env
# AI Configuration
AI_MODE=fast              # fast | smart | training
AI_CLOUD_PROVIDER=gemini    # gemini | openai | claude

# Ollama (Local)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:7b

# Cloud Models (Optional)
OPENAI_API_KEY=sk-...
GEMINI_API_KEY=...
CLAUDE_API_KEY=sk-ant-...

# Voice Services (Optional)
WHISPER_API_KEY=...        # For STT
TTS_PROVIDER=google            # google | openai
GOOGLE_TTS_API_KEY=...

# Storage
DOCUMENTS_STORAGE_PATH=./storage/documents
AUDIO_STORAGE_PATH=./storage/audio
```

### 5. Start Development Server

```bash
# Terminal 1: Bot
pnpm --filter @al-saada/core dev

# Terminal 2: Watch AI package
pnpm --filter @al-saada/ai-assistant dev
```

## Testing Locally

### Unit Tests

```bash
pnpm --filter @al-saada/ai-assistant test
```

### Integration Tests

```bash
# Start test database
docker-compose -f docker-compose.test.yml up -d

# Run integration tests
pnpm --filter @al-saada/ai-assistant test:integration

# Cleanup
docker-compose -f docker-compose.test.yml down
```

### Manual Testing via Telegram

1. Create a test bot token via @BotFather
2. Set `BOT_TOKEN` in `.env`
3. Send commands:
   - `/ai <question>` — Test Q&A
   - `/ai voice` — Enable voice mode
   - `/report daily` — Generate report
   - `/ai-settings` — Configure AI

## Service Architecture

### LLM Client Service

```typescript
// packages/ai-assistant/src/services/llm-client.service.ts

import { generateText } from 'ai';

const response = await generateText({
  model: 'qwen2.5:7b',
  provider: 'ollama',
  prompt: userQuery,
  context: retrievedContext,
});
```

### RAG Service

```typescript
// packages/ai-assistant/src/services/rag.service.ts

// 1. Generate embedding
const embedding = await embedText(userQuery);

// 2. Vector search
const similarDocs = await db.$queryRaw`
  SELECT id, content, 1 - (embedding <=> $1) as similarity
  FROM ai_embeddings
  WHERE rbac_scope @> $2
  ORDER BY similarity DESC
  LIMIT 10
`;

// 3. Build context
const context = similarDocs.map(d => d.content).join('\n');
```

### Privacy Redaction

```typescript
// packages/ai-assistant/src/services/privacy.service.ts

function redactContext(context: string, rules: PrivacyRule[]): string {
  let redacted = context;
  for (const rule of rules) {
    if (rule.fieldName === 'phone') {
      redacted = redacted.replace(/\d{11}/g, '[REDACTED_PHONE]');
    }
  }
  return redacted;
}
```

## Debugging

### Enable AI Debug Logging

```typescript
// In .env
AI_DEBUG=true
AI_LOG_LEVEL=verbose
```

### View AI Interactions

```bash
# Query recent AI interactions
pnpm prisma studio
# Navigate to ai_interactions table
```

### Check Vector Search Results

```sql
-- Manually test vector similarity
SELECT id, content,
  1 - (embedding <=> '[...]') as similarity
FROM ai_embeddings
ORDER BY similarity DESC
LIMIT 5;
```

## Common Issues

### Ollama Connection Refused
```bash
# Check Ollama is running
curl http://localhost:11434/api/tags

# Restart container if needed
docker restart <ollama_container>
```

### pgvector Not Found
```sql
-- Install extension in PostgreSQL
CREATE EXTENSION vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Arabic Text Not Rendering
```bash
# Ensure fluent locales are loaded
pnpm --filter @al-saada/core build:locales

# Check .ftl files for Arabic keys
cat packages/ai-assistant/locales/ar.ftl
```

## Contributing

When adding new AI features:

1. **Spec First**: Update `spec.md` with requirements
2. **Test First**: Write unit tests before implementation
3. **i18n Only**: No Arabic in source code — use locale keys
4. **RBAC Aware**: All queries respect user role and AdminScope
5. **Privacy First**: Cloud model calls always go through privacy layer

## Next Steps

After quickstart setup:
1. Review [data-model.md](./data-model.md) for entity relationships
2. Check API contracts in `/contracts/` directory
3. Run `/speckit.tasks` to generate implementation tasks
4. Run `/speckit.implement` to execute tasks
