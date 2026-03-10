# Al-Saada Smart Bot — Development Roadmap

**Version:** 1.2.0
**Last Updated:** 2026-03-10
**Status:** Active
**Document Owner:** Technical Advisor

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Phase 3: Production Readiness](#phase-3-production-readiness)
4. [Phase 4: AI Assistant](#phase-4-ai-assistant)
5. [Phase 5: AI-Driven Module Kit V2](#phase-5-ai-driven-module-kit-v2)
6. [Phase 6: Dashboard MVP](#phase-6-dashboard-mvp)
7. [Phase 7: Advanced Features](#phase-7-advanced-features)
8. [Timeline](#timeline)
9. [Risks & Mitigation](#risks--mitigation)
10. [Success Metrics](#success-metrics)

---

## Overview

This roadmap outlines the development plan for Al-Saada Smart Bot from Phase 3 (Production Readiness) through Phase 6 (Advanced Features). The project follows a **spec-driven development** methodology using SpecKit, with strict adherence to the Constitution (v2.5.0).

### Project Vision

Transform the bot from a development platform into a **production-ready, enterprise-grade system** with:
- ✅ Robust error tracking and monitoring
- ✅ AI-powered operational assistant
- ✅ Web-based admin dashboard
- ✅ Advanced workflow automation

---

## Current Status

### ✅ Completed Phases

| Phase | Status | Completion Date | Notes |
|-------|--------|----------------|-------|
| **Phase 1** | ✅ Complete | 2026-02-20 | Platform Core (Bot, RBAC, Sections, Audit, BullMQ, Maintenance) |
| **Phase 2** | ✅ Complete | 2026-03-04 | Module Kit (validate, confirm, save, drafts, CLI tools) |
| **Phase 3** | ✅ Complete | 2026-03-09 | Production Readiness (Sentry, Backups, Rate Limiting, CI/CD) — v0.3.0 |

### 📊 Implementation Status

```
Layer 1 (Platform Core):  ████████████████████ 100%
Layer 2 (Module Kit):     ████████████████████ 100%
Layer 3 (Modules):        ░░░░░░░░░░░░░░░░░░░░ 0% (Ready to build)
```

### ⚠️ Known Issues

- No known blocking issues. Module Kit backlog (BL-001→005) has been fully implemented.

---

## Phase 3: Production Readiness

**Duration:** 2-3 weeks
**Priority:** 🔴 CRITICAL
**Status:** ✅ Complete (v0.3.0 — 2026-03-09)
**Result:** 26/26 tasks completed across 7 phases

### Objectives

Prepare the platform for safe, reliable production deployment with proper monitoring, error tracking, and automated quality checks.

---

### Requirements

| ID | Requirement | Priority | Estimated Time | Spec Reference |
|----|-------------|----------|----------------|----------------|
| **PR-001** | Sentry Integration | 🔴 CRITICAL | 4-6 hours | TBD (Feature 005) |
| **PR-002** | Rate Limiting & Auto-Retry | 🔴 CRITICAL | 3-4 hours | TBD (Feature 005) |
| **PR-003** | CI/CD Pipeline | 🟠 HIGH | 6-8 hours | TBD (Feature 005) |
| **PR-004** | Automated Backups | 🟠 HIGH | 4-5 hours | TBD (Feature 005) |

**Total Estimated Time:** ~17-23 hours

---

### PR-001: Sentry Integration ✅ IMPLEMENTED

**Purpose:** Real-time error tracking and alerting for production issues.

**Actual Implementation:**
- `packages/core/src/bot/monitoring/sentry.service.ts` — SentryService with opt-in via SENTRY_DSN, beforeSend PII filtering using shared `filterPIIObject`
- `packages/core/src/bot/monitoring/sentry.middleware.ts` — Enriches Sentry scope with user ID, chat ID, update type
- `packages/core/src/bot/monitoring/error-alert.service.ts` — Telegram alerts to SUPER_ADMINs with 5-min throttling, dependency injection via `setBotApi()`
- `packages/core/src/bot/middlewares/error.ts` — Global error handler captures to Sentry + triggers alerts

**Features delivered:**
- ✅ Opt-in via `SENTRY_DSN` environment variable
- ✅ PII filtering via `beforeSend` hook (Egyptian phones, national IDs, emails)
- ✅ Self-hosted Sentry support
- ✅ Telegram alerts for critical errors (direct API, not BullMQ)
- ✅ Constitution Principle XI: Observability — implemented

---

### PR-002: Rate Limiting & Auto-Retry ✅ IMPLEMENTED

**Purpose:** Protect against Telegram API flood limits and user spam.

**Actual Implementation:**
- `packages/core/src/bot/middleware/rate-limit.middleware.ts` — Per-user rate limiting via `@grammyjs/ratelimiter` with SUPER_ADMIN bypass
- `packages/core/src/bot/middleware/auto-retry.middleware.ts` — API transformer via `@grammyjs/auto-retry` (max 3 retries, exponential backoff)
- Configuration via env: `RATE_LIMIT_ENABLED`, `RATE_LIMIT_REQUESTS_PER_MINUTE`, `RATE_LIMIT_WINDOW_MINUTES`
- i18n key: `error-rate-limit` (with `{ $seconds }` param)

---

### PR-003: CI/CD Pipeline ✅ IMPLEMENTED

**Purpose:** Automated quality checks on every pull request.

**Actual Implementation — 3 separate workflows:**
- `.github/workflows/lint.yml` — ESLint check (push to main + all PRs)
- `.github/workflows/test.yml` — Vitest suite with Prisma generate (push to main + all PRs)
- `.github/workflows/ci.yml` — TypeScript typecheck + Prisma schema validation (push to main + all PRs)
- All use `actions/checkout@v4` + `actions/setup-node@v4` + Node 20 + npm cache
- GitNexus: placeholder step (TODO when CLI available)
- Branch Protection: must be configured manually on GitHub

**Benefits delivered:**
- ✅ Catches errors before merge
- ✅ Enforces code quality standards
- ✅ Validates Prisma schema changes
- ✅ Runs full test suite (274 tests)
- ✅ All PRs checked regardless of target branch

---

### PR-004: Automated Backups ✅ IMPLEMENTED

**Purpose:** Daily encrypted backups with retention policy.

**Actual Implementation:**
- `packages/core/src/bot/services/backup.service.ts` — BackupService with pg_dump + AES-256-GCM encryption (Node.js crypto)
- `packages/core/src/cron/backup-schedule.ts` — Daily cron job via node-cron
- `packages/core/src/bot/handlers/backup.ts` — `/backup`, `/backups` commands with two-step interactive restore approval
- `prisma/schema/platform.prisma` — BackupMetadata model + BackupStatus enum
- `docker-compose.yml` — `backup_data` volume mounted at `/app/backups`

**Features delivered:**
- ✅ Daily `pg_dump` with configurable schedule via `BACKUP_SCHEDULE` env
- ✅ Local storage in Docker volume
- ✅ AES-256-GCM encryption (Node.js crypto, not openssl)
- ✅ Configurable retention policy via `BACKUP_RETENTION_DAYS`
- ✅ Audit log entry on success/failure
- ✅ Telegram notification to SUPER_ADMIN
- ❌ Google Drive: deferred (optional plugin for future)

---

### Deliverables

- [X] Sentry service integrated and tested
- [X] Rate limiting active with proper i18n
- [X] CI/CD pipeline running on all PRs
- [X] Automated backups running daily
- [X] Documentation updated
- [X] Constitution updated (Principle XI)
- [X] All tests passing (274 tests)

---

### Success Criteria

- ✅ Zero production errors go unnoticed
- ✅ No Telegram API flood bans
- ✅ All PRs pass automated checks
- ✅ Daily backups verified and encrypted

---

## Phase 4: AI Assistant

**Duration:** 4-6 weeks
**Priority:** 🟠 HIGH
**Status:** In Progress
**Dependencies:** Phase 3 complete

### Objectives

Build an AI-powered operational assistant serving as a comprehensive operational partner for business management — including data entry, retrieval, reporting, analysis, document extraction, and proactive suggestions.

---

### Implementation Strategy

**Follow existing spec:** `specs/002-ai-assistant/spec.md`

**Key Features:**
- ✅ Local LLM: Qwen2.5:7b via Ollama (Fast Mode)
- ✅ Cloud Models: Gemini/Claude/OpenAI via REST APIs (Smart Mode)
- ✅ Embeddings: nomic-embed-text (local, Arabic-capable)
- ✅ Vector DB: pgvector (PostgreSQL extension)
- ✅ RAG: Company data, module schema, and module documentation
- ✅ Voice: Whisper STT + Google Cloud TTS
- ✅ Hybrid OCR: Gemini Vision API + DeepSeek-OCR for document analysis
- ✅ AI Toolkit: Internal API for module integration (@al-saada/ai-assistant/toolkit)
- ✅ RBAC-aware: Enforced via System Roles + AI Permission Profiles
- ✅ Read-only Training Mode: Background self-improvement for vector embeddings

---

### Security Requirements (from Enhancement Proposals)

**New file required:** `specs/002-ai-assistant/security.md`

**Content:**
```markdown
# AI Assistant Security

## PII Masking
- Extend `pii-masker.ts` to filter names, national IDs, financial data
- Apply before sending context to cloud LLMs (Gemini/Claude/OpenAI)
- Local model (Qwen2.5:7b) receives unmasked data

## Vector Encryption
- Enable PostgreSQL encryption at rest for pgvector data
- Ensure embeddings are stored encrypted

## RBAC in RAG
- Filter vector search results by user role
- SUPER_ADMIN: all data
- ADMIN: only data in their AdminScope
- EMPLOYEE: only their personal data
- VISITOR: no AI access

## Example Query Flow
User: "ما هي رواتب الإدارة؟"
1. Check user role (EMPLOYEE)
2. Filter RAG query: WHERE userId = currentUser.id
3. Result: "ليس لديك صلاحية لعرض هذه البيانات"
```

---

### Deliverables

- [ ] pgvector + Ollama in docker-compose
- [ ] Embedding service with RBAC filtering
- [ ] RAG service with query rewriting
- [ ] LLM client (Qwen2.5:7b + cloud fallback)
- [ ] Voice support (STT/TTS)
- [ ] Bot conversation handler
- [ ] Security spec documented
- [ ] All tests passing

---

## Phase 5: AI-Driven Module Kit V2

**Duration:** 3-5 weeks
**Priority:** 🟠 HIGH
**Status:** Planned (Spec: `008-module-kit-v2`)
**Dependencies:** Phase 4 complete

### Objectives

Upgrade the current Module Kit to a fully Dynamic App Factory, leveraging the AI Assistant to generate complex data gathering modules, relationships, and lifecycles via simple text/yaml configurations without writing raw code.

---

### Key Capabilities
- **YAML/Blueprint Driven:** Define form fields, types, relationships, and logic in one file.
- **Dynamic Database:** Auto-generate Prisma tables (schema.prisma) and Zod validations from blueprints.
- **Relational Lookups:** Automatically fetch and display reference data from other modules.
- **AI "Intent-to-App":** Automatically write Blueprints, auto-localize text (`ar.json`, `en.json`), and suggest missing fields via RAG LLM integration.

---

## Phase 6: Dashboard MVP

**Duration:** 6-8 weeks
**Priority:** 🟠 HIGH
**Status:** Planned
**Dependencies:** Phase 5 complete

### Objectives

Build a web-based admin dashboard with auto-discovery, RBAC integration, and self-hosted authentication.

---

### MVP Features ONLY

| ID | Feature | Priority | Estimated Time |
|----|---------|----------|----------------|
| **DB-001** | Auto-Discovery UI | P1 | 1 week |
| **DB-002** | RBAC Integration | P1 | 1 week |
| **DB-003** | CRUD Operations | P1 | 2 weeks |
| **DB-004** | Data Export (Excel/CSV) | P1 | 1 week |
| **DB-005** | Self-Hosted Auth | P1 | 1 week |

**Total:** ~6 weeks

---

### Tech Stack (Final Decision)

```typescript
// Framework
✅ AdminJS (for MVP speed)
   - Prisma adapter built-in
   - Auto-discovery out of the box
   - Fastest time to market

// Frontend
✅ Next.js + Tailwind CSS + Shadcn UI

// Auth
✅ NextAuth.js (Credentials Provider)
   - Email + bcrypt password
   - Invite-only system
   - Bootstrap via CLI: npm run dashboard:setup

// Backend
✅ Next.js API Routes
```

**Rationale:**
- AdminJS is fastest for MVP
- Can migrate to Refine.dev later if needed (Phase 6)
- Follows YAGNI principle

---

### DB-001: Auto-Discovery UI

**How it works:**
1. Dashboard reads `Module` table from Prisma
2. Extracts schema from `prisma/schema/modules/*.prisma`
3. Generates CRUD UI automatically
4. No manual UI code required per module

**Example:**
```typescript
// When developer runs: npm run module:create fuel-entry
// Dashboard automatically shows:
// - "Fuel Entry" menu item
// - List view with all fields
// - Create/Edit forms
// - Export button
```

---

### DB-002: RBAC Integration

**Behavior:**
- SUPER_ADMIN: sees all modules
- ADMIN: sees only modules in their AdminScope
- EMPLOYEE: read-only access to personal data
- VISITOR: no dashboard access

**Implementation:**
```typescript
// Middleware checks user role + AdminScope
// Filters menu items and data queries accordingly
```

---

### DB-003: CRUD Operations

**Features:**
- List view with pagination, sorting, filtering
- Create form with validation
- Edit form with inline editing
- Delete with confirmation
- Bulk operations (delete, export)

---

### DB-004: Data Export

**Formats:**
- Excel (.xlsx) via ExcelJS
- CSV via built-in Node.js

**Permissions:**
- Respects RBAC (user only exports data they can see)
- Audit log entry on every export

---

### DB-005: Self-Hosted Auth

**Bootstrap Process:**
```bash
# First-time setup
npm run dashboard:setup

# Prompts:
# - Email: admin@company.com
# - Password: ********
# - Confirm: ********

# Creates SUPER_ADMIN account in database
```

**User Management:**
- SUPER_ADMIN creates other admin accounts via dashboard
- Sets temporary passwords
- Assigns AdminScope
- No public registration page

---

### ❌ Deferred to Phase 6

```
- Kanban Approval Boards
- API Keys & Webhooks
- BI/Analytics (Tremor charts)
- Broadcast System
- Advanced Audit Explorer
```

**Rationale:** MVP first, advanced features after validation

---

### Deliverables

- [ ] AdminJS dashboard running
- [ ] Auto-discovery working for all modules
- [ ] RBAC filtering active
- [ ] CRUD operations tested
- [ ] Export functionality working
- [ ] Self-hosted auth implemented
- [ ] Bootstrap CLI tool created
- [ ] Documentation complete

---

## Phase 7: Advanced Features

**Duration:** 4-6 weeks
**Priority:** 🟡 MEDIUM
**Status:** Planned
**Dependencies:** Phase 6 MVP validated by users

### Objectives

Add advanced dashboard features and Module Kit UX improvements based on user feedback.

---

### Features

#### 1. Dashboard Advanced

| Feature | Description | Estimated Time |
|---------|-------------|----------------|
| Kanban Boards | Drag-and-drop approval workflows | 1 week |
| Broadcast System | Send announcements to users via bot | 3 days |
| Advanced Audit Explorer | Security center with filtering | 1 week |
| BI/Analytics | Tremor charts for usage stats | 1 week |

#### 2. Module Kit UX ~~(from backlog.md)~~ ✅ ALREADY IMPLEMENTED

| ID | Feature | Status |
|----|---------|--------|
| BL-001 | Redis failure warning | ✅ Implemented (v0.3.0) |
| BL-002 | save() retry mechanism | ✅ Implemented (v0.3.0) |
| BL-003 | Conversation timeout | ✅ Implemented (v0.3.0) |
| BL-004 | confirm() empty guard | ✅ Implemented (v0.3.0) |
| BL-005 | Doc alignment | ✅ Implemented (v0.3.0) |

#### 3. Optional Extensions (On-Demand)

| Feature | Trigger | Time |
|---------|---------|------|
| API Keys | Client requests integration | 1 week |
| Webhooks Out | Client requests ERP sync | 1 week |
| Google Drive Backups | Client requests cloud storage | 3 days |

---

### Decision Criteria

**Only implement if:**
- ✅ User explicitly requests it
- ✅ Provides measurable value
- ✅ Doesn't violate YAGNI principle

---

## Timeline

```
┌─────────────────────────────────────────────────────────────┐
│                     Development Timeline                     │
├─────────────────────────────────────────────────────────────┤
│ Week 1-3:    Phase 3 (Production Readiness)                  │
│ Week 4-9:    Phase 4 (AI Assistant)                          │
│ Week 10-14:  Phase 5 (AI-Driven Module Kit V2)               │
│ Week 15-20:  Phase 6 (Dashboard MVP)                         │
│ Week 21-26:  Phase 7 (Advanced Features)                     │
└─────────────────────────────────────────────────────────────┘

Total Duration: ~26 weeks (6.5 months)
```

### Milestones

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| M1: Production Ready | Week 3 | Sentry + CI/CD + Backups |
| M2: AI Launch | Week 9 | AI Assistant live |
| M3: Module Factory | Week 14 | Module Kit V2 AI Generator |
| M4: Dashboard Beta | Week 20 | Dashboard MVP deployed |
| M5: Feature Complete | Week 26 | All advanced features |

---

## Risks & Mitigation

### 🔴 Risk 1: Scope Creep in Dashboard

**Problem:** Dashboard & Scaling.md contains too many features

**Mitigation:**
- Strict MVP scope enforcement
- Defer all non-essential features to Phase 6
- Require explicit approval for any scope additions

---

### 🔴 Risk 2: Google Drive Over-Engineering

**Problem:** Google Drive backups add complexity without clear need

**Mitigation:**
- Make it optional plugin in Phase 6
- Start with local backups only
- Add cloud storage only if client requests it

---

### 🔴 Risk 3: Ignoring Production Readiness

**Problem:** Temptation to skip Phase 3 and jump to Dashboard

**Mitigation:**
- Phase 3 is **non-negotiable**
- No production deployment without Sentry + CI/CD
- Block Phase 4 start until Phase 3 is 100% complete

---

### 🔴 Risk 4: AI Security Gaps

**Problem:** RAG might leak data across RBAC boundaries

**Mitigation:**
- Mandatory security spec before implementation
- RBAC filtering at vector search level
- Comprehensive testing with different user roles
- PII masking for cloud LLMs

---

## Success Metrics

### Phase 3 Success Criteria

- ✅ Zero untracked production errors
- ✅ No Telegram API bans
- ✅ 100% CI/CD pass rate
- ✅ Daily backups verified

### Phase 4 Success Criteria

- ✅ AI responds accurately in Arabic
- ✅ RBAC filtering works correctly
- ✅ Voice input/output functional
- ✅ No data leaks across roles

### Phase 5 Success Criteria

- ✅ Dashboard accessible to all admins
- ✅ Auto-discovery works for new modules
- ✅ Export generates valid Excel/CSV
- ✅ Self-hosted auth secure

### Phase 6 Success Criteria

- ✅ User feedback positive
- ✅ Advanced features adopted
- ✅ No performance degradation

---

## Next Steps

### Immediate Actions

1. **Start Phase 4: AI Assistant (002-ai-assistant)**
   - Update `docker-compose.yml`: replace `postgres:16` with `pgvector/pgvector:pg16` + add Ollama service
   - Create `packages/ai-assistant/` structure
   - Follow existing spec: `specs/002-ai-assistant/spec.md`

2. **Create AI Security Spec** (if not already done)
   - `specs/002-ai-assistant/security.md` — RBAC in RAG, PII masking for cloud LLMs, vector encryption

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-03-04 | Initial roadmap created from Enhancement Proposals + Dashboard & Scaling | Technical Advisor |
| 1.1.0 | 2026-03-09 | Phase 3 completed (v0.3.0), updated PR-001→004 with actual implementation details | Technical Advisor |
| 1.2.0 | 2026-03-10 | Added Phase 5 (AI-Driven Module Kit V2) strategically after Phase 4 (AI Assistant). Shifted later phases. | Technical Advisor |

---

## References

- Constitution: `.specify/memory/constitution.md` (v2.5.0)
- Methodology: `docs/project/methodology.md` (v1.8.0)
- Backlog: `docs/project/backlog.md`
- Archived Proposals: `docs/project/archive/`
- Specs: `specs/` directory

---

**Status:** ✅ Phase 3 complete — Ready for Phase 4 (AI Assistant)
