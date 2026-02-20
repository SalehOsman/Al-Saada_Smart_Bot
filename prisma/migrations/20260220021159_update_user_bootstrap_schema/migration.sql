/*
  Warnings:

  - You are about to drop the column `message` on the `join_requests` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `join_requests` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `join_requests` table. All the data in the column will be lost.
  - You are about to drop the column `first_name` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `last_name` on the `users` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[telegram_id]` on the table `join_requests` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[phone]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[national_id]` on the table `users` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `full_name` to the `join_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `national_id` to the `join_requests` table without a default value. This is not possible if the table is not empty.
  - Added the required column `full_name` to the `users` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `users` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "join_requests" DROP CONSTRAINT "join_requests_user_id_fkey";

-- DropIndex
DROP INDEX "join_requests_created_at_idx";

-- DropIndex
DROP INDEX "join_requests_status_idx";

-- DropIndex
DROP INDEX "join_requests_user_id_idx";

-- DropIndex
DROP INDEX "users_is_active_idx";

-- DropIndex
DROP INDEX "users_role_idx";

-- DropIndex
DROP INDEX "users_telegram_id_idx";

-- AlterTable
ALTER TABLE "join_requests" DROP COLUMN "message",
DROP COLUMN "name",
DROP COLUMN "user_id",
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "national_id" TEXT NOT NULL,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "telegram_id" BIGINT;

-- AlterTable
ALTER TABLE "users" DROP COLUMN "first_name",
DROP COLUMN "last_name",
ADD COLUMN     "full_name" TEXT NOT NULL,
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "last_active_at" TIMESTAMP(3),
ADD COLUMN     "national_id" TEXT,
ADD COLUMN     "nickname" TEXT,
ADD COLUMN     "telegram_username" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "join_requests_telegram_id_key" ON "join_requests"("telegram_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_id_key" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "users_national_id_key" ON "users"("national_id");

-- AddForeignKey
ALTER TABLE "join_requests" ADD CONSTRAINT "join_requests_telegram_id_fkey" FOREIGN KEY ("telegram_id") REFERENCES "users"("telegram_id") ON DELETE SET NULL ON UPDATE CASCADE;
