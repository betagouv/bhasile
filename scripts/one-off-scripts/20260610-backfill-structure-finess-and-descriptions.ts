// One-off en 2 étapes  :
//   1. Créer les liens StructureFiness depuis Finess.structureId / structureVersionId.
//   2. Déplace `description` de Dna/Finess vers DnaStructure/StructureFiness.

// re-run de 20260521-backfill-structure-version (qui a besoin des liens StructureFiness).
// Usage : yarn one-off 20260610-backfill-structure-finess-and-descriptions

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function backfillStructureFinessLinks() {
  const finessesWithoutLink = await prisma.finess.findMany({
    where: {
      OR: [
        { structureId: { not: null } },
        { structureVersionId: { not: null } },
      ],
      structureFinesses: { none: {} },
    },
    select: { id: true, structureId: true, structureVersionId: true },
  });

  await prisma.structureFiness.createMany({
    data: finessesWithoutLink.map((finess) => ({
      finessId: finess.id,
      structureId: finess.structureId,
      structureVersionId: finess.structureVersionId,
    })),
  });

  return finessesWithoutLink.length;
}

async function backfillCodeLinkDescriptions() {
  const dnasWithDescription = await prisma.dna.findMany({
    where: { description: { not: null } },
    select: { id: true, description: true },
  });
  let dnaLinks = 0;
  for (const dna of dnasWithDescription) {
    const { count } = await prisma.dnaStructure.updateMany({
      where: { dnaId: dna.id, description: null },
      data: { description: dna.description },
    });
    dnaLinks += count;
  }

  const finessesWithDescription = await prisma.finess.findMany({
    where: { description: { not: null } },
    select: { id: true, description: true },
  });
  let finessLinks = 0;
  for (const finess of finessesWithDescription) {
    const { count } = await prisma.structureFiness.updateMany({
      where: { finessId: finess.id, description: null },
      data: { description: finess.description },
    });
    finessLinks += count;
  }

  return { dnaLinks, finessLinks };
}

async function main() {
  console.log("🚀 Étape 1/2 : backfill des liens StructureFiness");
  const createdLinks = await backfillStructureFinessLinks();
  console.log(`✅ ${createdLinks} liens StructureFiness créés`);

  console.log("🚀 Étape 2/2 : backfill des descriptions vers les liens");
  const { dnaLinks, finessLinks } = await backfillCodeLinkDescriptions();
  console.log(
    `✅ Descriptions copiées (${dnaLinks} liens DnaStructure, ${finessLinks} liens StructureFiness)`
  );
}

main()
  .catch((error) => {
    console.error("❌ Erreur backfill StructureFiness / descriptions:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
