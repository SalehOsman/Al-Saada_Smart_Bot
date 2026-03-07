/*
  Warnings:

  - The values [SYSTEM,JOIN_REQUEST,APPROVAL,REJECTION,ANNOUNCEMENT] on the enum `NotificationType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('JOIN_REQUEST_NEW', 'JOIN_REQUEST_APPROVED', 'JOIN_REQUEST_REJECTED', 'USER_DEACTIVATED', 'MAINTENANCE_ON', 'MAINTENANCE_OFF');
ALTER TABLE "notifications" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;
