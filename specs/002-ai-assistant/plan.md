# Implementation Plan: AI Operational Assistant (Layer 4) - Multi-Modal Hybrid Architecture

**Branch**: `004-ai-assistant`
**Date**: 2026-02-27
**Spec**: [spec.md](./spec.md)
**Constitution**: v2.0.0

## Summary

AI Operational Assistant implementation for Al-Saada Smart Bot — upgraded to **Multi-Modal Hybrid Architecture** supporting Text, Voice, Vision, and Document capabilities. The system now supports both local models (Ollama) and external APIs (Gemini, Claude, OpenAI) for maximum flexibility and cost control.

**Key Changes from previous version:**
- **NEW: AI Router Component** — Dynamically switches between Local/External providers
- **UPDATED: RAG Architecture** — Pure `pgvector` in PostgreSQL with local embeddings for data privacy
- **NEW: Context Redaction Layer** — Security layer with toggleable filters for external API usage
- **NEW: Document Parser & Voice Command** — Support for PDF/Excel/Image uploads with OCR and voice notes
- **UPDATED: Embedding Strategy** — All embeddings stored locally using `nomic-embed-text` (no external API calls for embeddings)
- **NEW: Multi-modal Support** — Voice commands, Image attachments, Document analysis capabilities

---

## Technical Context

**Language/Version**: Node.js ≥20 with TypeScript 5.x (strict mode)
**Primary Dependencies**: grammY 1.x, @grammyjs/conversations, @grammyjs/hydrate, Hono, Prisma, ioredis (Ollama), BullMQ, Pino, Zod, @grammyjs/i18n, nomic-embed-text, pgvector, dayjs, node-cron
**Storage**: PostgreSQL 16 with pgvector extension (primary), Redis 7 (cache/sessions)
**Testing**: Vitest with 80% coverage requirement
**Target Platform**: Linux server with Docker Compose
**Project Type**: Monorepo - ai-assistant package in packages/
**Performance Goals**: ~100 AI queries/hour initially, <5s p95 response time for local queries, API rate limits respected for external providers
**Constraints**: Arabic-first UI, data privacy (no data leaves infra), toggleable privacy filters
**Scale/Scope**: ~200 users initially, 4 RBAC roles, dynamic section/module system, multi-modal AI capabilities

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Note**: Constitution version v2.0.0 applies.

### Al-Saada Smart Bot Principle Checks

1. **Platform-First Principle**: Platform Core (Layer 1) + Flow Engine (Layer 2) must be 100% complete before AI Assistant (Layer 4) implementation.
2. **Config-Driven Architecture (Config-First, Code-When-Needed)**: Everything that can be configuration MUST be configuration, not code. Optional lifecycle hooks allowed for complex business logic.
3. **Data Privacy Principle**: NO user data should ever leave infrastructure. All embeddings stored locally. External APIs receive only anonymized/reduced context.
4. **Security & Privacy**: Context Redaction Layer protects sensitive data when using external AI providers. Toggleable filters give admins control.
5. **Simplicity Over Cleverness**: Start simple, add complexity only when proven necessary. YAGNI principle strictly enforced. Clear naming conventions (Arabic-friendly). Every file has a single clear purpose.

---

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [No violations - hybrid multi-modal architecture aligns with all principles] | [N/A] | [N/A] |

---

## Phase 0: Research & Technical Decisions

### Research Findings

**1. AI Provider Strategy (Updated)**
- **Decision**: Hybrid approach supporting both Local (Ollama/Qwen/Llama3) and External (OpenAI, Gemini, Claude)
- **Rationale**: Maximum flexibility for cost control, data privacy compliance, fallback to local if external APIs fail
- **Updated**: Provider switching now supports multiple external APIs with unified interface

**2. External API Integration (Updated)**
- **Decision**: Implement separate client for each provider with unified interface
- **Rationale**: Easy to add new providers, isolate provider-specific rate limits and errors
- **Updated**: Added Gemini and Claude clients alongside OpenAI

**3. Privacy Filter Architecture (New)**
- **Decision**: Context Redaction Layer before external API calls
- **Rationale**: Protects National ID, Phone Numbers, Company Data, Personal Names per spec requirements
- **Updated**: Toggleable filters stored per user in database

