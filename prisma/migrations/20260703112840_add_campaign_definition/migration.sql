-- AlterTable
ALTER TABLE "Campaign" ADD COLUMN     "campaignDefinitionId" INTEGER,
ALTER COLUMN "name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Form" ADD COLUMN     "campaignId" INTEGER;

-- CreateTable
CREATE TABLE "CampaignDefinition" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "slug" TEXT NOT NULL,

    CONSTRAINT "CampaignDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CampaignDefinition_slug_key" ON "CampaignDefinition"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Form_campaignId_key" ON "Form"("campaignId");

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_campaignDefinitionId_fkey" FOREIGN KEY ("campaignDefinitionId") REFERENCES "CampaignDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Form" ADD CONSTRAINT "Form_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;
