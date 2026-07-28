// One-off : rattache à leur Structure les typologies qui n'étaient portées que par
// une StructureVersion. Sans ça, la migration 20260717145506 les perdrait.
//
// ⚠️ À lancer AVANT 20260718-capture-typologie-year-origin : capture et shift
//    ignorent les typologies sans structureId. Restées en convention « 1er janvier »
//    pendant que les autres reculent d'un an, elles peuvent heurter l'unique
//    [structureId, year] — et ne remplissent pas StructureVersion.placesAutorisees,
//    d'où des places à 0 dans les vues de reporting.
// Préfixe antidaté : il encode cette dépendance, pas une date de création.
// Idempotent (ne reprend pas une typologie déjà rattachée).
// Usage: yarn one-off 20260717-backfill-typologie-structure-id

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  const alreadyCaptured = await prisma.structureTypologie.count({
    where: { yearOrigin: { not: null } },
  });
  if (alreadyCaptured > 0) {
    throw new Error(
      "20260718-capture-typologie-year-origin est déjà passé : ce backfill devait tourner avant. Rattrapage à la main."
    );
  }

  console.log("🚀 Rattachement des typologies orphelines à leur structure...");

  const orphelines = await prisma.structureTypologie.findMany({
    where: {
      structureId: null,
      structureVersion: { structureVersionTransformationId: null },
    },
    select: { id: true, structureVersion: { select: { structureId: true } } },
  });

  const rattachements = orphelines.flatMap((typologie) => {
    const structureId = typologie.structureVersion?.structureId;
    if (!structureId) {
      return [];
    }
    return [{ typologieId: typologie.id, structureId }];
  });

  await prisma.$transaction(
    rattachements.map(({ typologieId, structureId }) =>
      prisma.structureTypologie.update({
        where: { id: typologieId },
        data: { structureId },
      })
    )
  );

  console.log(
    `🔗 ${rattachements.length} typologie(s) rattachée(s) : ${rattachements
      .map(
        ({ typologieId, structureId }) => `#${typologieId} → structure ${structureId}`
      )
      .join(", ")}`
  );

  const remaining = await prisma.structureTypologie.count({
    where: { structureId: null, structureVersionTransformationId: null },
  });
  if (remaining > 0) {
    console.error(
      `⚠️ ${remaining} typologie(s) encore orpheline(s) : portées par une SV de transformation. À rattacher à la main sur structureVersionTransformationId AVANT le drop de la colonne.`
    );
    process.exitCode = 1;
  }

  console.log("🏁 Terminé.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
