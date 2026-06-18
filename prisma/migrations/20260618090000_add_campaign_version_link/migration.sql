-- DropForeignKey
ALTER TABLE "Campaign" DROP CONSTRAINT "Campaign_structureId_fkey";

-- AlterTable
ALTER TABLE "Campaign" DROP COLUMN "launched",
DROP COLUMN "structureId";

-- AlterTable
ALTER TABLE "StructureVersion" ADD COLUMN     "campaignId" INTEGER;

-- AddForeignKey
ALTER TABLE "StructureVersion" ADD CONSTRAINT "StructureVersion_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
