// One-off : fixe la date de sortie CPOM des structures déjà fermées à leur date de fermeture.
// Les fermetures finalisées depuis le correctif le font à la finalisation de la transformation.
// Idempotent : une sortie déjà antérieure ou égale à la fermeture n'est pas modifiée.
//
// Usage : yarn one-off 20261006-end-cpom-structures-at-fermeture

import "dotenv/config";

import {
  findCpomStructuresOfStructure,
  updateCpomStructuresDateEnd,
} from "@/app/api/cpoms/cpom.repository";
import { getCpomStructureIdsToEndAtFermeture } from "@/app/api/cpoms/cpom.util";
import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Sortie CPOM des structures fermées…");

  const closedStructures = await prisma.structure.findMany({
    where: { fermetureDate: { not: null }, cpomStructures: { some: {} } },
    select: { id: true, codeBhasile: true, fermetureDate: true },
  });

  for (const { id, codeBhasile, fermetureDate } of closedStructures) {
    if (!fermetureDate) {
      continue;
    }
    await prisma.$transaction(async (tx) => {
      const cpomStructures = await findCpomStructuresOfStructure(tx, id);
      await updateCpomStructuresDateEnd(
        tx,
        getCpomStructureIdsToEndAtFermeture(cpomStructures, fermetureDate),
        fermetureDate
      );
    });
    console.log(`  • ${codeBhasile} traitée`);
  }

  console.log(
    `✅ ${closedStructures.length} structure(s) fermée(s) sous CPOM traitée(s).`
  );
}

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
