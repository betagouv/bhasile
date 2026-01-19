// @ts-nocheck
// Ici on veut migrer les places à fermer et places à créer en prod
// vers la StructureTypologie associée à la structure sur l'année 2025.
// Usage : yarn one-off 20251204-migrate-placeacreer-fermer-to-typologie

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const YEAR = 2025;

const migratePlacesToStructureTypologie = async () => {
  try {
    console.log(
      `📥 Récupération des structures avec places à créer / à fermer pour ${YEAR}...`
    );

    const structures = await prisma.structure.findMany({
      where: {
        OR: [
          { placesACreer: { not: null } },
          { placesAFermer: { not: null } },
          { echeancePlacesACreer: { not: null } },
          { echeancePlacesAFermer: { not: null } },
        ],
      },
      select: {
        dnaCode: true,
        placesACreer: true,
        placesAFermer: true,
        echeancePlacesACreer: true,
        echeancePlacesAFermer: true,
      },
      orderBy: { dnaCode: "asc" },
    });

    if (structures.length === 0) {
      console.log("✓ Aucune structure à migrer");
      return;
    }

    console.log(`✓ ${structures.length} structures trouvées à migrer`);
    console.log("🔄 Migration vers StructureTypologie...");

    let updatedTypologiesCount = 0;
    let errorCount = 0;

    for (const structure of structures) {
      try {
        const {
          dnaCode,
          placesACreer,
          placesAFermer,
          echeancePlacesACreer,
          echeancePlacesAFermer,
        } = structure;

        await prisma.structureTypologie.upsert({
          where: {
            structureDnaCode_year: {
              structureDnaCode: dnaCode,
              year: YEAR,
            },
          },
          update: {
            placesACreer,
            placesAFermer,
            echeancePlacesACreer,
            echeancePlacesAFermer,
          },
          create: {
            structureDnaCode: dnaCode,
            year: YEAR,
            placesACreer,
            placesAFermer,
            echeancePlacesACreer,
            echeancePlacesAFermer,
          },
        });

        updatedTypologiesCount += 1;
      } catch (error) {
        errorCount += 1;
        console.error(
          `❌ Erreur pour la structure ${structure.dnaCode}:`,
          error
        );
      }
    }

    console.log(
      `✅ Migration terminée : ${structures.length} structures traitées, ${updatedTypologiesCount} typologies mises à jour${errorCount > 0 ? `, ${errorCount} erreurs` : ""}`
    );
  } catch (error) {
    console.error("❌ Erreur lors de la migration :", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

migratePlacesToStructureTypologie()
  .then(() => {
    console.log("✓ Script terminé avec succès");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Erreur :", error);
    process.exit(1);
  });
