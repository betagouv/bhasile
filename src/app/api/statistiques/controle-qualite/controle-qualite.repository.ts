import prisma from "@/lib/prisma";

import type {
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
} from "../statistiques.db.type";

export const findEigs = async (
  dnaCodes: string[]
): Promise<StatistiqueDbEig[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.evenementIndesirableGrave.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: { id: true, dnaCode: true, type: true, evenementDate: true },
    orderBy: { evenementDate: "asc" },
  });
};

export const findEvaluations = async (
  structureIds: number[]
): Promise<StatistiqueDbEvaluation[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.evaluation.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      id: true,
      structureId: true,
      date: true,
      note: true,
      notePersonne: true,
      notePro: true,
      noteStructure: true,
    },
    orderBy: { date: "asc" },
  });
};
