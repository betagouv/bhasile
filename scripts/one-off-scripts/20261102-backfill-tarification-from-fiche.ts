// One-off : reprend dans la campagne 2027 les CA 2025, rapports d'activité 2025, BP 2027 et rapports budgétaires
// 2027 déjà sur la fiche. Rejouable : une structure déjà reliée pour une catégorie est ignorée, et une ligne en échec
// est retentée. Une ligne en échec n'arrête pas les autres : elle est listée à la fin.
//
// Usage : yarn one-off 20261102-backfill-tarification-from-fiche

import "dotenv/config";

import { TARIFICATION_FIRST_CAMPAIGN_YEAR } from "@/lib/tarification/tarification.definition";
import { createPrismaClient } from "@/prisma-client";

import { backfillTarificationFromFiche } from "../utils/tarification-backfill";

const prisma = createPrismaClient();

backfillTarificationFromFiche(prisma, TARIFICATION_FIRST_CAMPAIGN_YEAR)
  .then(({ linkedCount, failedRowIds }) => {
    console.log(`✅ ${linkedCount} documents repris depuis la fiche`);
    if (failedRowIds.length > 0) {
      console.error(`❌ Lignes en échec : ${failedRowIds.join(", ")}`);
      process.exitCode = 1;
    }
  })
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
