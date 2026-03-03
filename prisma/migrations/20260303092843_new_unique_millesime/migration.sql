/*
  Warnings:

  - A unique constraint covering the columns `[structureId,year]` on the table `StructureMillesime` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "StructureMillesime_structureDnaCode_year_key";

-- CreateIndex
CREATE UNIQUE INDEX "StructureMillesime_structureId_year_key" ON "StructureMillesime"("structureId", "year");
