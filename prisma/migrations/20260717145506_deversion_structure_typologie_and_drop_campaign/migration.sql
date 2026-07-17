-- AlterTable
ALTER TABLE "FormDefinition" ADD COLUMN     "deadline" TIMESTAMP(3);

-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_campaignDefinitionId_fkey";

-- DropForeignKey
ALTER TABLE "Form" DROP CONSTRAINT "Form_campaignId_fkey";

-- DropForeignKey
ALTER TABLE "StructureTypologie" DROP CONSTRAINT "StructureTypologie_structureVersionId_fkey";

-- DropForeignKey
ALTER TABLE "StructureVersion" DROP CONSTRAINT "StructureVersion_campaignId_fkey";

-- DropIndex
DROP INDEX "Form_campaignId_key";

-- DropIndex
DROP INDEX "StructureTypologie_structureVersionId_year_key";

-- DropIndex
DROP INDEX "StructureVersion_campaignId_key";

-- AlterTable
ALTER TABLE "Form" DROP COLUMN "campaignId";

-- AlterTable
ALTER TABLE "StructureTypologie" DROP COLUMN "structureVersionId",
ADD COLUMN     "structureVersionTransformationId" INTEGER;

-- AlterTable
ALTER TABLE "StructureVersion" DROP COLUMN "campaignId",
ADD COLUMN     "placesAutorisees" INTEGER;

-- DropTable
DROP TABLE "Campaign";

-- DropTable
DROP TABLE "CampaignDefinition";

-- CreateIndex
CREATE UNIQUE INDEX "StructureTypologie_structureVersionTransformationId_year_key" ON "StructureTypologie"("structureVersionTransformationId", "year");

-- AddForeignKey
ALTER TABLE "StructureTypologie" ADD CONSTRAINT "StructureTypologie_structureVersionTransformationId_fkey" FOREIGN KEY ("structureVersionTransformationId") REFERENCES "StructureVersionTransformation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

