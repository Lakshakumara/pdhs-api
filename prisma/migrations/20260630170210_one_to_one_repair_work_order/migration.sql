/*
  Warnings:

  - You are about to drop the column `contactName` on the `suppliers` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "suppliers" DROP COLUMN "contactName",
ADD COLUMN     "contactPerson" TEXT,
ADD COLUMN     "remarks" TEXT,
ADD COLUMN     "supplyItem" JSONB;

-- AlterTable
ALTER TABLE "work_orders" ADD COLUMN     "repairTrack" TEXT NOT NULL DEFAULT 'INTERNAL';

-- CreateTable
CREATE TABLE "vendor_repairs" (
    "id" TEXT NOT NULL,
    "workOrderId" TEXT NOT NULL,
    "vendorName" TEXT NOT NULL,
    "vendorContact" TEXT,
    "vendorEmail" TEXT,
    "repairBasis" TEXT NOT NULL,
    "handoverType" TEXT NOT NULL,
    "dispatchDate" TIMESTAMP(3),
    "dispatchedBy" TEXT,
    "courierRef" TEXT,
    "scheduledDate" TIMESTAMP(3),
    "visitLocation" TEXT,
    "vendorRefNumber" TEXT,
    "returnDate" TIMESTAMP(3),
    "returnNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendor_repairs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vendor_repairs_workOrderId_key" ON "vendor_repairs"("workOrderId");

-- CreateIndex
CREATE INDEX "vendor_repairs_repairBasis_idx" ON "vendor_repairs"("repairBasis");

-- CreateIndex
CREATE INDEX "vendor_repairs_handoverType_idx" ON "vendor_repairs"("handoverType");

-- AddForeignKey
ALTER TABLE "vendor_repairs" ADD CONSTRAINT "vendor_repairs_workOrderId_fkey" FOREIGN KEY ("workOrderId") REFERENCES "work_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
