import { startOfNextUtcDay } from "@/app/utils/date.util";
import { Prisma } from "@/generated/prisma/client";

export const currentVersionWhere = (
  now: Date
): Prisma.StructureVersionWhereInput => ({
  effectiveDate: { lt: startOfNextUtcDay(now) },
  OR: [
    { structureVersionTransformationId: null },
    {
      structureVersionTransformation: {
        transformation: { form: { status: true } },
      },
    },
  ],
});

export const currentVersionArgs = (now: Date) =>
  ({
    where: currentVersionWhere(now),
    orderBy: [{ effectiveDate: "desc" }, { id: "desc" }],
    take: 1,
  }) satisfies Pick<
    Prisma.StructureVersionFindManyArgs,
    "where" | "orderBy" | "take"
  >;

export const structureVersionDetailsInclude = {
  contacts: true,
  adresses: {
    include: {
      adresseTypologies: {
        orderBy: { year: "desc" },
      },
    },
  },
  antennes: true,
  structureFinesses: {
    include: { finess: true },
  },
  dnaStructures: {
    orderBy: { dna: { code: "asc" } },
    include: {
      dna: {
        include: {
          activites: {
            orderBy: { date: "desc" },
          },
          evenementsIndesirablesGraves: {
            orderBy: { evenementDate: "desc" },
          },
        },
      },
    },
  },
  structureVersionTransformation: {
    include: {
      transformation: {
        include: {
          form: true,
          structureVersionTransformations: {
            include: {
              structureVersion: {
                select: {
                  structure: {
                    select: { id: true, codeBhasile: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.StructureVersionInclude;

export type StructureVersionDbDetails = Prisma.StructureVersionGetPayload<{
  include: typeof structureVersionDetailsInclude;
}>;

export type StructureVersionDbTransformation =
  Prisma.StructureVersionGetPayload<{
    include: {
      structure: {
        include: {
          operateur: { select: { id: true; name: true } };
        };
      };
      contacts: true;
      adresses: {
        include: {
          adresseTypologies: {
            orderBy: {
              year: "desc";
            };
          };
        };
      };
      structureFinesses: {
        include: {
          finess: true;
        };
      };
      antennes: true;
      dnaStructures: {
        include: { dna: true };
      };
    };
  }>;
