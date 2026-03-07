# Research Findings: AI Assistant - Comprehensive Operational Partner

**Feature**: 002-ai-assistant
**Date**: 2026-03-02
**Status**: Complete

## Natural Language Parsing for Arabic Data Entry

### Decision
Use structured extraction from local LLM (Qwen2.5:7b) with schema-based prompt engineering.

### Rationale
- Qwen2.5:7b has strong Arabic language understanding
- Schema-based prompts ensure consistent output format matching module field definitions
- Local processing preserves data privacy
- Fallback to step-by-step conversation when confidence is low

### Alternatives Considered
- **Pattern matching with regex**: Too rigid, cannot handle natural language variations
- **Cloud-only parsing**: Adds latency and data privacy concerns
- **Fine-tuned model**: Overkill for current scope; structured extraction is sufficient

## Teacher-Student AI Architecture

### Decision
Local-first architecture: Qwen2.5:7b (Ollama) handles all queries; cloud models (Gemini/GPT/Claude) review and refine only when needed.

### Rationale
- **Fast Mode (<5s)**: Local only — no network latency, full privacy
- **Smart Mode (5-10s)**: Local generates answer, cloud reviews and refines — balances speed and accuracy
- **Training Mode**: Cloud evaluates batch of local answers to improve RAG
- Reduces cloud API costs by ~70% (local handles most queries)
- Data never leaves infrastructure in Fast Mode

### Alternatives Considered
- **Cloud-only**: Higher latency, data privacy concerns, higher cost
- **No cloud review**: Lower accuracy on complex queries
- **Multi-local models**: Increased complexity without proportional benefit

## pgvector Integration with Prisma

### Decision
Use Prisma raw SQL queries with pgvector-specific functions for vector similarity search.

### Rationale
- Prisma has limited support for vector operations
- Raw SQL with pgvector functions (`<=>` operator, `cosine_distance`) is well-documented
- Embeddings stored locally with full RBAC enforcement

### Implementation Pattern
```sql
SELECT id, content,
  1 - (embedding <=> $1) as similarity
FROM ai_embeddings
WHERE rbac_scope @> CURRENT_USER_SCOPE
ORDER BY similarity DESC
LIMIT 10;
```

## Arabic OCR for Documents

### Decision
Tesseract OCR with Arabic language pack as primary, with PaddleOCR as fallback for complex documents.

### Rationale
- **Tesseract**: Open-source, locally runnable, good Arabic support
- **PaddleOCR**: Better accuracy for complex layouts, useful as fallback
- Both can run in Docker containers
- Local processing preserves privacy

### Alternatives Considered
- **Google Cloud Vision**: Accurate but sends data to cloud, privacy concern
- **Azure Form Recognizer**: Excellent but expensive
- **Cloud-only OCR**: Violates privacy-first principle

## Voice STT (Speech-to-Text) for Arabic

### Decision
OpenAI Whisper API as primary (best Arabic support), with local Whisper as backup.

### Rationale
- **Whisper**: Industry-leading accuracy for Arabic transcription
- OpenAI API: Best model (large-v3-turbo) with excellent Arabic
- Local Whisper: Fallback when API is unavailable or rate-limited
- Streaming API available for real-time feedback

### Alternatives Considered
- **Google STT**: Good but lower Arabic accuracy
- **Azure Speech**: Expensive, good Arabic but higher latency
- **Local-only**: Lower accuracy, especially for Arabic dialects

## Text-to-Speech (TTS) for Arabic

### Decision
Google Cloud TTS as primary (best Arabic pronunciation), with OpenAI TTS as fallback.

### Rationale
- **Google TTS**: Excellent Arabic pronunciation, natural-sounding
- **OpenAI TTS**: Good alternative, supports multiple voices
- Audio files cached locally to reduce API calls
- Optional feature — users can disable

### Alternatives Considered
- **Azure TTS**: Good quality but higher cost
- **Local TTS (espeak, etc.)**: Poor Arabic pronunciation
- **No TTS**: Less accessible, no hands-free operation

## Operating Mode Strategy

### Decision
Three configurable modes via `/ai-settings`:
1. **Fast**: Local only (2-5s response)
2. **Smart**: Local + cloud review (5-10s, more accurate)
3. **Training**: Background RAG improvement, cloud evaluates local answers

### Rationale
- Configurable by Super Admin per organizational needs
- Fast mode prioritizes privacy and speed
- Smart mode balances accuracy with efficiency
- Training mode improves system over time

## Privacy Redaction Layer

### Decision
Configurable per-field redaction before sending to cloud models, with `[REDACTED]` replacement.

### Rationale
- Local model gets full data (no filtering needed)
- Cloud model only receives redacted context
- Super Admin can configure which fields to redact
- Meets FR-041 and FR-042 requirements

### Filter Types
- National ID numbers
- Phone numbers
- Personal names (when sensitive)
- Company-specific identifiers
- Full address (partial allowed)

## Report Generation

### Decision
AI generates reports with template-based formatting; supports text, chart (image), and PDF output.

### Rationale
- Text: Simple message formatting for Telegram
- Chart: Chart.js for visual summaries
- PDF: PDFKit for downloadable reports
- AI adds insights (trends, anomalies) that humans might miss

### Implementation
- Template engine for consistent formatting
- Chart.js for visualizations (bar charts, line graphs)
- PDFKit for professional PDF output
- Scheduled reports via BullMQ + node-cron

## Proactive Business Suggestions

### Decision
Pattern analysis service runs on schedule (cron), detects anomalies via statistical analysis and rule-based thresholds.

### Rationale
- Background processing doesn't impact query latency
- Configurable sensitivity (thresholds)
- Sent to relevant admins based on AdminScope
- Reduces false positives via acknowledgment tracking

### Suggestion Types
1. **Attendance alerts**: Late arrivals, excessive absences
2. **Fuel/asset anomalies**: Unusual consumption, missing entries
3. **Budget alerts**: Expenses exceeding thresholds
4. **Compliance issues**: Required data not recorded

## Summary

All research decisions align with:
- Constitutional principles (Platform-First, Config-Driven, Privacy)
- Feature requirements (FR-001 through FR-048)
- Technology stack from constitution (Vercel AI SDK, Ollama, pgvector)

No NEEDS CLARIFICATION items remain. Ready for Phase 1 design.
