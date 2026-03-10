# Research: Hierarchical Sections & Advanced Module CLI

**Feature Branch**: `006-hierarchical-sections`
**Date**: 2026-03-10
**Status**: Complete

## Decision 1: Database Schema Alignment
- **Decision**: The `Section` model already contains a self-referencing `parentId` field as of migration `20260304031327_section_hierarchy`.
- **Rationale**: The schema is already capable of supporting a 2-level hierarchy. No further schema changes are required, only logic updates in services and handlers.
- **Alternatives Considered**: Using a many-to-many relationship for sections. Rejected because the project strictly defines a 2-level (Main -> Sub) hierarchy for simplicity (Principle VIII).

## Decision 2: CLI Interactivity with Inquirer
- **Decision**: Update `scripts/module-create.ts` to use `inquirer` for fetching and displaying sections as a list.
- **Rationale**: Prevents typos and manual slug lookups. Step 1: List all `parentId: null` sections. Step 2: List sub-sections filtered by selection + "Skip" + "Create New".
- **Implementation**: Use a dedicated Prisma client instance within the script to fetch data before prompting.

## Decision 3: Telegram Navigation Drill-Down
- **Decision**: Update `packages/core/src/bot/handlers/menu.ts` to list Main Sections directly in the Main Menu for authorized users, instead of a generic "Sections" button.
- **Rationale**: Aligns with `SC-002`. It reduces the number of clicks to reach a module while maintaining hierarchy.
- **Refinement**: If a user has `AdminScope` for only one section, the bot could potentially skip to that section, but for now, we will follow the explicit hierarchy Main Menu -> Main Section -> Sub-section -> Module.

## Decision 4: AdminScope Backward Compatibility
- **Decision**: `AdminScope` currently references `sectionId`. If an `AdminScope` points to a Main Section, the user should have access to all modules in that section AND all modules in its sub-sections.
- **Rationale**: `sectionService.getActiveModules` already implements this logic (it recursively fetches modules if it's a main section).
- **Verification**: Ensure `getAuthorizedModules` in `menu.ts` uses the `sectionService` or similar recursive logic.

## Decision 5: CLI New Section Creation
- **Decision**: If "Create New" is selected in CLI, prompt for `ar` and `en` names and `icon`.
- **Rationale**: Enables full scaffolding without Prisma Studio, satisfying `SC-001`.
