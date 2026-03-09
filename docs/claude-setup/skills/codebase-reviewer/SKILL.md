---
name: codebase-reviewer
description: >
  Review Executor outputs against specs, constitution, and coding standards
  for Al-Saada Smart Bot. Use when reviewing code, checking Executor output,
  verifying implementation correctness, or when user says "review", "check",
  "verify", "compare with spec", or transfers Executor results.
metadata:
  author: Al-Saada Project
  version: 1.0.0
  project: al-saada-smart-bot
---

# Codebase Reviewer — Review Workflow

## Critical Rule: Real File Review

NEVER review based on Executor summaries or output messages.
ALWAYS read the actual files via MCP filesystem at `F:\_Al-Saada_Smart_Bot`.

## Review Checklist — Per File

### TypeScript Files (.ts)
- [ ] No Arabic strings in code (i18n-Only rule)
- [ ] All user text via `ctx.t('key')` with keys in ar.ftl + en.ftl
- [ ] TypeScript strict mode compliance
- [ ] Proper imports/exports
- [ ] Zod validation on all inputs
- [ ] Pino for logging (no console.log)
- [ ] No PII in logs
- [ ] Functions returning i18n keys (not display text)
- [ ] Reusable logic in `bot/utils/` not duplicated across flows

### Prisma Schema (.prisma)
- [ ] Uses nanoid for IDs (not cuid)
- [ ] Proper relations and indexes
- [ ] Consistent with data-model.md
- [ ] Module schemas in `prisma/schema/modules/`

### Locale Files (.ftl)
- [ ] Keys exist in BOTH ar.ftl and en.ftl
- [ ] Slug-prefixed keys for modules
- [ ] No duplicate keys
- [ ] Proper Fluent syntax

### Docker / Config
- [ ] Ports consistent between docker-compose.yml and .env
- [ ] Environment variables documented in .env.example
- [ ] No secrets committed

## Review Workflow

```
1. Owner transfers Executor result
2. READ actual files from filesystem (not summary)
3. Check against: spec.md → plan.md → constitution.md
4. Run through checklist above
5. Report findings:
   - 🔴 CRITICAL: Blocks progress, must fix now
   - 🟠 HIGH: Important, fix before next phase
   - 🟡 MEDIUM: Should fix, can batch
   - 🔵 LOW: Improvement, defer to backlog
6. For each issue: specify file, line concept, expected vs actual
7. Propose fix command for Executor
```

## Consistency Cross-Check

After reviewing code, verify consistency across:

| Check | Files to compare |
|-------|-----------------|
| Feature behavior | Code ↔ spec.md |
| Technical approach | Code ↔ plan.md |
| Task completion | Code ↔ tasks.md |
| Architecture rules | Code ↔ constitution.md |
| i18n completeness | .ts files ↔ ar.ftl + en.ftl |
| Data model | .prisma ↔ data-model.md |
| Docker config | docker-compose.yml ↔ .env ↔ .env.example |

## Common Error Patterns (from project history)

| Error | Where to check |
|-------|---------------|
| nanoid vs cuid in Prisma | schema.prisma ID fields |
| Port mismatch | docker-compose.yml vs .env |
| Missing i18n key | .ts files referencing keys not in .ftl |
| Duplicate logic | Same pattern in 2+ conversation files |
| Direct Arabic text | `ctx.reply('...')` with Arabic string |
| Missing audit log | CRUD operations without audit entry |
| RBAC bypass | Handlers without permission checks |

## Review Report Format

```
## 📋 مراجعة — [Feature/Task Name]

### الملفات المُراجعة:
- [list of files read]

### النتائج:
🔴 CRITICAL (X issues)
1. [file:concept] — [problem] → [fix]

🟠 HIGH (X issues)
1. [file:concept] — [problem] → [fix]

### التوصية:
[proceed / fix first / needs discussion]
```
