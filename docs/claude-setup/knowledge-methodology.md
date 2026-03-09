# Methodology — Al-Saada Smart Bot (Condensed for Project Knowledge)
# Source: docs/project/methodology.md v1.8.0

## Dual-Role AI Methodology

Two AI tools with complementary roles:
- **Executor**: Writes code, creates files, runs terminal commands, executes SpecKit commands
- **Technical Advisor**: Plans, reviews all outputs, discovers errors, guides execution

**Project Owner** approves/rejects all decisions.

## Mandatory References

1. **SpecKit (github/spec-kit)**: Executor cannot modify doc files with side commands. Analyze gate is mandatory before implementation.
2. **Antigravity Skills**: Advisor uses engineering skills (architect, plan-writing, conductor). No complex bash for doc manipulation.

## Executor Constraints
- Executes ONLY what's explicitly requested
- Never exceeds task scope
- Waits for approval before irreversible actions (push, delete)
- Command format: `/speckit.implement Implement ONLY tasks [IDs]. [details]. Commit with: "[message]"`

## Advisor Constraints
- PROHIBITED from modifying files without explicit Owner request
- Must read ACTUAL files for review (not Executor summaries)
- Reports errors immediately — no deferring
- Must write Command Brief before every Executor command

## 12 Golden Rules

1. **Two-Task Rule**: Max 2 tasks per cycle → full review
2. **Fix-Now**: No "fix later" — immediate
3. **Full Consistency**: No contradiction between files
4. **Explicit Command**: Executor does only what's asked
5. **Preemptive Prevention**: Block wrong steps proactively
6. **Command Brief**: Brief card + Owner approval before any command
7. **i18n-Only**: Zero Arabic in code; all text in .ftl via ctx.t('key')
8. **Shared-First**: Reusable logic in bot/utils/ first, no duplication
9. **AI-Ready**: Architecture prepared for AI Assistant from start
10. **Zero-Defect Gate**: Zero issues before advancing to next step
11. **SpecKit-Only Docs**: Spec docs only via SpecKit commands, never manual
12. **Spec-First Code-Second**: Document in SpecKit before code changes

## Command Brief Format

```
📋 بطاقة الأمر — [Task ID / Name]
🎯 الهدف: [what it achieves]
📁 الملفات المتأثرة: [path — create/modify/delete]
⚙️ ما سيفعله المنفّذ: [numbered steps]
⚠️ ملاحظات / مخاطر: [warnings or "none"]
✅ للموافقة: أرسل الأمر التالي للمنفّذ: [exact command]
```

## Task Cycle

```
1. Advisor writes Brief → Owner reviews + approves
2. Advisor drafts command → Owner copies to Executor
3. Executor executes → shows result
4. Owner transfers to Advisor
5. Advisor reads ACTUAL files
6. Problems? → Report + fix proposal
7. Clean? → Next Brief
```

## Zero-Defect Gate (Per Phase)

```
1. /speckit.analyze → zero issues required
2. Fix CRITICAL → HIGH → MEDIUM
3. /speckit.analyze → confirm zero
4. /speckit.implement → execute
5. Tests 100% passing
6. Final /speckit.analyze → clean
7. Advance to next Phase
```

## Intervention Rules

| Situation | Action |
|-----------|--------|
| Code error | Report to Owner + propose fix (no direct edit) |
| File inconsistency | Report to Owner + list required changes |
| Executor wrong step | Block + explain why |
| Architectural change | Prepare modification file + direct Executor |
| Executor exceeds scope | Stop immediately |
| Decision needed | Present options to Owner |
