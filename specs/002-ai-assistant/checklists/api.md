# Requirements Checklist: AI Assistant API & Toolkit (Unit Tests for English)

**Purpose**: Validate the quality, clarity, and completeness of AI Assistant API and Toolkit requirements.
**Focus**: OpenAPI contracts, Error response formats, Quota signalling, and Toolkit integration clarity.
**Depth**: Standard
**Status**: Created 2026-03-10

---

## OpenAPI Contract Quality (External Boundary)

- [ ] CHK001 - Are all 17 AI Assistant features represented by at least one endpoint in the `contracts/` OpenAPI files? [Completeness, Spec §FR-001 to FR-119]
- [ ] CHK002 - Is the `inputType` parameter ('text' | 'voice' | 'command') clearly defined for the `/ai/query` endpoint? [Clarity, Spec §FR-032]
- [ ] CHK003 - Are request body requirements for document uploads (25MB limit, 500 pages) explicitly defined in the OpenAPI schema? [Completeness, Spec §FR-025A, FR-025B]
- [ ] CHK004 - Does the OpenAPI contract define response schemas for "Voice Data Export" delivery status? [Gap, Spec §FR-118]
- [ ] CHK005 - Are the units for "Confidence Score" (0-1.0 vs 0-100) consistent across all RAG and Data Entry endpoints? [Consistency, Spec §FR-076, FR-106]

## Toolkit API Requirements (Internal Integration)

- [ ] CHK006 - Does the spec define the mandatory function signatures for the `@al-saada/ai-assistant/toolkit` exported services? [Gap, Spec §FR-062]
- [ ] CHK007 - Are the error handling requirements for Toolkit calls (e.g., how exceptions are thrown/caught by consumer modules) documented? [Clarity, Spec §FR-063]
- [ ] CHK008 - Is the "two-layer access control" enforcement specified for Toolkit-initiated requests? [Consistency, Spec §FR-097]
- [ ] CHK009 - Does the requirement specify how the "Module Integration API" handles `ctx` (Grammy context) propagation for i18n? [Ambiguity, Gap]
- [ ] CHK010 - Is the behavior of `module-indexer.service` defined when a module's `locales/ar.ftl` file is corrupted or missing during registration? [Edge Case, Gap]

## Error Handling & Response Standards

- [ ] CHK011 - Do AI error responses follow the global platform standard defined in `001-platform-core` (use of i18n keys)? [Consistency, Spec §FR-043]
- [ ] CHK012 - Is there a requirement for a consistent JSON error body structure across all AI packages? [Gap, Spec §FR-111]
- [ ] CHK013 - Are AI-specific error codes (LLM_TIMEOUT, RAG_CONTEXT_OVERFLOW, QUOTA_EXCEEDED) documented as requirements? [Completeness, Spec §FR-039]
- [ ] CHK014 - Does the spec define the requirement to avoid hardcoded Arabic/English text in API error payloads? [Consistency, Spec §Principle VII]
- [ ] CHK015 - Is the fallback requirement specified for when a cloud model fails and no local model response is available? [Edge Case, Gap]

## Quota & Rate Limit Contracts (Response Signalling)

- [ ] CHK016 - Are the requirements for `429 Too Many Requests` response headers (e.g., `X-RateLimit-Reset`) explicitly specified? [Clarity, Spec §NFR-004]
- [ ] CHK017 - Does the requirement define the structure of the 429 error body for both "Soft Alert" (80%) and "Hard Stop" (100%) scenarios? [Clarity, Spec §FR-081, FR-082]
- [ ] CHK018 - Is the behavior for asynchronous jobs (Briefings, Anomaly Detection) defined when their underlying AI service quota is exceeded? [Edge Case, Gap]
- [ ] CHK019 - Are the rate limits (queries/min) for each system role specified in a way that can be programmatically enforced? [Measurability, Spec §NFR-006A to NFR-006D]

## Scenario & Edge Case Coverage

- [ ] CHK020 - Does the spec define API requirements for "Graceful Termination" of in-progress requests during an Emergency Shutdown? [Completeness, Spec §FR-084]
- [ ] CHK021 - Are requirements defined for "Ambiguous Query" response formats (e.g., multiple choice or clarification request structure)? [Clarity, Spec §FR-012]
- [ ] CHK022 - Is the "PII Redaction" behavior for API responses (not just prompts) specified in the requirements? [Coverage, Spec §FR-041]
- [ ] CHK023 - Can the "Fast Mode" vs "Smart Mode" latency requirements be objectively measured via API metrics? [Measurability, Spec §FR-039, FR-040]

---

## Traceability & Quality Summary

- **Requirement Coverage**: 100% Traceability to `spec.md`, `001-platform-core`, or identified `[Gap]`.
- **Primary Focus**: REST + Internal Toolkit integration.
- **Critical Gaps Found**: No 429 header standard; Toolkit function signatures not defined; Global error response structure not formalized in `001-platform-core`.
