// @ts-nocheck
// One-off script: bascule les conventions portées par un CPOM en CONVENTION_CPOM
// Les conventions de structure (transformations, vues qualité, stats) restent en CONVENTION.
// À lancer juste après le déploiement : tant qu'il n'a pas tourné, les lectures CPOM
// (dates du CPOM, stats "CPOM actifs", vues 002/004e) ne trouvent plus la convention.
// Usage: yarn one-off 20260716-backfill-convention-cpom

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function backfillConventionCpom() {
  console.log("➡️ Démarrage de la bascule des conventions CPOM");

  const { count } = await prisma.acteAdministratif.updateMany({
    where: { category: "CONVENTION", cpomId: { not: null } },
    data: { category: "CONVENTION_CPOM" },
  });

  console.log(`✅ Bascule terminée : ${count} convention(s) de CPOM basculée(s).`);
}

backfillConventionCpom()
  .catch((error) => {
    console.error("❌ Erreur pendant la bascule des conventions CPOM :", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
