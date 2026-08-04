import { startOfNextUtcDay } from "@/app/utils/date.util";
import { Prisma } from "@/generated/prisma/client";

/** Une version liée à une transformation non finalisée n'est jamais "effective". */
export const finalizedVersionWhere: Prisma.StructureVersionWhereInput = {
  OR: [
    { structureVersionTransformationId: null },
    {
      structureVersionTransformation: {
        transformation: { form: { status: true } },
      },
    },
  ],
};

export const currentVersionWhere = (
  now: Date
): Prisma.StructureVersionWhereInput => ({
  AND: [
    {
      OR: [
        { effectiveDate: null },
        { effectiveDate: { lt: startOfNextUtcDay(now) } },
      ],
    },
    finalizedVersionWhere,
  ],
});

export const currentVersionArgs = (now: Date) =>
  ({
    where: currentVersionWhere(now),
    orderBy: [
      { effectiveDate: { sort: "desc", nulls: "last" } },
      { id: "desc" },
    ],
    take: 1,
  }) satisfies Pick<
    Prisma.StructureVersionFindManyArgs,
    "where" | "orderBy" | "take"
  >;

/** Seul champ de la transfo consommé par isVersionValid. */
export const transformationStatusSelect = {
  transformation: { select: { form: { select: { status: true } } } },
} satisfies Prisma.StructureVersionTransformationSelect;

/** Champs exigés par ResolvableVersion à étendre selon les besoins de l'appelant. */
export const resolvableVersionSelect = {
  id: true,
  effectiveDate: true,
  structureVersionTransformationId: true,
  structureVersionTransformation: { select: transformationStatusSelect },
} satisfies Prisma.StructureVersionSelect;

export const structureVersionDetailsInclude = {
  contacts: true,
  adresses: true,
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
      adresses: true;
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
