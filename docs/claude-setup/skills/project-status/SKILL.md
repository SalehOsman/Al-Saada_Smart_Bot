---
name: project-status
description: >
  Generate project status reports for Al-Saada Smart Bot. Use when user asks
  for status report, progress update, phase review, asks "what's done",
  "what's pending", "project status", "where are we", or needs a periodic
  review of implementation state vs documentation.
metadata:
  author: Al-Saada Project
  version: 1.0.0
  project: al-saada-smart-bot
---

# Project Status — Report Generation

## Report Methodology

Status reports MUST be based on **actual file inspection**, not memory or previous reports.

### Data Sources (read via MCP filesystem)

| What to check | Where |
|--------------|-------|
| Task completion | `specs/*/tasks.md` — check task status markers |
| Code existence | `packages/` and `modules/` — verify files exist |
| Test status | `vitest.config.ts` + test files in `packages/*/tests/` |
| Constitution version | `.specify/memory/constitution.md` — header |
| Methodology version | `docs/project/methodology.md` — header |
| Known issues | `docs/project/backlog.md` |
| Recent changes | `docs/project/changelog.md` |
| Previous report | `docs/project/project-status-report-*.md` |

### Verification Steps

1. Read latest tasks.md for each active spec
2. Cross-reference with actual code files (do they exist?)
3. Check test files exist for implemented features
4. Compare constitution + methodology versions
5. Review backlog for pending items
6. Identify gaps between documentation and reality

## Report Template

```markdown
# تقرير حالة المشروع — Al-Saada Smart Bot

**التاريخ:** [date]
**المُراجع:** المستشار التقني
**المنهجية:** مطابقة التوثيقات مع حالة الكود الفعلي

---

## الملخص التنفيذي

| البند | الحالة |
|-------|--------|
| Constitution | vX.X.X |
| Methodology | vX.X.X |
| Active Phase | [phase name] |
| Tests | X/X passing, X% coverage |
| Blocking Issues | [count] |

## حالة التنفيذ الفعلية

### المكتمل ✅
[list completed phases with evidence]

### قيد العمل 🔄
[current phase with task-level detail]

### لم يبدأ ❌
[upcoming phases]

## التناقضات المكتشفة
[gaps between docs and code]

## الأولويات القادمة
[ordered by priority with rationale]
```

## Current Project Baseline (as of 2026-03-08)

For quick reference when generating reports:

| Component | Status |
|-----------|--------|
| Layer 1 (Platform Core) | ~95% — Phases 1-9 complete |
| Layer 2 (Module Kit) | ~90% — Helpers + CLI ready |
| Layer 3 (Modules) | 0% — Empty by design |
| 005-production-readiness | Specs ready, zero code |
| 002-ai-assistant | Planned, not started |
| Tests | 239 passing, 80.97% coverage |
| Next priority | 005-production-readiness |

> ⚠️ This baseline is a snapshot. Always verify against actual files.
