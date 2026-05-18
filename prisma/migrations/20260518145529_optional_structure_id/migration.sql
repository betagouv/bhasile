-- DropForeignKey
ALTER TABLE "StructureTransformation" DROP CONSTRAINT "StructureTransformation_structureId_fkey";

-- AlterTable
ALTER TABLE "StructureTransformation" ALTER COLUMN "structureId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "StructureTransformation" ADD CONSTRAINT "StructureTransformation_structureId_fkey" FOREIGN KEY ("structureId") REFERENCES "Structure"("id") ON DELETE SET NULL ON UPDATE CASCADE;
