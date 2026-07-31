// One-off — PHASE 2/2 du décalage des années de typologies.
// Décale year = yearOrigin - 1 (1er janvier N → 31 décembre N-1).
//
// PRÉREQUIS : phase 1 (20260718-capture-typologie-year-origin) passée ET
// vérifiée. Ce script REFUSE de tourner si une typologie legacy n'a pas de
// yearOrigin (capture incomplète → risque de laisser des lignes non décalées).
//
// Double-offset en transaction : on sort d'abord les années hors plage réelle
// (négatives, distinctes) puis on pose la valeur finale, pour qu'aucune valeur
// intermédiaire ne heurte l'unique [structureId, year] (Postgres vérifie
// l'unicité par ligne, pas en fin de statement). Atomique + idempotent (year
// final = fonction pure de yearOrigin).
// À lancer AVANT le backfill des places sur StructureVersion.
// Usage: yarn one-off 20260718-shift-typologie-years-to-december

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

const COLLISION_SAFE_OFFSET = 100000;

async function main() {
  const notCaptured = await prisma.structureTypologie.count({
    where: { yearOrigin: null, structureId: { not: null } },
  });
  if (notCaptured > 0) {
    throw new Error(
      `${notCaptured} typologie(s) legacy sans yearOrigin. Lancer d'abord 20260718-capture-typologie-year-origin, puis vérifier.`
    );
  }

  console.log("🚀 Décalage des années StructureTypologie (1er janv → 31 déc)...");

  const [, shifted] = await prisma.$transaction([
    prisma.$executeRaw`UPDATE "StructureTypologie" SET "year" = "year" - ${COLLISION_SAFE_OFFSET} WHERE "yearOrigin" IS NOT NULL`,
    prisma.$executeRaw`UPDATE "StructureTypologie" SET "year" = "yearOrigin" - 1 WHERE "year" < 0`,
  ]);

  console.log(`✅ ${shifted} typologie(s) décalée(s) d'un an en arrière.`);
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
