import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

import type {
  StatistiqueDbBudgetAgg,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbIndicateurMedian,
  StatistiqueDbIndicateurMedianByType,
  StatistiqueDbIndicateurMedianByYearAndType,
  StatistiqueDbIndicateurMedianGlobal,
} from "../shared/db.type";

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
      // TODO: vérifier selon hypothèses cible (REALISE vs PREVISIONNEL)
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

export const findYearlyMedianIndicateurs = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurMedian[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.$queryRaw<StatistiqueDbIndicateurMedian[]>(Prisma.sql`
    SELECT
      year,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "tauxEncadrement") AS "tauxEncadrementMedian",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "coutJournalier")  AS "coutJournalierMedian"
    FROM public."IndicateurFinancier"
    WHERE "structureId" IN (${Prisma.join(structureIds)})
      AND "isMissing" IS NOT TRUE
      AND type = 'REALISE'
    GROUP BY year
    ORDER BY year ASC
  `);
};

export const findGlobalMedianIndicateurs = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurMedianGlobal> => {
  if (structureIds.length === 0) {
    return { tauxEncadrementMedian: null, coutJournalierMedian: null };
  }
  const [row] = await prisma.$queryRaw<
    StatistiqueDbIndicateurMedianGlobal[]
  >(Prisma.sql`
    SELECT
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "tauxEncadrement") AS "tauxEncadrementMedian",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY "coutJournalier")  AS "coutJournalierMedian"
    FROM public."IndicateurFinancier"
    WHERE "structureId" IN (${Prisma.join(structureIds)})
      AND "isMissing" IS NOT TRUE
      AND type = 'REALISE'
  `);
  return row ?? { tauxEncadrementMedian: null, coutJournalierMedian: null };
};

export const findGlobalMedianIndicateursByType = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurMedianByType[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.$queryRaw<StatistiqueDbIndicateurMedianByType[]>(Prisma.sql`
    SELECT
      s.type AS type,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY i."tauxEncadrement") AS "tauxEncadrementMedian",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY i."coutJournalier")  AS "coutJournalierMedian"
    FROM public."IndicateurFinancier" i
    INNER JOIN public."Structure" s ON s.id = i."structureId"
    WHERE i."structureId" IN (${Prisma.join(structureIds)})
      AND i."isMissing" IS NOT TRUE
      AND i.type = 'REALISE'
      AND s.type IS NOT NULL
    GROUP BY s.type
    ORDER BY s.type ASC
  `);
};

export const findYearlyMedianIndicateursByType = async (
  structureIds: number[]
): Promise<StatistiqueDbIndicateurMedianByYearAndType[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.$queryRaw<StatistiqueDbIndicateurMedianByYearAndType[]>(
    Prisma.sql`
    SELECT
      i.year,
      s.type AS type,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY i."tauxEncadrement") AS "tauxEncadrementMedian",
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY i."coutJournalier")  AS "coutJournalierMedian"
    FROM public."IndicateurFinancier" i
    INNER JOIN public."Structure" s ON s.id = i."structureId"
    WHERE i."structureId" IN (${Prisma.join(structureIds)})
      AND i."isMissing" IS NOT TRUE
      AND i.type = 'REALISE'
      AND s.type IS NOT NULL
    GROUP BY i.year, s.type
    ORDER BY i.year ASC, s.type ASC
  `
  );
};
