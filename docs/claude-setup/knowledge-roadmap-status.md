# Roadmap & Status — Al-Saada Smart Bot (Condensed for Project Knowledge)
# Sources: docs/project/roadmap.md v1.0.0 + project-status-report-2026-03-08.md

## Current State (as of 2026-03-08)

| Component | Status | Details |
|-----------|--------|---------|
| Constitution | v2.5.0 ✅ | 11 principles |
| Methodology | v1.8.0 ✅ | 12 golden rules |
| Layer 1 (Platform Core) | ~95% | Phases 1-9 complete, Phase 10 closing |
| Layer 2 (Module Kit) | ~90% | Helpers + CLI ready |
| Layer 3 (Modules) | 0% | Empty by design (Platform-First) |
| 005-production-readiness | Specs ready, zero code | NEXT PRIORITY |
| 002-ai-assistant | Planned | Not started |
| Tests | 239 passing | 80.97% coverage |
| TypeCheck | 0 errors | Clean |

## Roadmap Phases

### Phase 3: Production Readiness (005) — 🔴 NEXT
**Duration**: 2-3 weeks | **Blocking**: Cannot deploy without this

| ID | Requirement | Priority | Est. Time |
|----|-------------|----------|-----------|
| PR-001 | Sentry Integration | CRITICAL | 4-6h |
| PR-002 | Rate Limiting + Auto-Retry | CRITICAL | 3-4h |
| PR-003 | CI/CD Pipeline | HIGH | 6-8h |
| PR-004 | Automated Backups (local) | HIGH | 4-5h |

### Phase 4: AI Assistant (002) — 🟠 PLANNED
**Duration**: 4-6 weeks | **After**: Phase 3

Key: Qwen2.5:7b (Ollama local), nomic-embed-text, pgvector, Whisper STT, RBAC-aware RAG

### Phase 5: Dashboard MVP — 🟠 PLANNED
**Duration**: 6-8 weeks | **After**: Phase 4

Tech: AdminJS + Next.js + NextAuth.js
Features: Auto-discovery, RBAC, CRUD, Export, Self-hosted auth

### Phase 6: Advanced Features — 🟡 FUTURE
Kanban boards, Broadcast, Analytics, Module Kit UX improvements

## Known Issues

- 5 LOW priority UX improvements in Module Kit (backlog.md: BL-001 to BL-005)
- No production monitoring (Sentry) — CRITICAL
- No rate limiting — CRITICAL
- No CI/CD pipeline — HIGH
- Missing specs for 006-admin-dashboard and 007-module-kit-ux

## Immediate Priorities

1. 🔴 Start 005-production-readiness implementation
2. 🟠 Close v0.1.0 (tag Layer 1 completion)
3. 🟡 Fill documentation gaps (i18n reference, architecture.md)
4. 🔵 Begin AI Phase A (docker-compose + pgvector + Ollama)

## Timeline

```
Week 1-3:    Phase 3 (Production Readiness)
Week 4-9:    Phase 4 (AI Assistant)
Week 10-15:  Phase 5 (Dashboard MVP)
Week 16-21:  Phase 6 (Advanced Features)
Total: ~21 weeks (5 months)
```

## Risks

1. Scope creep in Dashboard → Strict MVP enforcement
2. Google Drive over-engineering → Local backups only, cloud optional later
3. Skipping Production Readiness → Non-negotiable, blocks everything
4. AI RBAC data leaks → Mandatory security spec + role-based vector filtering
