import prisma from "@/lib/prisma";

import type { StatistiqueDbActivite } from "../statistiques.db.type";

export const findActivites = async (
  dnaCodes: string[]
): Promise<StatistiqueDbActivite[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.activite.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: {
      dnaCode: true,
      date: true,
      placesAutorisees: true,
      placesIndisponibles: true,
      presencesInduesBPI: true,
      presencesInduesDeboutees: true,
    },
    orderBy: { date: "asc" },
  });
};
