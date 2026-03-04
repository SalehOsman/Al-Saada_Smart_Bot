---
description: Perform a non-destructive cross-artifact consistency and quality analysis across spec.md, plan.md, and tasks.md after task generation.
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding (if not empty).

## Goal

Identify inconsistencies, duplications, ambiguities, and underspecified items across the three core artifacts (`spec.md`, `plan.md`, `tasks.md`) before implementation. This command MUST run only after `/speckit.tasks` has successfully produced a complete `tasks.md`.

## Operating Constraints

**STRICTLY READ-ONLY**: Do **not** modify any files. Output a structured analysis report. Offer an optional remediation plan (user must explicitly approve before any follow-up editing commands would be invoked manually).

**Constitution Authority**: The project constitution (`.specify/memory/constitution.md`) is **non-negotiable** within this analysis scope. Constitution conflicts are automatically CRITICAL and require adjustment of the spec, plan, or tasks—not dilution, reinterpretation, or silent ignoring of the principle. If a principle itself needs to change, that must occur in a separate, explicit constitution update outside `/speckit.analyze`.

## Execution Steps

### 1. Initialize Analysis Context

Run `.specify/scripts/powershell/check-prerequisites.ps1 -Json -RequireTasks -IncludeTasks` once from repo root and parse JSON for FEATURE_DIR and AVAILABLE_DOCS. Derive absolute paths:

- SPEC = FEATURE_DIR/spec.md
- PLAN = FEATURE_DIR/plan.md
- TASKS = FEATURE_DIR/tasks.md

Abort with an error message if any required file is missing (instruct the user to run missing prerequisite command).
For single quotes in args like "I'm Groot", use escape syntax: e.g 'I'\''m Groot' (or double-quote if possible: "I'm Groot").

### 2. Load Artifacts (Progressive Disclosure)

Load only the minimal necessary context from each artifact:

**From spec.md:**

- Overview/Context
- Functional Requirements
- Non-Functional Requirements
- User Stories
- Edge Cases (if present)

**From plan.md:**

- Architecture/stack choices
- Data Model references
- Phases
- Technical constraints

**From tasks.md:**

- Task IDs
- Descriptions
- Phase grouping
- Parallel markers [P]
- Referenced file paths

**From constitution:**

- Load `.specify/memory/constitution.md` for principle validation

### 2.5. Load Codebase Context (False-Positive Prevention)

This step prevents false positives by verifying documentation claims against the actual filesystem. **Do NOT skip this step.**

**2.5.1 Extract Referenced Paths**

Scan all task descriptions in `tasks.md` for file path patterns (e.g., `packages/*/src/**/*.ts`, `modules/*/config.ts`). Build a list of all referenced paths.

**2.5.2 Verify File Existence**

For each referenced path, use `find_by_name` or `list_dir` to check if the file or directory exists in the repository. Record results in a **Codebase Evidence Map**:

```
{ filePath → { exists: boolean, taskIds: string[], isMarkedComplete: boolean } }
```

**2.5.3 Scan Test Files**

Find all `*.test.ts` and `*.spec.ts` files in the project using `find_by_name`. Map each test file to the component/feature it tests (by filename convention, e.g., `sanitize.test.ts` → sanitization, `phone.test.ts` → phone validation).

**2.5.4 Task Completion Cross-Check**

For tasks marked `[x]` (completed):
- Verify their referenced files exist. If files are missing → flag as **real issue** (task marked done but code missing).

For tasks marked `[ ]` (incomplete):
- Check if referenced files already exist (possibly implemented by another feature or task). If files exist → note as **potential missed completion**.

**2.5.5 Cross-Feature File Ownership**

If analyzing multiple features, check if a file referenced in Feature A's tasks was created by Feature B's tasks (cross-feature implementation). Record these cross-references to avoid false "missing implementation" reports.

### 3. Build Semantic Models

Create internal representations (do not include raw artifacts in output):

- **Requirements inventory**: Each functional + non-functional requirement with a stable key (derive slug based on imperative phrase; e.g., "User can upload file" → `user-can-upload-file`)
- **User story/action inventory**: Discrete user actions with acceptance criteria
- **Task coverage mapping**: Map each task to one or more requirements or stories (inference by keyword / explicit reference patterns like IDs or key phrases)
- **Constitution rule set**: Extract principle names and MUST/SHOULD normative statements

### 4. Detection Passes (Token-Efficient Analysis)

Focus on high-signal findings. Limit to 50 findings total; aggregate remainder in overflow summary.

#### A. Duplication Detection

- Identify near-duplicate requirements
- Mark lower-quality phrasing for consolidation

#### B. Ambiguity Detection

- Flag vague adjectives (fast, scalable, secure, intuitive, robust) lacking measurable criteria
- Flag unresolved placeholders (TODO, TKTK, ???, `<placeholder>`, etc.)

#### C. Underspecification

