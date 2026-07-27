// Récurrent : crée la CampaignDefinition "Actualisation <année>" + la FormDefinition actualisation
// pour la période d'actualisation en cours. L'année vient de l'argument CLI, sinon de ACTUALISATION_YEAR.
// No-op si aucune année valide n'est fournie (hors période d'actualisation).
// Idempotent : upsert sur slug — planifiable en cron, crée la def de l'année dès que ACTUALISATION_YEAR est posé.
// Usage : yarn script create-actualisation-campaign-definition [année]

import "dotenv/config";

import { actualisationCampaignDefinitionSlug } from "@/app/api/campaigns/campaign.constants";
import { ACTUALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const run = async () => {
  try {
    const actualisationYear = Number(
      process.argv[2] ?? process.env.ACTUALISATION_YEAR
    );

    if (!Number.isInteger(actualisationYear)) {
      console.log(
        "⏭️  Aucune année d'actualisation valide (arg ou ACTUALISATION_YEAR) — rien à créer."
      );
      return;
    }

    await prisma.campaignDefinition.upsert({
      where: { slug: actualisationCampaignDefinitionSlug(actualisationYear) },
      update: {},
      create: {
        slug: actualisationCampaignDefinitionSlug(actualisationYear),
        name: `Actualisation ${actualisationYear}`,
        version: 1,
      },
    });

    await prisma.formDefinition.upsert({
      where: { slug: ACTUALISATION_FORM_SLUG },
      update: {},
      create: { slug: ACTUALISATION_FORM_SLUG, name: "actualisation", version: 1 },
    });

    console.log(
      `✅ CampaignDefinition actualisation-${actualisationYear} + FormDefinition ${ACTUALISATION_FORM_SLUG}`
    );
  } catch (error) {
    console.error("❌ Erreur création de la campagne d'actualisation:", error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
};

run();
