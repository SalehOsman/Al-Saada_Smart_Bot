# Quickstart: Hierarchical Sections & Advanced Module CLI

**Feature Branch**: `006-hierarchical-sections`
**Date**: 2026-03-10
**Status**: Complete

## 1. Scaffolding Modules with Hierarchical Sections

The `npm run module:create` command has been enhanced with an interactive wizard that fetches sections directly from your database.

### Step-by-Step Flow:
1.  **Run CLI**: `npm run module:create my-new-module`
2.  **Enter Names**: Arabic/English display names (i18n keys).
3.  **Choose Main Section**: A list of all top-level sections is displayed.
    - Choose an existing one (e.g., "HR").
    - Choose "Create New Main Section".
4.  **Choose Sub-section** (if a Main Section was chosen):
    - Choose an existing sub-section (e.g., "Recruitment").
    - Choose "Create New Sub-section".
    - Choose "Skip (Directly under Main Section)".
5.  **Confirm Scaffolding**: The CLI generates all required files with the correct `sectionSlug`.

## 2. Testing Hierarchical Navigation (Bot)

1.  **Launch Bot**: `npm run dev`
2.  **Open Main Menu**: `ctx.reply` or `/start`.
3.  **Main Menu**: You should see your Main Sections as buttons.
4.  **Drill Down**:
    - Clicking a Main Section button opens a menu showing its sub-sections and direct modules.
    - Clicking a sub-section opens a final menu with its modules.
    - All menus include a "Back" button for easy traversal.

## 3. Database Management

You can still manage sections manually via Prisma Studio:
- `npm run prisma:studio`
- Look for the `Section` model.
- Sub-sections must have a valid `parentId` pointing to a section where `parentId` is `null`.
