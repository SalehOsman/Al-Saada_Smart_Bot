# Quickstart Guide: AI Assistant Development

**Feature**: 002-ai-assistant
**Date**: 2026-03-10
**Package**: `packages/ai-assistant`

## Prerequisites

### System Requirements
- Node.js ≥ 20
- Docker & Docker Compose (for local LLM, pgvector, Redis, BullMQ)
- PostgreSQL 16 with pgvector extension

### Monorepo Setup
This package is part of Al-Saada Smart Bot monorepo. Ensure:
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
# Start all AI infrastructure (Ollama, Redis, BullMQ, pgvector)
docker-compose -f docker-compose.ai.yml up -d

# Or start services individually
docker-compose up -d ollama pgvector redis bullmq

# Pull Qwen2.5:7b model for Arabic support
docker exec -it <ollama_container> ollama pull qwen2.5:7b
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

# OCR Configuration
OCR_PROVIDER=gemini_vision # gemini_vision | deepseek_ocr | auto

# Ollama (Local LLM)
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

# Background Jobs (BullMQ)
REDIS_URL=redis://localhost:6379

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
# Start test infrastructure
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
   - `/ai <question>` — Test Q&A with confidence scores
   - `/ai voice` — Enable voice mode
   - `/report daily` — Generate report with AI insights
   - `/ai-settings` — Configure AI, OCR provider, permissions
   - `/ai-health` — View health dashboard (SUPER_ADMIN only)
   - `/knowledge` — Manage business knowledge (SUPER_ADMIN only)
   - `/help <topic>` — Get usage guidance

## Service Architecture

### LLM Client Service (Teacher-Student Model)

```typescript
// packages/ai-assistant/src/services/llm-client.service.ts

import { generateText } from '@ai-sdk/core';

// Local model (always tried first)
const localResponse = await generateText({
  model: 'qwen2.5:7b',
  provider: 'ollama',
  prompt: userQuery,
  context: retrievedContext,
});

// Cloud review (in Smart Mode, only if confidence low)
if (mode === 'smart' && confidence < 0.85) {
  const cloudReview = await generateText({
    model: 'gemini-2.0-flash',
    provider: 'gemini',
    prompt: `Review and improve: ${localResponse}`,
    context: redactedContext, // Privacy layer applied
  });
}
```

### RAG Service with CRAG and Self-RAG

```typescript
// packages/ai-assistant/src/services/rag.service.ts

// 1. Generate embedding
const embedding = await embedText(userQuery);

// 2. Vector search with CRAG relevance filtering
const similarDocs = await db.$queryRaw`
  SELECT id, content,
    1 - (embedding <=> $1) as similarity
  FROM ai_embeddings
  WHERE rbac_scope @> $2
  ORDER BY similarity DESC
  LIMIT 10
`;

// 3. CRAG: Evaluate relevance before generation
const relevanceScores = await evaluateRelevance(userQuery, similarDocs);
const relevantDocs = similarDocs.filter((_, i) => relevanceScores[i] > 0.7);

// 4. Build context with Self-RAG quality checks
const context = await buildContextWithSelfRag(relevantDocs, userQuery);
```

### Hybrid OCR with Pluggable Providers

```typescript
// packages/ai-assistant/src/providers/ocr/gemini-vision.provider.ts

interface OCRProvider {
  name: string;
  processDocument(file: Buffer): Promise<OCRResult>;
  supportsTables: boolean;
}

// Primary: Gemini Vision
const geminiProvider = new GeminiVisionOCR();

// Fallback: DeepSeek-OCR
const deepseekProvider = new DeepSeekOCR();

// Auto-fallback on failure
async function processDocument(file: Buffer): Promise<OCRResult> {
  try {
    return await geminiProvider.processDocument(file);
  } catch (error) {
    console.warn('Gemini Vision failed, trying DeepSeek-OCR');
    return await deepseekProvider.processDocument(file);
  }
}
```

### Privacy Redaction Layer

```typescript
// packages/ai-assistant/src/services/privacy.service.ts

function redactContext(context: string, rules: PrivacyRule[]): string {
  let redacted = context;
  for (const rule of rules) {
    if (rule.fieldName === 'phone') {
      redacted = redacted.replace(/\d{11}/g, '[REDACTED_PHONE]');
    }
    if (rule.fieldName === 'national_id') {
      redacted = redacted.replace(/\d{14}/g, '[REDACTED_ID]');
    }
  }
  return redacted;
}
```

### Conversation Memory (Redis-backed)

```typescript
// packages/ai-assistant/src/services/conversation-memory.service.ts

async function getConversation(sessionId: string): Promise<Conversation> {
  const key = `conv:${sessionId}`;
  return await redis.get(key) || { messages: [], context: {} };
}

async function appendMessage(sessionId: string, message: Message) {
  const conv = await getConversation(sessionId);
  conv.messages.push(message);
  await redis.setex(key, 3600, conv); // 1 hour TTL
}

// Cleared on session end
async function clearConversation(sessionId: string) {
  await redis.del(`conv:${sessionId}`);
}
```

