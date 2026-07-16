-- AlterEnum
ALTER TYPE "ActeAdministratifCategory" ADD VALUE 'CONVENTION_CPOM';

-- AlterTable
ALTER TABLE "ActeAdministratif" ADD COLUMN     "structureType" "StructureType";

-- AlterTable
ALTER TABLE "DocumentFinancier" ADD COLUMN     "cpomId" INTEGER,
ADD COLUMN     "structureType" "StructureType";

-- AddForeignKey
ALTER TABLE "DocumentFinancier" ADD CONSTRAINT "DocumentFinancier_cpomId_fkey" FOREIGN KEY ("cpomId") REFERENCES "Cpom"("id") ON DELETE CASCADE ON UPDATE CASCADE;
