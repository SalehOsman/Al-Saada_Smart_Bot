/*
  Warnings:

  - Changed the type of `action` on the `audit_logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('USER_BOOTSTRAP', 'USER_LOGIN', 'USER_LOGOUT', 'ROLE_CHANGE', 'USER_APPROVE', 'USER_REJECT', 'USER_ACTIVATE', 'USER_DEACTIVATE', 'JOIN_REQUEST_SUBMIT', 'SECTION_CREATE', 'SECTION_UPDATE', 'SECTION_DELETE', 'SECTION_ENABLE', 'SECTION_DISABLE', 'MODULE_REGISTER', 'MODULE_UNREGISTER', 'MODULE_ENABLE', 'MODULE_DISABLE', 'MAINTENANCE_ON', 'MAINTENANCE_OFF', 'PERMISSION_CHANGE', 'ADMIN_SCOPE_ASSIGN', 'ADMIN_SCOPE_REVOKE');

-- AlterTable
ALTER TABLE "audit_logs" DROP COLUMN "action",
ADD COLUMN     "action" "AuditAction" NOT NULL;

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");
