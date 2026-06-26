// One-off : backfill creationDate / date303 sur Structure depuis la dernière StructureVersion.
// Ces 2 champs sont immuables et vivent désormais uniquement sur Structure (plus versionnés).
// Les structures créées après le backfill 20260521 ont un scalaire null → on le remplit depuis la version.
// Fill-only + idempotent : n'écrase jamais une valeur déjà présente sur la Structure.
// Usage : yarn one-off 20260626-backfill-structure-dates

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Backfill creationDate / date303 sur Structure");

  const structures = await prisma.structure.findMany({
    where: { OR: [{ creationDate: null }, { date303: null }] },
    select: { id: true, creationDate: true, date303: true },
  });

  let filledCount = 0;
  let anomalyCount = 0;

  for (const structure of structures) {
    const latestVersion = await prisma.structureVersion.findFirst({
      where: { structureId: structure.id },
      orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
      select: { creationDate: true, date303: true },
    });

    if (!latestVersion) {
      continue;
    }

    const data: { creationDate?: Date; date303?: Date } = {};

    if (structure.creationDate === null && latestVersion.creationDate !== null) {
      data.creationDate = latestVersion.creationDate;
    }
    if (structure.date303 === null && latestVersion.date303 !== null) {
      data.date303 = latestVersion.date303;
    }

    if (structure.creationDate === null && latestVersion.creationDate === null) {
      anomalyCount += 1;
      console.warn(
        `⚠️  Structure ${structure.id} : creationDate null sur la structure ET sur la dernière version`
      );
    }

    if (Object.keys(data).length === 0) {
      continue;
    }

    await prisma.structure.update({ where: { id: structure.id }, data });
    filledCount += 1;
  }

  console.log(
    `✅ Terminé (${structures.length} candidates, ${filledCount} remplies, ${anomalyCount} anomalies creationDate)`
  );
}

main()
  .catch((error) => {
    console.error("❌ Erreur backfill dates structure:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
