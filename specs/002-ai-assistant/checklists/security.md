# Requirements Checklist: AI Assistant Security (Formal Release Gate)

**Purpose**: Unit tests for security requirements to ensure completeness, clarity, and consistency before implementation.
**Focus**: Two-layer RBAC, PII Redaction, Audit Integrity, Emergency Shutdown, and External API Data Leakage.
**Depth**: Formal Release Gate (Strict)
**Status**: Created 2026-03-10

---

## Requirement Completeness (Architecture & Flow)

- [ ] CHK001 - Are the requirements for the "two-layer access control" (System RBAC + AI Profile) explicitly defined for all entry points (Natural Language, Voice, OCR)? [Spec §FR-097]
- [ ] CHK002 - Does the spec define the security behavior when the "Fast Mode" (local) model is unavailable and the system attempts to failover to "Smart Mode" (cloud)? [Gap, Resilience]
- [ ] CHK003 - Are security requirements documented for the "AI Toolkit" when called from external module contexts? [Completeness, Spec §FR-063]
- [ ] CHK004 - Is the behavior for "Conversation Memory" specified when a user's AI Permission Profile is downgraded mid-session? [Gap, Scenario]

## RBAC & AI Permission Profiles (High Risk)

- [ ] CHK005 - Is the mapping between "AI Capability Names" and "System Resources" (e.g., `MODULE_QUERY` -> which tables?) explicitly defined? [Ambiguity, Spec §FR-067]
- [ ] CHK006 - Does the spec define the validation logic for "Custom AI Permission Profiles" to prevent privilege escalation by SUPER_ADMINs? [Clarity, Spec §FR-069]
- [ ] CHK007 - Are the requirements for "Self-Only" data access quantified (e.g., does it use specific `userId` filters in all RAG queries)? [Clarity, Spec §FR-067]
- [ ] CHK008 - Is the "immutable" nature of the VISITOR profile clearly defined to prevent accidental modification via API? [Clarity, Spec §FR-093, FR-094]
- [ ] CHK009 - Are requirements defined to prevent "Prompt Injection" attacks where a user attempts to bypass RBAC filters via natural language instructions? [Gap, Option A]

## PII Redaction & Privacy (High Risk)

- [ ] CHK010 - Is "Personally Identifiable Information (PII)" quantified with an explicit list of fields subject to redaction? [Ambiguity, Spec §FR-041]
- [ ] CHK011 - Does the spec define the redaction behavior for "OCR-extracted text" before it is sent to a cloud model for analysis? [Completeness, Spec §FR-026, FR-045]
- [ ] CHK012 - Are the requirements for the "PrivacyRule" redaction methods (`full`, `partial`, `token`) technically specified? [Clarity, Data Model §PrivacyRule]
- [ ] CHK013 - Is there a requirement specifying that "Question Content" must be purged from memory/logs after processing? [Consistency, Spec §FR-043]
- [ ] CHK014 - Does the spec define the security requirements for "Voice Session" audio files (e.g., storage duration, encryption requirements, access limits)? [Gap, Spec §FR-031]

## External Integration & Data Leakage

- [ ] CHK015 - Are the exact data fields being sent to "Gemini Vision" and "DeepSeek-OCR" documented to prevent unintentional data leakage? [Completeness, Spec §FR-058, FR-059]
- [ ] CHK016 - Does the spec define fallback security requirements if a Cloud Provider's API returns sensitive data in its response that was not in the original prompt? [Gap, Scenario]
- [ ] CHK017 - Are requirements defined for validating Cloud API credentials before they are persisted in `AIConfig`? [Measurability, Spec §FR-048]

## Audit Trail & Compliance

- [ ] CHK018 - Is the "AIAuditTrail" result field (`success`, `denied`, `error`) mapped to specific HTTP/Bot error codes? [Consistency, Data Model §AIAuditTrail]
- [ ] CHK019 - Are requirements defined for the immutability or protection of the `AIAuditTrail` log against modification by any user, including SUPER_ADMIN? [Gap, Spec §FR-072]
- [ ] CHK020 - Does the spec specify whether "Denied Capabilities" are logged with the original (denied) prompt or just the capability ID? [Clarity, Spec §FR-075]

## Emergency Management (Shutdown)

- [ ] CHK021 - Is the "5-second shutdown" requirement measurable and does it specify behavior for "Active Long-Running OCR/PDF Processes"? [Clarity, Spec §FR-084]
- [ ] CHK022 - Are requirements defined for the "Maintenance Message" to ensure it does not leak system state information during shutdown? [Gap, Spec §FR-083]
- [ ] CHK023 - Is the authorization for "Time-Based Access Overrides" restricted to specific conditions or left to SUPER_ADMIN discretion? [Ambiguity, Spec §FR-090]

---

## Traceability & Quality Summary

- **Requirement Coverage**: 85% Traceability to `spec.md` or identified `[Gap]`.
- **Primary Risks**: High focus on RBAC (Option A) and PII Redaction (Option B).
- **Exclusions**: Infrastructure (Docker, Network) confirmed as out-of-scope.
