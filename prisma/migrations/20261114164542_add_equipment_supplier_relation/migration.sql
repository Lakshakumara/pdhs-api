-- AlterTable
ALTER TABLE "equipment" ADD COLUMN     "supplierId" TEXT;

-- CreateIndex
CREATE INDEX "equipment_supplierId_idx" ON "equipment"("supplierId");

-- AddForeignKey
ALTER TABLE "equipment" ADD CONSTRAINT "equipment_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE;