- Requirements with verbs but missing object or measurable outcome
- User stories missing acceptance criteria alignment
- Tasks referencing files or components not defined in spec/plan
- **⚠️ Codebase Check**: Before flagging "no task exists for X", consult the Codebase Evidence Map. If a file implementing X already exists, do NOT report as underspecification. Instead, note it as a potential documentation gap (task may need to be marked `[x]`).

#### D. Constitution Alignment

- Any requirement or plan element conflicting with a MUST principle
- Missing mandated sections or quality gates from constitution

#### E. Coverage Gaps

- Requirements with zero associated tasks
- Tasks with no mapped requirement/story
- Non-functional requirements not reflected in tasks (e.g., performance, security)
- **⚠️ Codebase Check**: Before flagging "no test task for X", check the test file scan from Step 2.5.3. If `*.test.ts` files already cover X, do NOT report as a coverage gap. Mark as `Code Verified = ✅` in the report.

#### F. Inconsistency

- Terminology drift (same concept named differently across files)
- Data entities referenced in plan but absent in spec (or vice versa)
- Task ordering contradictions (e.g., integration tasks before foundational setup tasks without dependency note)
- Conflicting requirements (e.g., one requires Next.js while other specifies Vue)
- **⚠️ Codebase Check**: Before flagging "file not found in spec", verify if the file exists in another feature's scope (cross-feature implementation from Step 2.5.5). If so, note the cross-reference rather than reporting an inconsistency.

#### G. Code-Documentation Sync (NEW)

Using the Codebase Evidence Map from Step 2.5, detect:

- **Phantom completions**: Tasks marked `[x]` where referenced files do NOT exist in the filesystem → report as HIGH severity
- **Missed completions**: Tasks marked `[ ]` where referenced files already exist (implemented by another feature or undocumented work) → report as MEDIUM severity with recommendation to update task status
- **Orphaned code**: Source files in `src/` that are not referenced by ANY task → report as LOW severity informational

### 5. Severity Assignment

Use this heuristic to prioritize findings:

- **CRITICAL**: Violates constitution MUST, missing core spec artifact, or requirement with zero coverage that blocks baseline functionality
- **HIGH**: Duplicate or conflicting requirement, ambiguous security/performance attribute, untestable acceptance criterion
- **MEDIUM**: Terminology drift, missing non-functional task coverage, underspecified edge case
- **LOW**: Style/wording improvements, minor redundancy not affecting execution order

### 6. Produce Compact Analysis Report

Output a Markdown report (no file writes) with the following structure:

## Specification Analysis Report

| ID | Category | Severity | Location(s) | Code Verified? | Summary | Recommendation |
|----|----------|----------|-------------|----------------|---------|----------------|
| A1 | Duplication | HIGH | spec.md:L120-134 | ⚠️ | Two similar requirements ... | Merge phrasing; keep clearer version |

(Add one row per finding; generate stable IDs prefixed by category initial.)

**Code Verified? column values:**
- `✅` = Finding confirmed by codebase verification (file/test checked and issue is real)
- `⚠️` = Could not verify against codebase (no file path referenced, documentation-only issue)
- `❌` = Finding contradicted by codebase (file/test exists — potential false positive, investigate before acting)

**IMPORTANT**: Findings marked `❌` should be reported but with reduced severity and a note explaining the contradiction. The user should investigate before applying any remediation.

**Coverage Summary Table:**

| Requirement Key | Has Task? | Task IDs | Notes |
|-----------------|-----------|----------|-------|

**Constitution Alignment Issues:** (if any)

**Unmapped Tasks:** (if any)

**Metrics:**

- Total Requirements
- Total Tasks
- Coverage % (requirements with >=1 task)
- Ambiguity Count
- Duplication Count
- Critical Issues Count

### 7. Provide Next Actions

At end of report, output a concise Next Actions block:

- If CRITICAL issues exist: Recommend resolving before `/speckit.implement`
- If only LOW/MEDIUM: User may proceed, but provide improvement suggestions
- Provide explicit command suggestions: e.g., "Run /speckit.specify with refinement", "Run /speckit.plan to adjust architecture", "Manually edit tasks.md to add coverage for 'performance-metrics'"

### 8. Offer Remediation

Ask the user: "Would you like me to suggest concrete remediation edits for the top N issues?" (Do NOT apply them automatically.)

## Operating Principles

### Context Efficiency

- **Minimal high-signal tokens**: Focus on actionable findings, not exhaustive documentation
- **Progressive disclosure**: Load artifacts incrementally; don't dump all content into analysis
- **Token-efficient output**: Limit findings table to 50 rows; summarize overflow
- **Deterministic results**: Rerunning without changes should produce consistent IDs and counts

### Analysis Guidelines

- **NEVER modify files** (this is read-only analysis)
- **NEVER hallucinate missing sections** (if absent, report them accurately)
- **Prioritize constitution violations** (these are always CRITICAL)
- **Use examples over exhaustive rules** (cite specific instances, not generic patterns)
- **Report zero issues gracefully** (emit success report with coverage statistics)

## Context

$ARGUMENTS
