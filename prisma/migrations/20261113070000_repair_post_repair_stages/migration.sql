-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "completedDate" TIMESTAMP(3),
ADD COLUMN     "feedbackComment" TEXT,
ADD COLUMN     "msApprovalComment" TEXT,
ADD COLUMN     "paymentComment" TEXT,
ADD COLUMN     "pdhsApprovalComment" TEXT,
ADD COLUMN     "rdhsApprovalComment" TEXT;
