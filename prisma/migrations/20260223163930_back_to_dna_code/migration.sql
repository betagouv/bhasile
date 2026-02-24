/*
  Warnings:

  - You are about to drop the column `structureId` on the `ActeAdministratif` table. All the data in the column will be lost.
  - You are about to drop the column `structureId` on the `DocumentFinancier` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "ActeAdministratif" DROP CONSTRAINT "ActeAdministratif_structureId_fkey";

-- DropForeignKey
ALTER TABLE "DocumentFinancier" DROP CONSTRAINT "DocumentFinancier_structureId_fkey";

-- AlterTable
ALTER TABLE "ActeAdministratif" DROP COLUMN "structureId",
ADD COLUMN     "structureDnaCode" TEXT;

-- AlterTable
ALTER TABLE "DocumentFinancier" DROP COLUMN "structureId",
ADD COLUMN     "structureDnaCode" TEXT;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureDnaCode_fkey" FOREIGN KEY ("structureDnaCode") REFERENCES "Structure"("dnaCode") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinancier" ADD CONSTRAINT "DocumentFinancier_structureDnaCode_fkey" FOREIGN KEY ("structureDnaCode") REFERENCES "Structure"("dnaCode") ON DELETE CASCADE ON UPDATE CASCADE;
