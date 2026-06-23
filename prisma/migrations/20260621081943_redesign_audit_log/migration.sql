/*
  Warnings:

  - Made the column `description` on table `audit_logs` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "user_permissions_permission_idx";

-- DropIndex
DROP INDEX "user_permissions_userId_idx";

-- AlterTable
ALTER TABLE "audit_logs" ADD COLUMN     "ipAddress" TEXT,
ADD COLUMN     "metadata" JSONB,
ADD COLUMN     "scopeId" TEXT,
ADD COLUMN     "scopeType" TEXT,
ALTER COLUMN "timestamp" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "description" SET NOT NULL;

-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "invoiceNumber" TEXT;

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_scopeType_scopeId_idx" ON "audit_logs"("scopeType", "scopeId");

-- CreateIndex
CREATE INDEX "user_permissions_userId_permission_idx" ON "user_permissions"("userId", "permission");
