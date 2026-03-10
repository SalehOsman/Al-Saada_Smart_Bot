# Data Model: Hierarchical Sections

**Feature Branch**: `006-hierarchical-sections`
**Date**: 2026-03-10
**Status**: Complete

## Section Hierarchy (Self-Referencing Relationship)

The `Section` model supports a hierarchical structure with a maximum depth of two levels: Main Section and Sub-section.

```prisma
model Section {
  id         String   @id @default(cuid())
  slug       String   @unique
  name       String // Arabic name (i18n key)
  nameEn     String // English name (i18n key)
  icon       String // Emoji (e.g., "📁", "💼")
  parentId   String?  @map("parent_id") // Self-referential FK - nullable for main sections; when set, defines sub-section
  isActive   Boolean  @default(true) @map("is_active")
  orderIndex Int      @default(0) @map("order_index")
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")
  createdBy  BigInt?  @map("created_by")

  // Hierarchical Relations
  parent     Section?  @relation("SectionHierarchy", fields: [parentId], references: [id])
  children   Section[] @relation("SectionHierarchy")
  
  // Entity Relations
  modules     Module[]
  adminScopes AdminScope[]

  @@index([isActive])
  @@index([orderIndex])
  @@index([parentId])
  @@map("sections")
}
```

### Hierarchy Rules:
1. **Main Section**: Any section where `parentId` is `null`.
2. **Sub-section**: Any section where `parentId` is NOT `null`.
3. **Max Depth**: Only one level of nesting is allowed (Main -> Sub). `sectionService.create` and `update` already enforce this by checking if the parent section also has a parent.
4. **Module Assignment**: A module (`Module.sectionId`) can point to either a Main Section or a Sub-section.

### AdminScope Rules:
1. **Direct Scope**: If `AdminScope.sectionId` points to a Main Section, the user has access to that section and its sub-sections (recursively resolved).
2. **Sub-section Scope**: If `AdminScope.sectionId` points to a Sub-section, the user has access ONLY to that sub-section's modules.
3. **Inheritance**: No explicit inheritance is needed in the database; it's handled by service-level logic (`sectionService.getActiveModules` and `sectionService.getAncestors`).
