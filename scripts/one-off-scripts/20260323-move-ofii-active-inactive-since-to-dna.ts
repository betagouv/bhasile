// One-off script: copy active/inactive OFII dates from Structure to linked Dna.
// Assumption: one Structure is linked to at most one Dna.
// Usage: yarn one-off 20260323-move-ofii-active-inactive-since-to-dna

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Début de la migration active/inactive OFII depuis Structure vers Dna...");

  const structures = await prisma.structure.findMany({
    select: {
      id: true,
      codeBhasile: true,
      activeInOfiiFileSince: true,
      inactiveInOfiiFileSince: true,
      dnaStructures: {
        select: {
          dnaId: true,
        },
      },
    },
  });

  let updated = 0;
  let skippedNoDna = 0;
  let skippedNoDates = 0;

  for (const structure of structures) {
    if (
      structure.activeInOfiiFileSince == null &&
      structure.inactiveInOfiiFileSince == null
    ) {
      skippedNoDates++;
      continue;
    }

    if (structure.dnaStructures.length === 0) {
      skippedNoDna++;
      continue;
    }

    for (const dnaStructure of structure.dnaStructures) {
      await prisma.dna.update({
        where: { id: dnaStructure.dnaId },
        data: {
          activeInOfiiFileSince: structure.activeInOfiiFileSince,
          inactiveInOfiiFileSince: structure.inactiveInOfiiFileSince,
        },
      });
      updated++;
    }
  }

  console.log("✅ Migration terminée");
  console.log(`- DNA mis à jour: ${updated}`);
  console.log(`- Structures sans dates OFII: ${skippedNoDates}`);
  console.log(`- Structures sans lien DNA: ${skippedNoDna}`);
}

main()
  .catch((error) => {
    console.error("❌ Erreur pendant la migration OFII Structure -> Dna:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
