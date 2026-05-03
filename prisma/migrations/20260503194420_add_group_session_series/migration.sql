-- CreateEnum
CREATE TYPE "GroupSessionSeriesStatus" AS ENUM ('active', 'paused', 'ended');

-- AlterTable
ALTER TABLE "group_sessions" ADD COLUMN "series_id" TEXT;

-- CreateTable
CREATE TABLE "group_session_series" (
    "id" TEXT NOT NULL,
    "business_id" TEXT NOT NULL,
    "service_id" TEXT NOT NULL,
    "staff_id" TEXT,
    "branch_id" TEXT,
    "days_of_week" INTEGER[],
    "start_time" TEXT NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE,
    "occurrence_count" INTEGER,
    "max_participants" INTEGER NOT NULL,
    "notes" TEXT,
    "status" "GroupSessionSeriesStatus" NOT NULL DEFAULT 'active',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "group_session_series_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "group_session_series_business_id_status_idx" ON "group_session_series"("business_id", "status");

-- CreateIndex
CREATE INDEX "group_sessions_series_id_idx" ON "group_sessions"("series_id");

-- AddForeignKey
ALTER TABLE "group_sessions" ADD CONSTRAINT "group_sessions_series_id_fkey" FOREIGN KEY ("series_id") REFERENCES "group_session_series"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_session_series" ADD CONSTRAINT "group_session_series_business_id_fkey" FOREIGN KEY ("business_id") REFERENCES "businesses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
