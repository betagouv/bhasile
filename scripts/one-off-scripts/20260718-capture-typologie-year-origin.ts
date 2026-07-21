// One-off — PHASE 1/2 du décalage des années de typologies.
// Fige l'année d'origine (convention « 1er janvier ») dans la colonne TEMP
// yearOrigin. Snapshot immuable qui rend le décalage (phase 2) idempotent : la
// valeur finale year = yearOrigin - 1 est une fonction pure de cette source.
//
// Étape volontairement séparée de la phase 2 : la capture est irremplaçable et
// le décalage est irréversible → vérifier yearOrigin (SELECT year, yearOrigin
// FROM "StructureTypologie" ...) AVANT de lancer le shift.
//
// Idempotent (ne recapture pas une ligne déjà figée).
// ⚠️ À lancer UNE SEULE FOIS, avant toute création de données déjà au 31 déc :
//    un re-run après coup capturerait à tort les nouvelles lignes.
// Ne touche que les typologies legacy (rattachées à une Structure), pas le
// détail porté par une transfo (déjà saisi dans la nouvelle convention).
// Usage: yarn one-off 20260718-capture-typologie-year-origin

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Capture des années d'origine dans yearOrigin...");

  const captured = await prisma.$executeRaw`
    UPDATE "StructureTypologie"
    SET "yearOrigin" = "year"
    WHERE "yearOrigin" IS NULL AND "structureId" IS NOT NULL
  `;

  console.log(`📌 ${captured} année(s) d'origine figée(s).`);
  console.log(
    "🔎 Vérifier yearOrigin avant de lancer 20260718-shift-typologie-years-to-december."
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
