-- AlterTable
ALTER TABLE "StructureVersionTransformation" ADD COLUMN "structureType" "StructureType";

-- AlterTable
ALTER TABLE "StructureVersion" DROP COLUMN "type";
