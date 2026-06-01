/*
  Warnings:

  - Added the required column `grnNumber` to the `grns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `poNumber` to the `grns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `purchaseOrderId` to the `grns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `receivedDate` to the `grns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `grns` table without a default value. This is not possible if the table is not empty.
  - Added the required column `inventoryItemId` to the `parts_used` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "work_orders" DROP CONSTRAINT "work_orders_assignedTechnicianId_fkey";

-- AlterTable
ALTER TABLE "grns" ADD COLUMN     "grnNumber" TEXT NOT NULL,
ADD COLUMN     "poNumber" TEXT NOT NULL,
ADD COLUMN     "purchaseOrderId" TEXT NOT NULL,
ADD COLUMN     "receivedDate" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "parts_used" ADD COLUMN     "inventoryItemId" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "work_orders" ALTER COLUMN "assignedTechnicianId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "work_orders" ADD CONSTRAINT "work_orders_assignedTechnicianId_fkey" FOREIGN KEY ("assignedTechnicianId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "parts_used" ADD CONSTRAINT "parts_used_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