**4. Document Parser (New)**
- **Decision**: Support PDF/Excel/Image uploads with OCR and text extraction
- **Rationale**: Admins can upload company documents for AI analysis
- **Updated**: OCR processing (Tesseract/PaddleOCR) with Arabic text extraction

**5. Voice Command System (New)**
- **Decision**: Speech-to-Text (STT) layer for voice notes
- **Rationale**: Admins can send voice notes instead of typing
- **Updated**: Whisper API integration for local or external STT

**6. Router Pattern (Updated)**
- **Decision**: AI Router component with database-driven provider selection
- **Rationale**: Super Admin can switch providers without code changes, user preference persisted

**7. Embedding Storage (Confirmed)**
- **Decision**: All embeddings stored locally in pgvector, never sent to external APIs
- **Rationale**: Data privacy — no user data leaves infrastructure

---

## Phase 1: Data Model & Contracts

### Database Schema Extensions (Multi-Modal)

**NEW: AISettings Table**

```prisma
model AISettings {
  id           String   @id @default(cuid())
  userId        BigInt   @map("user_id")
  providerType  String   // 'local' | 'openai' | 'gemini' | 'claude'
  isActive     Boolean  @default(true) @map("is_active")

  @@unique([userId, providerType])
  @@index([userId])
  @@map("ai_settings")
}
```

**NEW: PrivacyFilter Table (Updated for Multi-Modal)**

```prisma
model PrivacyFilter {
  id           String   @id @default(cuid())
  userId        BigInt   @map("user_id")
  filterType    String   // 'national_id' | 'phone' | 'company' | 'personal_name' | 'voice_note' | 'file_upload'
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")

  @@unique([userId, filterType])
  @@index([userId])
  @@map("privacy_filters")
}
```

**UPDATED: Notification Model Changes**

Remove `title` and `message` fields — use only `params` JSONB per spec FR-AI-002:
```prisma
model Notification {
  id           String           @id @default(cuid())
  targetUserId BigInt           @map("target_user_id")
  type         NotificationType
  params       Json?    // i18n template parameters — no title/body fields per spec
  isRead       Boolean          @default(false) @map("is_read")
  createdAt    DateTime         @default(now()) @map("created_at")

  @@index([targetUserId])
  @@index([type])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}
```

**UPDATED: AuditLog Model Changes**

Change `action` from `String` to `AuditAction` enum for type safety:
```prisma
model AuditLog {
  id         String   @id @default(cuid())
  userId     BigInt   @map("user_id")
  action     AuditAction // Use enum type for safety
  targetType String?  @map("target_type") // Entity type (User, Section, Module, etc.)
  targetId   String?  @map("target_id") // Entity ID
  details    Json? // Additional context as JSON
  createdAt  DateTime @default(now()) @map("created_at")

  @@index([userId])
  @@index([action])
  @@index([createdAt])
  @@map("audit_logs")
}
```

**NEW: CompanyDoc Table**

```prisma
model CompanyDoc {
  id           String   @id @default(cuid())
  companyId    BigInt   @map("company_id")  // References User or HR record
  uploadedBy   BigInt   @map("uploaded_by")  // User or Admin who uploaded
  fileName     String   @map("file_name")
  fileType     String   // 'pdf' | 'excel' | 'image'
  filePath     String   @map("file_path")
  fileSize     Int      @map("file_size") // bytes
  extractedData Json?  // OCR results, extracted fields
  ocrText      String?  @map("ocr_text")  // Arabic text from images
  createdAt    DateTime @default(now()) @map("created_at")

  @@index([companyId])
  @@index([uploadedBy])
  @@map("company_docs")
}
```

---

## Phase 2: AI Services Implementation

### AI Router Component (T-AI-12) - Multi-Modal Support

**Purpose**: Dynamic provider switching based on user settings

- `getProvider()` — Reads `User.AI_PROVIDER` setting, returns current provider
- `switchProvider(provider)` — Updates `User.AI_PROVIDER`, applies to all queries
- Provider Interface — Unified interface for Ollama and External APIs
- `executeLLM(prompt, context, provider, options?)` — Routes to correct provider (Ollama or External API)
- `executeVoice(audio, provider)` — Routes to Whisper STT service (local or external)
- `executeVision(image, prompt, provider)` — Routes to GPT-4o Vision or Claude Vision for image analysis
- `executeDocument(file, options?)` — Routes to document parser for file uploads

### LLM Clients (T-AI-06, T-AI-13) - Updated

