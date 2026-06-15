import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

import type { StatistiqueDbActivite } from "../shared/db.type";

export const findLatestActivites = async (
  dnaCodes: string[]
): Promise<StatistiqueDbActivite[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.$queryRaw<StatistiqueDbActivite[]>(Prisma.sql`
    SELECT DISTINCT ON (a."dnaCode")
      a.date,
      a."placesAutorisees",
      a."placesIndisponibles",
      a.desinsectisation,
      a."remiseEnEtat",
      a."sousOccupation",
      a.travaux,
      a."presencesInduesBPI",
      a."presencesInduesDeboutees"
    FROM public."Activite" a
    WHERE a."dnaCode" IN (${Prisma.join(dnaCodes)})
    ORDER BY a."dnaCode", a.date DESC
  `);
};

export const findActivites = async (
  dnaCodes: string[]
): Promise<StatistiqueDbActivite[]> => {
  if (dnaCodes.length === 0) {
    return [];
  }
  return prisma.activite.findMany({
    where: { dnaCode: { in: dnaCodes } },
    select: {
      date: true,
      placesAutorisees: true,
      placesIndisponibles: true,
      desinsectisation: true,
      remiseEnEtat: true,
      sousOccupation: true,
      travaux: true,
      presencesInduesBPI: true,
      presencesInduesDeboutees: true,
    },
    orderBy: { date: "asc" },
  });
};
