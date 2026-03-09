# SpecKit Reference — Al-Saada Smart Bot (Condensed for Project Knowledge)
# Source: docs/project/speckit-reference.md v1.0.0

## Philosophy: Spec-Driven Development

```
Spec (what + why) → Plan (how) → Tasks (steps) → Code (implement)
```

Golden rule: Specs are the single source of truth. Conflicts → back to specs.

## Commands

| Command | Purpose | Output | Who |
|---------|---------|--------|-----|
| `/speckit.constitution` | Create/modify governing principles | `.specify/memory/constitution.md` | Advisor drafts |
| `/speckit.specify` | Functional specs (WHAT + WHY, no tech) | `specs/[name]/spec.md` | Advisor drafts |
| `/speckit.clarify` | Clarify ambiguous requirements | Updates spec.md | Advisor/Owner |
| `/speckit.plan` | Technical plan (HOW, tech here) | `specs/[name]/plan.md` + extras | Advisor drafts |
| `/speckit.tasks` | Generate task list from plan | `specs/[name]/tasks.md` | Advisor drafts |
| `/speckit.analyze` | Check consistency across all docs | Issue report (CRIT→HIGH→MED→LOW) | Executor runs |
| `/speckit.implement` | Write actual code | Code files only | Executor runs |
| `/speckit.checklist` | Generate quality checklists | `specs/[name]/checklists/*.md` | Either |

## File → Command Mapping

| File | Correct command | NEVER use |
|------|----------------|-----------|
| constitution.md | `/speckit.constitution` | implement or bash |
| spec.md | `/speckit.specify` | implement or bash |
| plan.md | `/speckit.plan` | implement or bash |
| tasks.md | `/speckit.tasks` | implement or bash |
| Code (.ts, .prisma, .ftl) | `/speckit.implement` | specify or plan |

## Authority Hierarchy

constitution (highest) → spec → plan → tasks → code (lowest)

## Fixing Analyze Issues

| Issue in | Fix with |
|----------|----------|
| spec.md | `/speckit.specify Update spec.md to fix [ID]...` |
| plan.md | `/speckit.plan Update plan.md to fix [ID]...` |
| tasks.md | `/speckit.tasks Update tasks.md to fix [ID]...` |
| constitution.md | `/speckit.constitution Update to fix [ID]...` |
| Cross-file | Fix higher-authority file first |

## Implement Command Format

```
/speckit.implement Implement ONLY tasks [IDs].
[What to create]. [What NOT to create].
Commit with: "[conventional commit]"
```

⚠️ `/speckit.implement` NEVER touches documentation files. Code only.

## Project Specs Structure

```
specs/
├── 001-platform-core/    (Layer 1)
├── 002-ai-assistant/     (Layer 4 - AI)
├── 003-module-kit/       (Layer 2)
├── 005-production-readiness/
└── main/
```

## Documentation Language

All SpecKit files must be written in **English**.
docs/ files (methodology, wiki) can be in Arabic per Owner request.
