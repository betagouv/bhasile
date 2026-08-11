import { Form, Prisma, StructureType } from "@/generated/prisma/client";

import {
  resolvableVersionSelect,
  type StructureVersionDbDetails,
  structureVersionDetailsInclude,
  transformationStatusSelect,
} from "../structure-versions/structure-version.db.type";
import { VERSIONED_FIELD_KEYS } from "./structure.constants";

export const structureListLightVersionSelect = {
  ...resolvableVersionSelect,
  nom: true,
  departementAdministratif: true,
  communeAdministrative: true,
  codePostalAdministratif: true,
  latitude: true,
  longitude: true,
  structureVersionTransformation: {
    select: { type: true, motif: true, ...transformationStatusSelect },
  },
  placesAutorisees: true,
  adresses: { select: { repartition: true } },
  dnaStructures: { select: { dna: { select: { code: true } } } },
  structureFinesses: { select: { finess: { select: { code: true } } } },
} satisfies Prisma.StructureVersionSelect;

export const structureListLightSelect = {
  id: true,
  codeBhasile: true,
  type: true,
  operateurId: true,
  operateur: { select: { name: true } },
  forms: {
    select: { status: true, formDefinition: { select: { slug: true } } },
  },
  actesAdministratifs: {
    select: {
      id: true,
      category: true,
      parentId: true,
      startDate: true,
      endDate: true,
    },
  },
  structureTypologies: {
    select: { year: true, placesAutorisees: true },
    orderBy: { year: "desc" },
  },
  structureVersions: { select: structureListLightVersionSelect },
} satisfies Prisma.StructureSelect;

export const structureListVersionInclude = {
  contacts: true,
  adresses: true,
  antennes: true,
  structureFinesses: {
    include: { finess: true },
  },
  dnaStructures: {
    orderBy: { dna: { code: "asc" } },
    include: { dna: true },
  },
} satisfies Prisma.StructureVersionInclude;

export const structureListInclude = {
  cpomStructures: {
    include: {
      cpom: {
        include: {
          actesAdministratifs: {
            include: { fileUploads: true },
          },
        },
      },
    },
  },
  operateur: {
    include: { parent: true },
  },
  structureMillesimes: {
    orderBy: { year: "desc" },
  },
  structureTypologies: {
    orderBy: { year: "desc" },
  },
  forms: {
    include: { formDefinition: true },
  },
  actesAdministratifs: true,
} satisfies Prisma.StructureInclude;

export const structureDetailsInclude = {
  anomalies: {
    where: { isJustified: true },
    select: { code: true, year: true, targetId: true },
  },
  structureTypologies: {
    orderBy: { year: "desc" },
  },
  structureMillesimes: {
    orderBy: { year: "desc" },
  },
  cpomStructures: {
    include: {
      cpom: {
        include: {
          structures: {
            include: {
              structure: {
                select: {
                  id: true,
                  codeBhasile: true,
                  type: true,
                  operateur: {
                    select: { name: true },
                  },
                  forms: true,
                  structureVersions: {
                    select: {
                      ...resolvableVersionSelect,
                      communeAdministrative: true,
                    },
                  },
                },
              },
            },
          },
          operateur: true,
          region: true,
          departements: {
            include: { departement: true },
          },
          actesAdministratifs: {
            include: { fileUploads: true },
          },
          documentsFinanciers: {
            include: { fileUploads: true },
          },
          budgets: {
            orderBy: { year: "desc" },
          },
        },
      },
    },
  },
  evaluations: {
    include: { fileUploads: true },
    orderBy: { date: "desc" },
  },
  controles: {
    include: { fileUploads: true },
    orderBy: { date: "desc" },
  },
  actesAdministratifs: {
    include: { fileUploads: true },
  },
  documentsFinanciers: {
    include: { fileUploads: true },
  },
  budgets: {
    orderBy: { year: "desc" },
  },
  indicateursFinanciers: {
    orderBy: { year: "desc" },
  },
  operateur: {
    include: { parent: true },
  },
  forms: {
    include: {
      formDefinition: true,
      formSteps: {
        include: { stepDefinition: true },
      },
    },
  },
  structureVersions: {
    include: structureVersionDetailsInclude,
  },
} satisfies Prisma.StructureInclude;

export type StructureListLight = Prisma.StructureGetPayload<{
  select: typeof structureListLightSelect;
}>;

export type StructureListLightVersion =
  StructureListLight["structureVersions"][number];

export type StructureDbList = Prisma.StructureGetPayload<{
  include: typeof structureListInclude & {
    structureVersions: { include: typeof structureListVersionInclude };
  };
}>;

export type StructureDbDetails = Prisma.StructureGetPayload<{
  include: typeof structureDetailsInclude;
}>;

// Structure enrichie des champs versionnés résolus depuis sa version courante.
export type ResolvedStructureDetails = StructureDbDetails &
  Pick<StructureVersionDbDetails, (typeof VERSIONED_FIELD_KEYS)[number]>;

export type StructureDbOperateur = {
  id: number;
  type: StructureType | null;
  codeBhasile: string;
  forms: Form[];
};
