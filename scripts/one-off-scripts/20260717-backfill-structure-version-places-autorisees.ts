// One-off : dé-versionnement des typologies.
// 1. Remplit StructureVersion.placesAutorisees (scalaire de version) depuis la
//    dernière valeur connue sur StructureTypologie.
// 2. Vide StructureTypologie.placesAutorisees à partir de PLACES_VERSIONED_FROM_YEAR :
//    au-delà du seuil, la source de vérité est la timeline des versions.
// Idempotent : relançable sans effet de bord.
// Usage: yarn one-off 20260717-backfill-structure-version-places-autorisees

import "dotenv/config";

import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Backfill des places autorisées sur StructureVersion...");
  console.log(`   Seuil de versionnement : ${PLACES_VERSIONED_FROM_YEAR}`);

  const structures = await prisma.structure.findMany({
    select: {
      id: true,
      structureVersions: {
        // Une FERMETURE ne porte aucune place (son formulaire n'en capte pas) :
        // la laisser vide est ce qui rend l'historique vide après la clôture.
        where: {
          structureVersionTransformation: { type: { not: "FERMETURE" } },
        },
        select: { id: true, placesAutorisees: true },
        orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
      },
      structureTypologies: {
        where: { placesAutorisees: { not: null } },
        select: { year: true, placesAutorisees: true },
        orderBy: { year: "desc" },
      },
    },
    orderBy: { id: "asc" },
  });
  console.log(`📥 ${structures.length} structure(s) chargée(s).`);

  let filledVersions = 0;
  let skippedNoSource = 0;

  for (const structure of structures) {
    // Les places autorisées courantes = la dernière valeur renseignée, toutes
    // années confondues (avant transfos, une structure n'a qu'une version de base).
    const latestPlacesAutorisees =
      structure.structureTypologies[0]?.placesAutorisees ?? null;

    if (latestPlacesAutorisees === null) {
      skippedNoSource += 1;
      continue;
    }

    // Idempotence : on ne touche que les versions encore vides.
    const versionsToFill = structure.structureVersions.filter(
      (structureVersion) => structureVersion.placesAutorisees === null
    );
    if (versionsToFill.length === 0) {
      continue;
    }

    await prisma.structureVersion.updateMany({
      where: { id: { in: versionsToFill.map((version) => version.id) } },
      data: { placesAutorisees: latestPlacesAutorisees },
    });
    filledVersions += versionsToFill.length;
  }

  console.log(`✅ ${filledVersions} version(s) remplie(s).`);
  if (skippedNoSource > 0) {
    console.log(
      `⚠️  ${skippedNoSource} structure(s) sans aucune place connue — laissées vides.`
    );
  }

  // Invariant : StructureTypologie ne porte les places que pour les années legacy.
  const cleared = await prisma.structureTypologie.updateMany({
    where: {
      year: { gte: PLACES_VERSIONED_FROM_YEAR },
      placesAutorisees: { not: null },
    },
    data: { placesAutorisees: null },
  });
  console.log(
    `🧹 ${cleared.count} typologie(s) ≥ ${PLACES_VERSIONED_FROM_YEAR} vidée(s) de leurs places.`
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
