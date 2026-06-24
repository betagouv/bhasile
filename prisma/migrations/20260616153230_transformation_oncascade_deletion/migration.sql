-- DropForeignKey
ALTER TABLE "StructureVersionTransformation" DROP CONSTRAINT "StructureVersionTransformation_transformationId_fkey";

-- AddForeignKey
ALTER TABLE "StructureVersionTransformation" ADD CONSTRAINT "StructureVersionTransformation_transformationId_fkey" FOREIGN KEY ("transformationId") REFERENCES "Transformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
