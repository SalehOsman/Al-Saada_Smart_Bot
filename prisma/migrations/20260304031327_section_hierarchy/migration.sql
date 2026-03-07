/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `modules` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `sections` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `modules` table without a default value. This is not possible if the table is not empty.
  - Added the required column `slug` to the `sections` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_TRIGGER';
ALTER TYPE "AuditAction" ADD VALUE 'BACKUP_RESTORE';
ALTER TYPE "AuditAction" ADD VALUE 'MODULE_CREATE';
ALTER TYPE "AuditAction" ADD VALUE 'MODULE_UPDATE';
ALTER TYPE "AuditAction" ADD VALUE 'MODULE_DELETE';

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'MODULE_OPERATION';

-- DropForeignKey
ALTER TABLE "admin_scopes" DROP CONSTRAINT "admin_scopes_section_id_fkey";

-- AlterTable
ALTER TABLE "modules" ADD COLUMN     "slug" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "sections" ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "slug" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "modules_slug_key" ON "modules"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "sections_slug_key" ON "sections"("slug");

-- CreateIndex
CREATE INDEX "sections_parent_id_idx" ON "sections"("parent_id");

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
