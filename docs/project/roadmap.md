# Al-Saada Smart Bot — Development Roadmap

**Version:** 1.0.0
**Last Updated:** 2026-03-09
**Status:** Active
**Document Owner:** Technical Advisor

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Phase 3: Production Readiness](#phase-3-production-readiness)
4. [Phase 4: AI Assistant](#phase-4-ai-assistant)
5. [Phase 5: Dashboard MVP](#phase-5-dashboard-mvp)
6. [Phase 6: Advanced Features](#phase-6-advanced-features)
7. [Timeline](#timeline)
8. [Risks & Mitigation](#risks--mitigation)
9. [Success Metrics](#success-metrics)

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

- 5 LOW priority UX improvements in Module Kit (see `backlog.md`)

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

### PR-001: Sentry Integration

**Purpose:** Real-time error tracking and alerting for production issues.

**Implementation:**

```typescript
// New files:
- packages/core/src/services/sentry.ts
- packages/core/src/bot/middleware/sentry.ts

// Modified files:
- packages/core/src/bot/index.ts
- packages/core/src/main.ts
- .env.example (add SENTRY_DSN)
```

**Features:**
- ✅ Opt-in via `SENTRY_DSN` environment variable
- ✅ PII filtering via `beforeSend` hook
- ✅ Self-hosted Sentry support
- ✅ Telegram alerts for critical errors (via BullMQ)
- ✅ Performance monitoring (Prisma query tracing)

**Constitutional Addition Required:**

```markdown
### Principle XI: Observability
- Sentry MUST be opt-in via SENTRY_DSN environment variable
- PII MUST be filtered via beforeSend hook before sending to Sentry
- Self-hosted Sentry option MUST be supported for sensitive deployments
- Error alerts MUST be sent to SUPER_ADMIN via Telegram
```

---

### PR-002: Rate Limiting & Auto-Retry

**Purpose:** Protect against Telegram API flood limits and user spam.

**Implementation:**

```typescript
// Dependencies:
npm install @grammyjs/auto-retry @grammyjs/ratelimiter

// Modified files:
- packages/core/src/bot/index.ts
- packages/core/src/locales/ar.ftl (add rate-limit-exceeded)
- packages/core/src/locales/en.ftl (add rate-limit-exceeded)
```

**Configuration:**
```typescript
bot.api.config.use(autoRetry())

bot.use(limit({
  timeFrame: 2000, // 2 seconds
  limit: 3, // 3 requests max
  storageClient: redisClient,
  onLimitExceeded: async (ctx) => {
    await ctx.reply(ctx.t('rate-limit-exceeded'))
  },
}))
```

**i18n Keys:**
```fluent
# ar.ftl
rate-limit-exceeded = ⚠️ عذراً، الرجاء الانتظار قليلاً قبل إرسال المزيد من الطلبات.

# en.ftl
rate-limit-exceeded = ⚠️ Please wait before sending more requests.
```

---

### PR-003: CI/CD Pipeline

**Purpose:** Automated quality checks on every pull request.

**Implementation:**

```yaml
# .github/workflows/ci.yml (new file)
name: CI
on: [pull_request, push]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        run: npm install

      - name: Lint
        run: npm run lint

      - name: Type check
        run: npm run typecheck

      - name: Generate Prisma Client
        run: npm run db:generate

      - name: GitNexus Analysis
        run: npx gitnexus analyze

      - name: Run tests
        run: npm run test

      - name: Check migrations
        run: npx prisma migrate diff --exit-code
```

**Benefits:**
- ✅ Catches errors before merge
- ✅ Enforces code quality standards
- ✅ Validates Prisma schema changes
- ✅ Runs full test suite (112+ tests)
- ✅ GitNexus blast radius check

---

### PR-004: Automated Backups

**Purpose:** Daily encrypted backups with retention policy.

**Implementation:**

```typescript
// New files:
- packages/core/src/cron/backup.ts
- packages/core/src/services/backup.ts

// Modified files:
- docker-compose.yml (add backup volume)
- packages/core/src/main.ts (register cron job)
```

**Features:**
- ✅ Daily `pg_dump` at 3 AM Cairo time
- ✅ Local storage in Docker volume
- ✅ Encryption with `openssl`
- ✅ 30-day retention policy
- ✅ Audit log entry on success/failure
- ✅ Telegram notification to SUPER_ADMIN
- ❌ Google Drive: **Optional plugin** (NOT mandatory)

**Rationale for Local-Only:**
- Simpler implementation
- No external dependencies
- Works in offline/air-gapped environments
- Google Drive can be added as optional plugin in Phase 6

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
**Status:** Planned
**Dependencies:** Phase 3 complete

### Objectives

Build an AI-powered operational assistant that allows users to query company data in natural Arabic, with voice support and strict RBAC enforcement.

---

### Implementation Strategy

**Follow existing spec:** `specs/002-ai-assistant/spec.md`

**Key Features:**
- ✅ Local LLM: Qwen2.5:7b via Ollama
- ✅ Embeddings: nomic-embed-text (local, Arabic-capable)
- ✅ Vector DB: pgvector (PostgreSQL extension)
- ✅ RAG: Company data embeddings (employees, sections, modules, audit logs)
- ✅ Voice: Whisper STT + Google/OpenAI TTS
- ✅ RBAC-aware: Users only see data they have permission to access
- ✅ Read-only: No data modification via AI

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

## Phase 5: Dashboard MVP

**Duration:** 6-8 weeks
**Priority:** 🟠 HIGH
**Status:** Planned
**Dependencies:** Phase 4 complete

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

## Phase 6: Advanced Features

**Duration:** 4-6 weeks
**Priority:** 🟡 MEDIUM
**Status:** Planned
**Dependencies:** Phase 5 MVP validated by users

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

#### 2. Module Kit UX (from backlog.md)

| ID | Feature | Time |
|----|---------|------|
| BL-001 | Redis failure warning | 1 hour |
| BL-002 | save() retry mechanism | 2 hours |
| BL-003 | Conversation timeout | 3-4 hours |
| BL-004 | confirm() empty guard | 30 min |
| BL-005 | Doc alignment | 15 min |

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
│ Week 10-15:  Phase 5 (Dashboard MVP)                         │
│ Week 16-21:  Phase 6 (Advanced Features)                     │
└─────────────────────────────────────────────────────────────┘

Total Duration: ~21 weeks (5 months)
```

### Milestones

| Milestone | Target Date | Deliverable |
|-----------|-------------|-------------|
| M1: Production Ready | Week 3 | Sentry + CI/CD + Backups |
| M2: AI Launch | Week 9 | AI Assistant live |
| M3: Dashboard Beta | Week 15 | Dashboard MVP deployed |
| M4: Feature Complete | Week 21 | All advanced features |

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

### Immediate Actions (Week 1)

1. **Create Feature 005 Spec**
   ```bash
   /speckit.specify Create Feature 005: Production Readiness
   Include: Sentry, Rate Limiting, CI/CD, Local Backups
   Exclude: Google Drive (optional plugin)
   ```

2. **Update Constitution**
   ```bash
   /speckit.constitution Add Principle XI: Observability
   ```

3. **Create AI Security Spec**
   ```bash
   # Move AI security from Enhancement Proposals to:
   specs/002-ai-assistant/security.md
   ```

4. **Start PR-001 Implementation**
   - Install @sentry/node
   - Create sentry.ts service
   - Add middleware
   - Test with sample errors

---

## Document History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-03-04 | Initial roadmap created from Enhancement Proposals + Dashboard & Scaling | Technical Advisor |

---

## References

- Constitution: `.specify/memory/constitution.md` (v2.5.0)
- Methodology: `docs/project/methodology.md` (v1.8.0)
- Backlog: `docs/project/backlog.md`
- Archived Proposals: `docs/project/archive/`
- Specs: `specs/` directory

---

**Status:** ✅ Phase 3 complete — Ready for Phase 4 (AI Assistant)
