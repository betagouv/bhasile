// @ts-nocheck
// One-off script: remplissage régions et association aux départements
// Usage: yarn one-off 20260312-backfill-regions

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

import { REGIONS } from "@/constants";

const prisma = createPrismaClient();

async function backfillRegions() {
  console.log(
    "➡️ Démarrage du remplissage régions et association aux départements"
  );

  await prisma.region.createMany({
    data: REGIONS.map((region) => ({ name: region.name, code: region.code })),
    skipDuplicates: true,
  });

  const regions = await prisma.region.findMany();

  for (const region of regions) {
    await prisma.departement.updateMany({
      where: { region: region.name },
      data: { regionId: region.id },
    });
  }

  console.log(
    "✅ Remplissage régions et association aux départements terminé."
  );
}

backfillRegions()
  .catch((error) => {
    console.error("❌ Erreur pendant le remplissage des régions :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
