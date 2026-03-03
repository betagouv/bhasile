/*
  Warnings:

  - A unique constraint covering the columns `[structureId,year]` on the table `Budget` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Budget_structureDnaCode_year_key";

-- CreateIndex
CREATE UNIQUE INDEX "Budget_structureId_year_key" ON "Budget"("structureId", "year");
