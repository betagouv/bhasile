-- DropForeignKey
ALTER TABLE "ActeAdministratif" DROP CONSTRAINT "ActeAdministratif_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "Adresse" DROP CONSTRAINT "Adresse_structureTransformationId_fkey";

-- DropForeignKey
ALTER TABLE "Finess" DROP CONSTRAINT "Finess_structureTransformationId_fkey";

-- AddForeignKey
ALTER TABLE "Adresse" ADD CONSTRAINT "Adresse_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Finess" ADD CONSTRAINT "Finess_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActeAdministratif" ADD CONSTRAINT "ActeAdministratif_structureTransformationId_fkey" FOREIGN KEY ("structureTransformationId") REFERENCES "StructureTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
