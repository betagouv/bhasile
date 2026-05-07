-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "ActeAdministratifCategory" ADD VALUE 'FRAIS_DE_SIEGE';
ALTER TYPE "ActeAdministratifCategory" ADD VALUE 'STATUTS';

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "operateurId" INTEGER;

-- AlterTable
ALTER TABLE "DocumentFinancier" ADD COLUMN     "operateurId" INTEGER;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentFinancier" ADD CONSTRAINT "DocumentFinancier_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
