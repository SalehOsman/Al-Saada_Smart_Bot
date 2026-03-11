# AI Assistant Roadmap & Architecture

**Last Updated:** 2026-03-11

The AI Assistant transforms the Al-Saada Smart Bot from a reactive tool to a proactive operational partner. It acts as "Layer 4" within the platform architecture, standing atop the Platform Core and Module Kit.

---

## 1. Vision & Core Capabilities

The objective of the AI Assistant is to abstract away complex UI navigation and reporting interfaces, allowing natural interaction with the system using Arabic text and voice, while ensuring rigorous security and compliance.

### Primary Capabilities (26 User Stories)
- **Natural Language Input & Queries (P1):** Seamless conversational data entry and Arabic Q&A querying mapped safely via RBAC.
- **Data Validation & Suggestions (P1/P2):** Pre-save advisory constraints cross-validation against business context and proactive algorithmic anomaly alerts (e.g., repeated lateness).
- **Document Analysis & Hybrid OCR (P2):** Automatic data extraction from uploads via pluggable providers (Gemini Vision + DeepSeek-OCR) combined with document-specific Q&A.
- **Smart Reports & Executive Briefings (P2):** Generation of scheduled or ad-hoc reports dynamically infused with predictive insights highlighting trends.
- **AI Permission Profiles & Auditing (P1):** 6 configurable profiles (from GUIDANCE_ONLY to FULL_ACCESS) governing capabilities, actively documented in a filterable AI Audit Trail.
- **Voice Interaction & Export (P3):** Hands-free operation using Whisper STT/Google TTS, and voice-commanded data export to Telegram/Email.
- **Health, Quota, & Cost Control (P3):** Hard rate-limits (X-RateLimit headers), real-time service dashboards, and emergency shutdown mechanisms.
- **RAG Quality Patterns (P2):** Implementation of Corrective RAG (CRAG) and Self-RAG evaluations for maximum answer fidelity.
- **AI Toolkit APIs (P2):** Shared typed interfaces for integrations across Layer 3 modules (`@al-saada/ai-assistant/toolkit`).
- **Module Developer Wizard (P3):** AI-paired Module Generation via `/ai create-module` with automatic contract alignment.

---

## 2. Technology Stack & Choices

The AI infrastructure is designed fundamentally around **security and compliance first**, implementing a Teacher-Student architecture utilizing both Local execution and Cloud fallback.

### Dependencies
- **Vercel AI SDK (`@ai-sdk/*`)**: Unified library bridging local APIs to cloud execution gracefully.
- **Ollama (`qwen2.5:7b`)**: The local resident engine.
- **PostgreSQL (`pgvector`)**: Foundation for embeddings and fast semantic searches (RAG context).
- **Whisper API**: Used for STT transcription (optimized specifically for Arabic dialects).
- **Google Cloud TTS**: Outputting native Arabic audio playback.

### "Why Local?" (The Teacher-Student Model)
For maximum privacy and response speed (Fast Mode - < 5s SLA), all data strictly traverses locally deployed LLM endpoints (`qwen2.5:7b`) capable of native Arabic operations.

Cloud models (Gemini/GPT/Claude) are deployed in a "Smart Mode" or "Training Mode" capacity:
1. They are only invoked on low-confidence local assessments.
2. They are strictly proxied through a **Redaction Privacy Service** (`privacy.service.ts`) scrubbing all PII/sensitive info explicitly before transmission.

---

## 3. Implementation Roadmap

The AI implementation mirrors the "Phase 4" structure defined within the platform methodology.

### Phase 0: Outline & Research *(Completed)*
Established natural language extraction paradigms via semantic prompts, implemented pgvector architecture over Prisma, and cemented Google TTS and Whisper STT for Arabic logic.

### Phase 1: Design & Contracts *(Completed)*
Established all 17 underlying models (including new entities for Permission Profiles, Audit Trail, Anomalies, Feedback, Quotas, Emergency State, and Business Knowledge). Drafted 7 fully typed OpenAPI specs isolating structured services. Generated comprehensive implementation plan (`plan.md`) and highly detailed test-driven tasks (`tasks.md`) explicitly covering Priority Requirements: Prompt Injection Protection, Quota Signalling, OCR PII Redaction, CRAG/Self-RAG evaluation, and stable AI Toolkit service signatures.

### Phase 2: Implementation *(Pending)*
Execution of the actual AI processing logic via 251 sequential tasks from `tasks.md`, including integrating the Vercel AI SDK into the `packages/ai-assistant` package, building prompt pipelines, and fortifying security layers prior to production launch.

---

## 4. Security & AI-RBAC (Role Based Access Control)

Unlike standard stateless operations, the AI is heavily intertwined with system security. The interaction loop is fundamentally gated by two distinct layers:
1. **System AdminScope (Layer 1):** Policies mapped in Layer 1 limit which records an admin or employee can query.
2. **AI Permission Profiles (Layer 2):** 6 built-in profiles (e.g., GUIDANCE_ONLY, DATA_ANALYST, FULL_ACCESS) dictate exactly what AI *capabilities* a user has, regardless of their System Role.

Every single query against PostgreSQL utilizing pgvector must dynamically apply scope variables.
- **Employee Search**: Is strictly filtered exclusively against their exact operating context.
- **Managers / Admins**: Cannot ask the AI questions correlating to Sections or Modules they do not explicitly oversee.
- **Redaction Logic**: Handled centrally by `PrivacyRule` mapping arrays, ensuring phone numbers, National IDs, and configured financial keys are stripped down to structural tokens before engaging generalized models via REST.
- **Input Sanitization:** A prompt injection protection layer filters out malicious overrides before any processing or cloud transmission.

---

## 5. Current State & Configuration
Currently, infrastructural scaffolding relies heavily on active container orchestration.

**Required Containers:**
While the standard application runs `postgres:16` and `redis:7-alpine`, the complete AI stack requires manual setup/orchestration with `ollama`:
```bash
docker run -d -p 11434:11434 -v ollama_data:/root/.ollama ollama/ollama
docker exec -it <ollama_container> ollama pull qwen2.5:7b
```
**(Note: `docker-compose.yml` does NOT currently bootstrap Ollama locally in the main repository, relying exclusively on standard Postgres without explicitly declaring the pgvector build version.)**
