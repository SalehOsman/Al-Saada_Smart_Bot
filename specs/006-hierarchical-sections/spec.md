# Feature Specification: Hierarchical Sections & Advanced Module CLI

**Feature Branch**: `006-hierarchical-sections`  
**Created**: 2026-03-10  
**Status**: In Progress  
**Input**: User description: "Create an additional layer for sub-sections if they do not exist in the module creation dialog... When choosing a main section, it asks to choose a sub-section... If none, it asks to create a new one or skip to place the module directly in the main section."

## Clarifications

- **Q: How are sub-sections modeled in the database?**  
  A: By adding an optional `parentId` field to the `Section` model in `platform.prisma`, creating a self-referencing relationship. Null `parentId` means it's a main section.
- **Q: Can a module belong to a main section directly?**  
  A: Yes, sub-sections are optional. A module can be placed directly under a Main Section, preserving backward compatibility and flexibility.
- **Q: How does this affect the Telegram GUI Navigation (Layer 1)?**  
  A: When a user selects a main section (e.g., HR) from the main menu, the bot will display both its direct modules and its sub-sections (e.g., Recruitment, Payroll) as inline buttons. Clicking a sub-section opens a deeper menu showing its specific modules.
- **Q: How does the `module:create` CLI handle this?**  
  A: It queries the database first. Step 1: Select Main Section (List) or Create New. Step 2: Select Sub-section (List filtered by Main Section), Create New, or Skip.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST support hierarchical sections in the database schema via a `parentId` relation on the `Section` model.
- **FR-002**: System MUST modify the `npm run module:create` CLI tool to fetch existing sections from the database and present them as an interactive list using `inquirer` choices.
- **FR-003**: System MUST allow the developer to create a new Main Section directly from the `module:create` CLI wizard (asking for ar/en names).
- **FR-004**: System MUST prompt the developer to select, create, or seamlessly skip a Sub-section after a Main Section is determined in the CLI.
- **FR-005**: System MUST update the Platform Core (Layer 1) Telegram Navigation routing to support navigating into sub-sections before displaying modules.
- **FR-006**: System MUST gracefully handle backwards compatibility for existing `AdminScope` and module assignments, ensuring modules attached to main sections still function flawlessly.

### Quality Attributes

- **QA-001 (Usability/DX)**: The `module:create` CLI interactive prompts must prevent typos, manual database lookups, and DB ID errors, drastically improving Developer Experience (DX).

### Key Entities

- **Section**: Enhanced with `parentId` (String, optional), `parent` (relation), and `subSections` (relation).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Developer can scaffold a new module into a brand new main section and a brand new sub-section purely via the CLI prompt, without opening Prisma Studio or writing SQL.
- **SC-002**: Telegram bot correctly displays the multi-level hierarchy visually: Main Menu ➔ HR Section Menu (shows 'Payroll') ➔ Payroll Sub-section Menu ➔ 'Employee Salary' Module.
- **SC-003**: Existing modules assigned directly to main sections (without sub-sections) remain fully accessible and visible to users with matching AdminScope, requiring zero manual migration after the feature is deployed.
