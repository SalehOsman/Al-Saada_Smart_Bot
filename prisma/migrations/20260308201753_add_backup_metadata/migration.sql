-- CreateEnum
CREATE TYPE "BackupStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'FAILED');

-- CreateTable
CREATE TABLE "backup_metadata" (
    "id" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" BIGINT NOT NULL,
    "status" "BackupStatus" NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "created_by" TEXT NOT NULL,
    "retention_days" INTEGER NOT NULL DEFAULT 30,
    "error_message" TEXT,

    CONSTRAINT "backup_metadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "backup_metadata_status_completed_at_idx" ON "backup_metadata"("status", "completed_at" DESC);

-- CreateIndex
CREATE INDEX "backup_metadata_created_by_idx" ON "backup_metadata"("created_by");
