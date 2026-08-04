import { currentVersionArgs } from "@/app/api/structure-versions/structure-version.db.type";
import type { Prisma } from "@/generated/prisma/client";

export const structureAnomalieInclude = (now: Date) =>
  ({
    structureTypologies: true,
    budgets: true,
    indicateursFinanciers: true,
    evaluations: { select: { date: true } },
    actesAdministratifs: {
      include: { _count: { select: { fileUploads: true } } },
    },
    departement: { include: { regionAdministrative: true } },
    cpomStructures: {
      include: {
        cpom: {
          include: {
            _count: { select: { structures: true } },
            actesAdministratifs: {
              include: { _count: { select: { fileUploads: true } } },
            },
          },
        },
      },
    },
    structureVersions: {
      ...currentVersionArgs(now),
      include: {
        adresses: { select: { id: true, placesAutorisees: true } },
        dnaStructures: {
          include: {
            dna: {
              include: {
                activites: { orderBy: { date: "desc" }, take: 1 },
              },
            },
          },
        },
      },
    },
  }) satisfies Prisma.StructureInclude;

export type StructureAnomalieDb = Prisma.StructureGetPayload<{
  include: ReturnType<typeof structureAnomalieInclude>;
}>;
