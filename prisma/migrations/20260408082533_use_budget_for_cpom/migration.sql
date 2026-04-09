/*
  Warnings:

  - A unique constraint covering the columns `[cpomId,year,cpomStructureType]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "CpomMillesime" DROP CONSTRAINT "CpomMillesime_cpomId_fkey";

-- AlterTable
ALTER TABLE "Budget" ADD COLUMN     "cpomId" INTEGER,
ADD COLUMN     "cpomStructureType" "StructureType";

-- CreateIndex
CREATE UNIQUE INDEX "Budget_cpomId_year_cpomStructureType_key" ON "Budget"("cpomId", "year", "cpomStructureType");

-- AddForeignKey
ALTER TABLE "Budget" ADD CONSTRAINT "Budget_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
