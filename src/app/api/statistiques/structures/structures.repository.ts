import prisma from "@/lib/prisma";

import type { StatistiqueDbCpomStructure } from "../shared/db.type";

export const countCpoms = async (structureIds: number[]): Promise<number> => {
  if (structureIds.length === 0) {
    return 0;
  }
  return prisma.cpom.count({
    where: {
      structures: {
        some: { structureId: { in: structureIds } },
      },
    },
  });
};

export const findCpomStructures = async (
  structureIds: number[]
): Promise<StatistiqueDbCpomStructure[]> => {
  if (structureIds.length === 0) {
    return [];
  }
  return prisma.cpomStructure.findMany({
    where: { structureId: { in: structureIds } },
    select: {
      cpomId: true,
      structureId: true,
      dateStart: true,
      dateEnd: true,
    },
  });
};
