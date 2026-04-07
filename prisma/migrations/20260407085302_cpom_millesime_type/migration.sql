/*
  Warnings:

  - A unique constraint covering the columns `[cpomId,year,type]` on the table `CpomMillesime` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "CpomMillesime_cpomId_year_key";

-- AlterTable
ALTER TABLE "CpomMillesime" ADD COLUMN     "excedentDeduit" DOUBLE PRECISION,
ADD COLUMN     "excedentRecupere" DOUBLE PRECISION,
ADD COLUMN     "totalCharges" DOUBLE PRECISION,
ADD COLUMN     "totalChargesProposees" DOUBLE PRECISION,
ADD COLUMN     "totalProduits" DOUBLE PRECISION,
ADD COLUMN     "totalProduitsProposes" DOUBLE PRECISION,
ADD COLUMN     "type" "StructureType";

-- CreateIndex
CREATE UNIQUE INDEX "CpomMillesime_cpomId_year_type_key" ON "CpomMillesime"("cpomId", "year", "type");
