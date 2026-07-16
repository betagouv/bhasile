import { Form, Prisma, StructureType } from "@/generated/prisma/client";

import { structureVersionDetailsInclude } from "../structure-versions/structure-version.db.type";

export const structureListLightVersionSelect = {
  id: true,
  effectiveDate: true,
  structureVersionTransformationId: true,
  nom: true,
  departementAdministratif: true,
  communeAdministrative: true,
  codePostalAdministratif: true,
  latitude: true,
  longitude: true,
  structureVersionTransformation: {
    select: {
      type: true,
      motif: true,
      transformation: { select: { form: { select: { status: true } } } },
    },
  },
  campaignId: true,
  campaign: {
    select: { form: { select: { status: true } } },
  },
  adresses: { select: { repartition: true } },
  structureTypologies: {
    orderBy: { year: "desc" },
    select: { year: true, placesAutorisees: true },
  },
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
  structureVersions: { select: structureListLightVersionSelect },
} satisfies Prisma.StructureSelect;

export const structureListVersionInclude = {
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
  structureTypologies: {
    orderBy: { year: "desc" },
  },
  dnaStructures: {
    orderBy: { dna: { code: "asc" } },
    include: { dna: true },
  },
} satisfies Prisma.StructureVersionInclude;

export const structureListInclude = {
  adresses: {
    include: {
      adresseTypologies: {
        orderBy: { year: "desc" },
      },
    },
  },
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
  dnaStructures: {
    orderBy: { dna: { code: "asc" } },
    include: { dna: true },
  },
  actesAdministratifs: true,
} satisfies Prisma.StructureInclude;

export const structureDetailsInclude = {
  userNotes: {
    orderBy: { createdAt: "desc" },
    select: { text: true },
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
  structureFinesses: {
    include: { finess: true },
  },
  adresses: {
    include: {
      adresseTypologies: {
        orderBy: { year: "desc" },
      },
    },
  },
  antennes: true,
  contacts: true,
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
                      id: true,
                      effectiveDate: true,
                      communeAdministrative: true,
                      structureVersionTransformationId: true,
                      structureVersionTransformation: {
                        select: {
                          transformation: {
                            select: { form: { select: { status: true } } },
                          },
                        },
                      },
                      campaignId: true,
                      campaign: {
                        select: {
                          form: { select: { status: true } },
                        },
                      },
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

export type StructureDbOperateur = {
  id: number;
  type: StructureType | null;
  codeBhasile: string;
  forms: Form[];
};
