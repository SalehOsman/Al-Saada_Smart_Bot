/*
  Warnings:

  - You are about to drop the column `admin_user_id` on the `admin_scopes` table. All the data in the column will be lost.
  - You are about to drop the column `scopeType` on the `admin_scopes` table. All the data in the column will be lost.
  - You are about to drop the column `scope_id` on the `admin_scopes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_id,section_id,module_id]` on the table `admin_scopes` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `created_by` to the `admin_scopes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `section_id` to the `admin_scopes` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `admin_scopes` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "admin_scopes" DROP CONSTRAINT "admin_scopes_admin_user_id_fkey";

-- DropIndex
DROP INDEX "admin_scopes_admin_user_id_idx";

-- DropIndex
DROP INDEX "admin_scopes_admin_user_id_scopeType_scope_id_key";

-- DropIndex
DROP INDEX "admin_scopes_scopeType_scope_id_idx";

-- AlterTable
ALTER TABLE "admin_scopes" DROP COLUMN "admin_user_id",
DROP COLUMN "scopeType",
DROP COLUMN "scope_id",
ADD COLUMN     "created_by" BIGINT NOT NULL,
ADD COLUMN     "module_id" TEXT,
ADD COLUMN     "section_id" TEXT NOT NULL,
ADD COLUMN     "user_id" BIGINT NOT NULL;

-- DropEnum
DROP TYPE "ScopeType";

-- CreateIndex
CREATE INDEX "admin_scopes_user_id_idx" ON "admin_scopes"("user_id");

-- CreateIndex
CREATE INDEX "admin_scopes_section_id_idx" ON "admin_scopes"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "admin_scopes_user_id_section_id_module_id_key" ON "admin_scopes"("user_id", "section_id", "module_id");

-- AddForeignKey
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "admin_scopes" ADD CONSTRAINT "admin_scopes_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;
