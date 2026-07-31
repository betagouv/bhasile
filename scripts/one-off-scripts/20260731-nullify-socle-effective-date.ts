// One-off : passe la date d'effet des versions "socle" (non liées à une transfo) à null.
// Le socle devient la baseline effective depuis l'origine de la structure
//
// Usage : yarn one-off 20260731-nullify-socle-effective-date

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Passage des versions socle à effectiveDate = null…");

  const result = await prisma.structureVersion.updateMany({
    where: {
      structureVersionTransformationId: null,
      effectiveDate: { not: null },
    },
    data: { effectiveDate: null },
  });

  console.log(
    `✅ ${result.count} version(s) socle mise(s) à effectiveDate = null.`
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
