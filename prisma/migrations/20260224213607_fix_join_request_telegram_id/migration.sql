/*
  Warnings:

  - Made the column `telegram_id` on table `join_requests` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "join_requests" DROP CONSTRAINT "join_requests_telegram_id_fkey";

-- DropIndex
DROP INDEX "join_requests_telegram_id_key";

-- AlterTable
ALTER TABLE "join_requests" ALTER COLUMN "telegram_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_telegram_id_fkey" FOREIGN KEY ("telegram_id") REFERENCES "users"("telegram_id") ON DELETE RESTRICT ON UPDATE CASCADE;
