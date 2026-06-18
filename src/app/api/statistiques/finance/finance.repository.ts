import prisma from "@/lib/prisma";

import type {
  StatistiqueDbBudgetAgg,
  StatistiqueDbIndicateurFinancier,
} from "../statistiques.db.type";

export const findBudgetsByYear = async (
  structureIds: number[]
): Promise<StatistiqueDbBudgetAgg[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  const grouped = await prisma.budget.groupBy({
    by: ["year"],
    where: {
      structureId: { in: structureIds },
      isMissing: { not: true },
    },
    _sum: {
      dotationDemandee: true,
      dotationAccordee: true,
      totalProduits: true,
      totalCharges: true,
    },
    orderBy: { year: "asc" },
  });
  return grouped.map((group) => ({
    year: group.year,
    dotationDemandee: group._sum.dotationDemandee ?? 0,
    dotationAccordee: group._sum.dotationAccordee ?? 0,
    totalProduits: group._sum.totalProduits ?? 0,
    totalCharges: group._sum.totalCharges ?? 0,
  }));
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
      isMissing: { not: true },
      type: "REALISE",
    },
    select: {
      structureId: true,
      year: true,
      type: true,
      ETP: true,
      tauxEncadrement: true,
      coutJournalier: true,
    },
  });
};
