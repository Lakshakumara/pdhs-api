-- CreateEnum
CREATE TYPE "PartStatus" AS ENUM ('BUFFERED', 'CONSUMED');

-- AlterTable
ALTER TABLE "parts_used" ADD COLUMN     "status" "PartStatus" NOT NULL DEFAULT 'BUFFERED';

-- CreateIndex
CREATE INDEX "inspected_spare_part_workOrderId_idx" ON "inspected_spare_part"("workOrderId");

-- CreateIndex
CREATE INDEX "parts_used_workOrderId_idx" ON "parts_used"("workOrderId");

-- CreateIndex
CREATE INDEX "repair_requests_submissionDate_idx" ON "repair_requests"("submissionDate");
