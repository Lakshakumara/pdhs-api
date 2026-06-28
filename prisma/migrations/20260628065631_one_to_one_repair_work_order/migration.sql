/*
  Warnings:

  - A unique constraint covering the columns `[repairRequestId]` on the table `work_orders` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateTable
CREATE TABLE "id_sequences" (
    "prefix" TEXT NOT NULL,
    "lastSeq" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "id_sequences_pkey" PRIMARY KEY ("prefix")
);

-- CreateIndex
CREATE UNIQUE INDEX "work_orders_repairRequestId_key" ON "work_orders"("repairRequestId");
