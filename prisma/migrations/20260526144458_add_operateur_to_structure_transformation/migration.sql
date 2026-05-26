-- AlterTable
ALTER TABLE "StructureTransformation" ADD COLUMN     "operateurId" INTEGER;

-- AddForeignKey
ALTER TABLE "StructureTransformation" ADD CONSTRAINT "StructureTransformation_operateurId_fkey" FOREIGN KEY ("operateurId") REFERENCES "Operateur"("id") ON DELETE SET NULL ON UPDATE CASCADE;
