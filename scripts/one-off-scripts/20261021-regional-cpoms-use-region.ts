// One-off : un CPOM régional couvre les départements de sa région, déduits de regionId.
// Ses lignes CpomDepartement deviennent inutiles et sont supprimées. Un CPOM régional
// sans regionId reçoit la région de ses départements quand elle est unique.
// Idempotent : un CPOM régional sans ligne CpomDepartement n'est plus traité.
//
// Usage : yarn one-off 20261021-regional-cpoms-use-region [--dry-run]

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const isDryRun = process.argv.includes("--dry-run");

const migrateRegionalCpoms = async () => {
  console.log(
    `➡️ CPOM régionaux : passage sur regionId${isDryRun ? " (dry-run, aucune écriture)" : ""}`
  );

  const cpoms = await prisma.cpom.findMany({
    where: { granularity: "REGIONALE", departements: { some: {} } },
    select: {
      id: true,
      name: true,
      regionId: true,
      departements: {
        select: { departement: { select: { numero: true, regionId: true } } },
      },
    },
    orderBy: { id: "asc" },
  });

  const counts = { migrated: 0, regionFilled: 0, skipped: 0 };

  for (const cpom of cpoms) {
    const label = `CPOM ${cpom.id} (${cpom.name ?? "sans nom"})`;
    const departementRegionIds = new Set(
      cpom.departements.map(({ departement }) => departement.regionId)
    );

    let regionId = cpom.regionId;
    if (regionId === null) {
      const [uniqueRegionId] = [...departementRegionIds];
      if (departementRegionIds.size !== 1 || uniqueRegionId === null) {
        console.log(
          `  ⚠️ ${label} ignoré : région impossible à déduire de ses départements`
        );
        counts.skipped++;
        continue;
      }
      regionId = uniqueRegionId;
      counts.regionFilled++;
    }

    const outsideRegion = cpom.departements
      .filter(({ departement }) => departement.regionId !== regionId)
      .map(({ departement }) => departement.numero);
    if (outsideRegion.length > 0) {
      console.log(
        `  ⚠️ ${label} ignoré : départements hors de sa région (${outsideRegion.join(", ")})`
      );
      counts.skipped++;
      continue;
    }

    if (!isDryRun) {
      await prisma.$transaction([
        prisma.cpom.update({ where: { id: cpom.id }, data: { regionId } }),
        prisma.cpomDepartement.deleteMany({ where: { cpomId: cpom.id } }),
      ]);
    }
    console.log(
      `  • ${label} : ${cpom.departements.length} ligne(s) CpomDepartement ${isDryRun ? "à supprimer" : "supprimée(s)"}`
    );
    counts.migrated++;
  }

  console.log(
    `✅ ${counts.migrated} CPOM migré(s), dont ${counts.regionFilled} avec région déduite ; ${counts.skipped} ignoré(s).`
  );
};

migrateRegionalCpoms()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
