---
name: speckit-advisor
description: >
  SpecKit command reference and workflow guidance for Al-Saada Smart Bot.
  Use when drafting SpecKit commands, fixing analyze issues, planning phases,
  or when user mentions speckit, spec, plan, tasks, constitution, analyze,
  implement, or any documentation workflow.
metadata:
  author: Al-Saada Project
  version: 1.0.0
  project: al-saada-smart-bot
---

# SpecKit Advisor — Command Reference & Workflow

## Mandatory Workflow Sequence

```
1. /speckit.constitution  → Governing principles
2. /speckit.specify       → Functional specs (WHAT + WHY, no tech)
3. /speckit.clarify       → Clarify requirements (optional)
4. /speckit.plan          → Technical plan (HOW, tech decisions here)
5. /speckit.tasks         → Task list from plan
6. /speckit.analyze       → Consistency check (MANDATORY GATE)
7. Fix issues             → Using the correct command per file
8. /speckit.analyze       → Confirm zero issues
9. /speckit.implement     → Execute code (Executor only)
10. /speckit.analyze      → Final check
```

## Command → File Mapping (CRITICAL)

| File to modify | Correct command | WRONG command |
|---------------|----------------|---------------|
| constitution.md | `/speckit.constitution` | `/speckit.implement` or bash |
| spec.md | `/speckit.specify` | `/speckit.implement` or bash |
| plan.md | `/speckit.plan` | `/speckit.implement` or bash |
| tasks.md | `/speckit.tasks` | `/speckit.implement` or bash |
| Code files (.ts, .prisma, .ftl) | `/speckit.implement` | `/speckit.specify` |
| checklists/*.md | `/speckit.checklist` | any other |

**Rule**: Each file has its dedicated command. No exceptions. No manual edits to spec files.

## Fixing /speckit.analyze Issues

| Issue location | Fix via | Example |
|---------------|---------|---------|
| spec.md (duplication, ambiguity) | `/speckit.specify Update spec.md to fix [ID]...` | Fix D1 |
| plan.md (missing structure) | `/speckit.plan Update plan.md to fix [ID]...` | Fix I1 |
| tasks.md (missing step) | `/speckit.tasks Update tasks.md to fix [ID]...` | Fix U1 |
| constitution.md (duplication) | `/speckit.constitution Update to fix [ID]...` | Fix I2 |
| Cross-file conflict | Fix the HIGHER authority file first | spec > plan > tasks |

## Authority Hierarchy

```
constitution.md  (highest — overrides all)
    ↓
spec.md          (what + why)
    ↓
plan.md          (how — technical)
    ↓
tasks.md         (detailed steps)
    ↓
Code             (lowest — follows all above)
```

## Implement Command Format

```
/speckit.implement Implement ONLY tasks [IDs].
[Precise description of what to create].
Commit with: "[conventional commit message]"
```

**Critical**: `/speckit.implement` NEVER modifies documentation files. It ONLY writes code.

## Zero-Defect Gate Sequence (Per Phase)

```
1. /speckit.analyze → must be zero issues
2. Fix CRITICAL → HIGH → MEDIUM
3. /speckit.analyze again → confirm zero
4. /speckit.implement → execute
5. All tests 100% passing
6. Final /speckit.analyze → clean state
7. ONLY THEN advance to next Phase
```

## Project File Structure

```
.specify/memory/constitution.md    ← /speckit.constitution
specs/
├── 001-platform-core/             ← Layer 1
│   ├── spec.md, plan.md, tasks.md
├── 002-ai-assistant/              ← Layer 4 (AI)
├── 003-module-kit/                ← Layer 2
│   ├── spec.md, plan.md, tasks.md
│   ├── data-model.md, quickstart.md, research.md
│   ├── contracts/, checklists/
├── 005-production-readiness/      ← Phase 3
└── main/
```

## Common Mistakes to Prevent

- Using `/speckit.implement` to modify spec/plan/tasks files
- Running `/speckit.implement` before `/speckit.analyze` passes
- Manual bash edits to any SpecKit documentation
- Skipping CRITICAL issues and advancing
- Writing specs with technical details (tech goes in plan only)
- Executor generating full files instead of targeted edits
