// One-off : crée la CampaignDefinition "Initialisation" et backfill campaignDefinitionId
// sur toutes les campagnes existantes (créées par 20260521-backfill-structure-version).
// Idempotent : upsert sur slug ; le backfill ne touche que les campagnes sans définition.
// À lancer UNE fois après le déploiement du schéma campaign.
// Usage : yarn one-off 20260703-create-initialisation-campaign-definition

import "dotenv/config";

import { INITIALISATION_CAMPAIGN_DEFINITION_SLUG } from "@/app/api/campaigns/campaign.constants";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Création de la CampaignDefinition initialisation...");

  const initialisationDefinition = await prisma.campaignDefinition.upsert({
    where: { slug: INITIALISATION_CAMPAIGN_DEFINITION_SLUG },
    update: {},
    create: {
      slug: INITIALISATION_CAMPAIGN_DEFINITION_SLUG,
      name: "Initialisation",
      version: 1,
    },
  });

  const backfilled = await prisma.campaign.updateMany({
    where: { campaignDefinitionId: null },
    data: { campaignDefinitionId: initialisationDefinition.id },
  });

  console.log(`✅ CampaignDefinition : initialisation`);
  console.log(
    `✅ ${backfilled.count} campagne(s) existante(s) taggée(s) initialisation`
  );
}

main()
  .catch((error) => {
    console.error(
      "❌ Erreur création de la CampaignDefinition initialisation:",
      error
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
