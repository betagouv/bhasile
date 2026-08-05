import {
  type StructureAnomalieDb,
  structureAnomalieInclude,
} from "@/app/api/anomalies/anomalie.db.type";
import type { DetectedAnomalie } from "@/lib/anomalies/anomalie.rule";
import prisma from "@/lib/prisma";
import type { AnomalieCode } from "@/types/anomalie.type";

export const findStructureForAnomalies = (
  structureId: number,
  now: Date
): Promise<StructureAnomalieDb | null> =>
  prisma.structure.findUnique({
    where: { id: structureId },
    include: structureAnomalieInclude(now),
  });

export const findAllStructureIds = async (): Promise<number[]> => {
  const structures = await prisma.structure.findMany({
    select: { id: true },
    orderBy: { id: "asc" },
  });

  return structures.map(({ id }) => id);
};

export const findAnomaliesByStructureId = (structureId: number) =>
  prisma.anomalie.findMany({
    where: { structureId },
    include: { justifiedBy: { select: { id: true, name: true, email: true } } },
  });

// La suppression est restreinte aux codes réellement évalués : une règle ignorée faute de
// données ne doit jamais faire disparaître ses anomalies ni les justifications associées.
export const reconcileAnomalies = (
  structureId: number,
  detected: DetectedAnomalie[],
  evaluatedCodes: AnomalieCode[]
): Promise<unknown> =>
  prisma.$transaction([
    prisma.anomalie.createMany({
      data: detected.map((detectee) => ({ structureId, ...detectee })),
      skipDuplicates: true,
    }),
    prisma.anomalie.deleteMany({
      where: {
        structureId,
        code: { in: evaluatedCodes },
        NOT: detected.map(({ code, year, targetId }) => ({
          code,
          year,
          targetId,
        })),
      },
    }),
  ]);
