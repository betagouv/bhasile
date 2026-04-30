// @ts-nocheck
// One-off script: move indicateurs financiers from Budget tables to the new IndicateurFinancier tables.
// Usage: yarn one-off 20260414-move-indicateurs-financiers

import "dotenv/config";

import { createPrismaClient } from "@/prisma-client";
import { INDICATEUR_FINANCIER_CUTOFF_YEAR } from "@/constants";

const prisma = createPrismaClient();

async function main() {
  console.log("🚀 Début du déplacement des indicateurs financiers...");

  const budgets = await prisma.budget.findMany();
  let updatedBudget = 0;
  let errorsBudget = 0;
  for (const budget of budgets) {
    const isRealisee = budget.year < INDICATEUR_FINANCIER_CUTOFF_YEAR;
    try {
      await prisma.indicateurFinancier.upsert({
        where: {
          structureId_year_type: {
            structureId: budget.structureId ?? 0,
            year: budget.year,
            type: isRealisee ? "REALISE" : "PREVISIONNEL",
          },
        },
        update: {
          ETP: budget.ETP,
          tauxEncadrement: budget.tauxEncadrement,
          coutJournalier: budget.coutJournalier,
        },
        create: {
          structureId: budget.structureId,
          year: budget.year,
          type: isRealisee ? "REALISE" : "PREVISIONNEL",
          ETP: budget.ETP,
          tauxEncadrement: budget.tauxEncadrement,
          coutJournalier: budget.coutJournalier,
        },
      });
      updatedBudget += 1;
    } catch (error) {
      errorsBudget += 1;
      console.error(`❌ Budget id=${budget.id}:`, error);
    }
  }
  console.log(
    `✅ Budget: ${updatedBudget} indicateurs financiers créés. ${errorsBudget} erreurs`
  );

  console.log("Terminé.");
}

main()
  .catch((error) => {
    console.error(
      "❌ Erreur pendant le déplacement des indicateurs financiers :",
      error
    );
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