## New Features (2026-03-10)

### AI Permission Profiles

Two-layer RBAC enforcement:
1. System role (AdminScope from 001-platform-core)
2. AI permission profile (6 built-in + custom)

```typescript
const hasPermission = await checkAIPermission(userId, 'query_data');
// Checks: AdminScope → AIPermissionProfile → Capability
```

Built-in profiles:
- `FULL_ACCESS` — All AI capabilities (SUPER_ADMIN only, immutable)
- `DATA_ANALYST` — Cross-module reports, OCR, data queries
- `FINANCIAL_VIEWER` — Financial data access + reports
- `MODULE_QUERY` — Query assigned module data only (ADMIN default)
- `SELF_ONLY` — Own records only (EMPLOYEE default)
- `GUIDANCE_ONLY` — Usage guidance only, no data access (VISITOR only, immutable)

### Confidence Indicator

All AI responses include 0-100% confidence score:
- High (>85%): Green indicator + data source citation
- Medium (50-85%): Yellow indicator
- Low (<50%): Red warning + option to escalate to cloud

### Health Dashboard & Quota Management

`/ai-health` endpoint shows:
- Service status (operational/degraded/down)
- Response times and success rates
- Quota usage with alerts at 80%
- Emergency shutdown capability (within 5 seconds)

### Scheduled AI Briefings

Automated briefings via BullMQ cron jobs:
- Daily or weekly scheduling
- Content scope: activity summary, deadlines, anomalies, action items
- 99% SLA: delivered within 60 seconds

### Business Knowledge Base

SUPER_ADMIN can add domain-specific knowledge:
```bash
# Add knowledge entry
POST /knowledge-base
{
  "type": "price_range",
  "key": "diesel_price",
  "value": "10-13 EGP per liter"
}

# AI uses knowledge for validation and responses
```

### Smart Anomaly Detection

Statistical baseline modeling with auto-calibration:
- Detects unusual patterns without pre-configured thresholds
- False-positive rate <10% after 30-day calibration
- Alerts sent based on AdminScope
- Resolved anomalies trigger baseline update

## Debugging

### Enable AI Debug Logging

```typescript
// In .env
AI_DEBUG=true
AI_LOG_LEVEL=verbose
```

### View AI Interactions (Audit Trail)

```bash
# Query recent AI interactions
pnpm prisma studio
# Navigate to ai_audit_trail table

# Export audit logs via API
POST /ai-audit/export
{
  "format": "csv",
  "filters": {
    "startDate": "2026-03-01",
    "endDate": "2026-03-10"
  }
}
```

### Check Vector Search Results

```sql
-- Manually test vector similarity
SELECT id, content,
  1 - (embedding <=> '[...]') as similarity
FROM ai_embeddings
WHERE rbac_scope @> CURRENT_USER_SCOPE
ORDER BY similarity DESC
LIMIT 5;
```

### Monitor Background Jobs

```bash
# View BullMQ dashboard
pnpm --filter @al-saada/ai-assistant bullboard

# Check job status
GET /rag/jobs/{jobId}
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

### BullMQ Jobs Not Processing

```bash
# Check Redis connection
redis-cli ping

# View BullMQ job stats
redis-cli keys "bull:*"
```

## Contributing

When adding new AI features:

1. **Spec First**: Update `spec.md` with requirements
2. **Test First**: Write unit tests before implementation (80%+ coverage)
3. **i18n Only**: No Arabic in source code — use locale keys
4. **RBAC Aware**: All queries respect user role, AdminScope, and AI permission profile
5. **Privacy First**: Cloud model calls always go through privacy layer
6. **Toolkit First**: New services exportable via `@al-saada/ai-assistant/toolkit` for module integration
7. **Provider Pattern**: External services (OCR, LLM) use pluggable provider interface

## Next Steps

After quickstart setup:

1. Review [data-model.md](./data-model.md) for 17 entity definitions
2. Check API contracts in `/contracts/` directory:
   - `ai-service.openapi.yaml` — Core AI, permissions, briefings
   - `rag-service.openapi.yaml` — Vector search, CRAG, module indexing
   - `document-analysis.openapi.yaml` — Hybrid OCR
   - `voice-service.openapi.yaml` — STT, TTS, voice export
   - `quota-management.openapi.yaml` — Health, quotas, emergency shutdown
   - `knowledge-base.openapi.yaml` — Business knowledge CRUD
   - `audit-trail.openapi.yaml` — Audit log query and export
3. Run `/speckit.tasks` to generate implementation tasks
4. Run `/speckit.implement` to execute tasks
