import prisma from "@/lib/prisma";

import type {
  StatistiqueDbBudget,
  StatistiqueDbIndicateurFinancier,
} from "../statistiques.db.type";

export const findBudgets = async (
  structureIds: number[]
): Promise<StatistiqueDbBudget[]> => {
  if (structureIds.length === 0) {
    return [];
  }

  const budgets = await prisma.budget.findMany({
    where: {
      structureId: { in: structureIds },
      OR: [{ isMissing: null }, { isMissing: false }],
    },
    select: {
      id: true,
      structureId: true,
      year: true,
      dotationDemandee: true,
      dotationAccordee: true,
      totalProduits: true,
      totalCharges: true,
    },
    orderBy: [{ year: "asc" }, { structureId: "asc" }],
  });

  return budgets.flatMap((budget) => {
    if (budget.structureId === null) {
      return [];
    }

    return [
      {
        id: budget.id,
        structureId: budget.structureId,
        year: budget.year,
        dotationDemandee: budget.dotationDemandee ?? 0,
        dotationAccordee: budget.dotationAccordee ?? 0,
        totalProduits: budget.totalProduits ?? 0,
        totalCharges: budget.totalCharges ?? 0,
      },
    ];
  });
};

export const findIndicateursFinanciers = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurFinancier[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.indicateurFinancier.findMany({
    where: {
      structureId: { in: structureIds },
      OR: [{ isMissing: null }, { isMissing: false }],
      type: { in: ["REALISE", "PREVISIONNEL"] },
    },
    select: {
      id: true,
      structureId: true,
      year: true,
      type: true,
      ETP: true,
      tauxEncadrement: true,
      coutJournalier: true,
    },
  });
};
