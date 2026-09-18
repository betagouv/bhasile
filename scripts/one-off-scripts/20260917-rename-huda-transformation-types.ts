// One-off : bascule les transformations HUDA>CADA vers les noms de la grille
// fermeture/contraction. Idempotent, à rejouer juste avant le déploiement qui
// supprime les anciennes valeurs de l'enum — ce déploiement échoue tant qu'une
// ligne en porte encore une.
//
// $executeRaw plutôt qu'updateMany : Transformation.updatedAt est @updatedAt et
// sert de date de dernière activité sur le dashboard.
//
// Usage : yarn one-off 20260917-rename-huda-transformation-types

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";
import {
  LegacyHudaTransformationType,
  TransformationType,
} from "@/types/transformation.type";

const prisma = createPrismaClient();

const RENAMINGS: {
  from: LegacyHudaTransformationType;
  to: TransformationType;
}[] = [
  {
    from: LegacyHudaTransformationType.TRANSFO_HUDA_VERS_CADA_EXISTANT_MEME_OPERATEUR,
    to: TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_EXISTANT,
  },
  {
    from: LegacyHudaTransformationType.TRANSFO_HUDA_VERS_CADA_NOUVEAU_MEME_OPERATEUR,
    to: TransformationType.TRANSFO_HUDA_FERMETURE_VERS_CADA_NOUVEAU,
  },
  {
    from: LegacyHudaTransformationType.TRANSFO_HUDA_REMISE_EN_CONCURRENCE_DES_PLACES,
    to: TransformationType.TRANSFO_HUDA_FERMETURE_REMISE_EN_CONCURRENCE,
  },
];

async function main() {
  console.log("🚀 Renommage des types de transformation HUDA>CADA…");

  for (const { from, to } of RENAMINGS) {
    const renamed = await prisma.$executeRaw`
      UPDATE "public"."Transformation"
      SET "type" = ${to}::"public"."TransformationType"
      WHERE "type" = ${from}::"public"."TransformationType"
    `;
    console.log(`${from} → ${to} : ${renamed} ligne(s).`);
  }

  const residual = await prisma.transformation.count({
    where: { type: { in: RENAMINGS.map(({ from }) => from) } },
  });

  if (residual > 0) {
    throw new Error(
      `${residual} transformation(s) portent encore un ancien type : la suppression des valeurs d'enum échouera.`
    );
  }

  console.log("✅ Plus aucune transformation ne porte un ancien type.");
}

main()
  .catch((error) => {
    console.error("❌ Erreur:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
