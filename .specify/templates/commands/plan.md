# /speckit.plan Command Workflow

This document describes the execution workflow for the `/speckit.plan` command.

## Purpose

The `/speckit.plan` command creates an implementation plan based on a feature specification. It follows a structured approach through multiple phases to ensure comprehensive planning before implementation begins.

## Input Requirements

- **Feature specification** in `/specs/[###-feature-name]/spec.md`
- **Optional**: Research notes, data model, contracts (if available)

## Execution Phases

### Phase 0: Research (Optional)

If feature involves complex technical decisions:
- Research existing patterns and implementations
- Analyze potential technical approaches
- Document findings and decisions

### Phase 1: Technical Context Analysis

Extract and document:
- Programming language and version
- Primary dependencies and frameworks
- Storage requirements
- Testing approach
- Target platform
- Performance goals and constraints
- Scale/scope considerations

### Phase 2: Constitution Alignment

Verify the feature aligns with the Al-Saada Smart Bot constitution:
- Platform-First principle (platform complete before modules)
- Config-Driven Architecture (configuration over code)
- Helper Reusability (self-contained components)
- Test-First Development (tests before implementation)
- Egyptian Business Context (local requirements)
- Security & Privacy standards
- Simplicity principles
- Monorepo structure compliance

### Phase 3: Project Structure Planning

Define concrete source code layout based on:
- Monorepo structure (packages/core, packages/module-kit, etc.)
- Module organization principles
- Testing directory structure
- Documentation location

### Phase 4: Complexity Assessment

If constitutional principles must be violated:
- Document each violation with clear rationale
- Justify why simpler alternatives were rejected
- Plan mitigation strategies

## Output Files Generated

- `/specs/[###-feature-name]/plan.md` - The complete implementation plan
- `/specs/[###-feature-name]/research.md` (if Phase 0 performed)
- `/specs/[###-feature-name]/data-model.md` - Database schema and entities
- `/specs/[###-feature-name]/quickstart.md` - Setup and validation guide
- `/specs/[###-feature-name]/contracts/` - API contracts and interfaces

## Quality Gates

The plan must pass:
- Constitution Check (all principles aligned)
- Technical feasibility confirmed
- Project structure defined
- Implementation sequence logical
- Dependencies properly ordered

## Next Steps

After plan approval:
1. Use `/speckit.tasks` to generate detailed task list
2. Use `/speckit.implement` to execute the implementation plan
3. Use `/speckit.checklist` to create quality assurance checklist
