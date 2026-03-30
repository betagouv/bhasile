// @ts-nocheck
// One-off script: migrate Structure.finessCode to Finess table.
// Usage: yarn one-off 20260323-fill-finess

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Début de la migration des codes FINESS...");

  const structures = await prisma.structure.findMany({
    select: {
      id: true,
      finessCode: true,
    },
  });

  let skippedEmpty = 0;
  let created = 0;

  for (const structure of structures) {
    const code = structure.finessCode?.trim();

    if (!code) {
      skippedEmpty++;
      continue;
    }

    await prisma.finess.upsert({
      where: { code },
      update: {},
      create: {
        structureId: structure.id,
        code,
        description: null,
      },
    });

    created++;
  }

  console.log(`✅ Migration terminée`);
  console.log(`- Créés: ${created}`);
  console.log(`- Sans finessCode: ${skippedEmpty}`);
}

main()
  .catch((e) => {
    console.error("❌ Erreur pendant la migration FINESS:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
