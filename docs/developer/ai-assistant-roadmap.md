# AI Assistant Roadmap & Architecture

**Last Updated:** 2026-03-03

The AI Assistant transforms the Al-Saada Smart Bot from a reactive tool to a proactive operational partner. It acts as "Layer 4" within the platform architecture, standing atop the Platform Core and Module Kit. 

---

## 1. Vision & Core Capabilities

The objective of the AI Assistant is to abstract away complex UI navigation and reporting interfaces, allowing natural interaction with the system using Arabic text and voice.

### Primary Capabilities
- **Natural Language Data Entry (P1):** Users seamlessly input business data like fuel usage or attendance via conversational Arabic without structured forms.
- **Natural Language Querying (P1):** Business users retrieve live stats or metrics instantaneously through natural Q&A over the business datasets.
- **Smart Report Generation (P2):** Generation of scheduled or ad-hoc reports dynamically infused with predictive insights highlighting trends and anomalies.
- **Proactive Suggestions (P2):** Algorithmic threshold monitors push relevant business anomalies directly to scoped Admins (e.g., repeating lateness, missing truck logs).
- **Document Analysis (P2):** OCR ingestion extracting schema-ready data from invoices and PDFs directly to the database.
- **Voice Interaction (P3):** Hands-free operation using high-accuracy STT transcription.
- **Module Developer Wizard (P3):** AI-paired Module Generation via `/ai create-module` scaffolding conversational codebases safely on-demand.

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
Established all underlying models: `AIInteraction`, `AISuggestion`, `ScheduledReport`, `PrivacyRule`, `DocumentAnalysis`, and `VoiceSession`. Drafted OpenAPI specs isolating `rag.service`, `document-parser.service`, and `voice.service`.

### Phase 2: Implementation *(Pending)*
Execution of the actual AI processing logic, including integrating the Vercel AI SDK into the `packages/ai-assistant` package.

---

## 4. Security & AI-RBAC (Role Based Access Control)

Unlike standard stateless operations, the AI is heavily intertwined with system security. The interaction loop is fundamentally gated by `AdminScope` policies mapped in Layer 1.

Every single query against PostgreSQL utilizing pgvector must dynamically apply scope variables. 
- **Employee Search**: Is strictly filtered exclusively against their exact operating context.
- **Managers / Admins**: Cannot ask the AI questions correlating to Sections or Modules they do not explicitly oversee. 
- **Redaction Logic**: Handled centrally by `PrivacyRule` mapping arrays, ensuring phone numbers, National IDs, and configured financial keys are stripped down to structural tokens before engaging generalized models via REST.

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