**Local: Ollama Client**
- `askLLM(prompt, context)` — Returns response from Ollama
- `askVoice(audio)` — Uses Ollama for STT (Speech-to-Text)

**External: Multiple Clients** (T-AI-13)
- `OpenAI Client` — GPT-4o text + DALL-E 3 images + GPT-4o Vision
- `Gemini Client` — Gemini 1.5 Flash (text + vision)
- `Claude Client` — Claude 3.7 Sonnet (text + vision)
- All external clients use Context Redaction Layer

### Embedding Service (T-AI-07) - Confirmed

- `embedText(text)` — Uses `nomic-embed-text` → stores in pgvector
- Local embeddings only — NO external API calls for embedding generation
- NEW: `getSimilarity(vector, topK)` — Similarity search in pgvector

### RAG Service (T-AI-08) - Updated

- `search(query, userId, role)` — Vector similarity search in pgvector
- NEW: `redactContext(context, userId, role)` — Applies privacy filters before external API calls
- RBAC integration — Filters search results based on user role

### Context Redaction Layer (T-AI-14) - New

**Privacy Filters Implementation**
- Filter types: `national_id`, `phone`, `company`, `personal_name`, `voice_note`, `file_upload`
- Tokenization: Replace sensitive values with `[TOKEN]` or `[REDACTED]` as placeholder
- Toggleable via Super Admin — `/ai-settings privacy-filters` command
- Filters active for SUPER_ADMIN, apply to ADMIN and EMPLOYEE only
- Local models (Ollama) receive full context without any filtering

### Document Parser (T-AI-15) - New

**Document Parser Service**
- `parsePDF(filePath)` — Extract text from PDFs using OCR (Tesseract/PaddleOCR)
- `parseImage(filePath)` — Extract text/data from images using OCR
- `extractData(fileContent)` — Extract structured data (phone numbers, names) from parsed documents
- OCR languages — Supports Arabic text extraction

### Voice Command System (T-AI-16) - New

**Voice Command Handler**
- `/voice-note` command — Admins/Super Admins send voice notes
- Uses Whisper API (local) or external STT server
- Converts audio to Arabic text
- Logs voice note in AuditLog with `VOICE_NOTE_SENT` action

### Bot Integration (T-AI-17) - Updated

- `/ai` command — Displays AI provider status and settings
- Privacy filter toggle — Super Admin can enable/disable specific filters
- Integration with Platform Core RBAC — Only SUPER_ADMIN can access privacy settings
- Multi-modal support — Handles voice notes, file uploads, image attachments

---

## Phase 3: Bot Integration

### Database Updates

- Add `voice_note` and `file_upload` to `PrivacyFilter.filterType` enum
- Update `CompanyDoc` table in Prisma schema
- Create migrations for new tables

---

## Constitution Re-check

*GATE: Must pass after Phase 1 design. ERROR if violations exist.*

### Verified Principles

✅ **Platform-First**: Platform Core (Layer 1) + Flow Engine (Layer 2) precedes AI Assistant (Layer 4)
✅ **Config-Driven Architecture**: Provider switching, privacy filters, multi-modal support via configuration
✅ **Egyptian Context**: Arabic UI maintained
✅ **Security & Privacy**: Context Redaction Layer, local embeddings, privacy filters
✅ **Data Privacy Principle**: NO user data leaves infrastructure
✅ **Simplicity Over Cleverness**: Standardized provider interface, multi-modal support
✅ **Monorepo Structure**: Clear separation in packages/ai-assistant/

---

## Post-Plan Additions (Tasks Added After Initial Plan)

| Task | Phase | Description | Reason Added |
|------|-------|-------------|--------------|
| T-AI-12 | 2 | AI Router component for multi-modal provider switching | Updated requirements |
| T-AI-13 | 2 | External API clients (OpenAI, Gemini, Claude) | Multi-modal support |
| T-AI-14 | 3 | Privacy Filters registration in Platform Core | Security layer requirement |
| T-AI-15 | 3 | Document Parser (PDF/OCR + Image extraction) | Multi-modal requirement |
| T-AI-16 | 3 | Voice Command Handler (STT + Whisper API) | Voice capability requirement |

---

## Next Steps

After plan approval:
1. Use `/speckit.implement` to execute the implementation plan
2. Use `/speckit.checklist` to create quality assurance checklist
