// One-off : dé-versionnement des typologies.
// 1. Reporte StructureVersion.placesAutorisees (versions de base) depuis la
//    typologie de l'année PLACES_VERSIONED_FROM_YEAR - 1 (dernière année legacy).
//    Réutilise le MÊME helper que la cascade d'écriture (mirrorLegacyPlaces...),
//    pour que backfill et maintien courant restent un seul invariant.
// 2. Vide StructureTypologie.placesAutorisees à partir de PLACES_VERSIONED_FROM_YEAR :
//    au-delà du seuil, la source de vérité est le scalaire de version.
//
// ⚠️ À lancer APRÈS 20260718-shift-typologie-years-to-december (l'année legacy de
//    référence n'est correcte qu'une fois le décalage 1er-janv → 31-déc fait).
// Idempotent : le report est une fonction pure de ST[seuil-1] ; le vidage ≥ seuil
// est rejouable.
// Usage: yarn one-off 20260717-backfill-structure-version-places-autorisees

import "dotenv/config";

import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { mirrorLegacyPlacesToBaseVersions } from "@/app/api/structure-versions/structure-version.repository";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Backfill des places autorisées sur StructureVersion...");
  console.log(`   Année legacy de référence : ${PLACES_VERSIONED_FROM_YEAR - 1}`);

  const filledVersions = await mirrorLegacyPlacesToBaseVersions(prisma);
  console.log(`✅ ${filledVersions} version(s) de base alignée(s).`);

  const versionsStillEmpty = await prisma.structureVersion.count({
    where: { structureVersionTransformationId: null, placesAutorisees: null },
  });
  if (versionsStillEmpty > 0) {
    console.log(
      `⚠️  ${versionsStillEmpty} version(s) de base sans places (aucune typologie ${
        PLACES_VERSIONED_FROM_YEAR - 1
      }).`
    );
  }

  const cleared = await prisma.$executeRaw`
    UPDATE "StructureTypologie"
    SET "placesAutorisees" = NULL
    WHERE "year" >= ${PLACES_VERSIONED_FROM_YEAR}
      AND "placesAutorisees" IS NOT NULL
  `;
  console.log(
    `🧹 ${cleared} typologie(s) ≥ ${PLACES_VERSIONED_FROM_YEAR} vidée(s) de leurs places.`
  );

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
