import prisma from "@/lib/prisma";

import type { StatistiqueDbCpomStructure } from "../shared/db.type";

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
