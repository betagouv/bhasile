import { Prisma } from "@/generated/prisma/client";

export const cpomListInclude = {
  structures: true,
  budgets: true,
  operateur: true,
  region: true,
  departements: {
    include: {
      departement: true,
    },
  },
  actesAdministratifs: {
    include: {
      fileUploads: true,
    },
  },
  documentsFinanciers: {
    include: {
      fileUploads: true,
    },
  },
} satisfies Prisma.CpomInclude;

export const cpomDetailsInclude = {
  structures: {
    include: {
      structure: {
        select: {
          id: true,
          codeBhasile: true,
          type: true,
          operateur: {
            select: {
              name: true,
            },
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
                select: { form: { select: { status: true } } },
              },
            },
          },
        },
      },
    },
  },
  budgets: true,
  operateur: true,
  region: true,
  departements: {
    include: {
      departement: true,
    },
  },
  actesAdministratifs: {
    include: {
      fileUploads: true,
    },
  },
  documentsFinanciers: {
    include: {
      fileUploads: true,
    },
  },
} satisfies Prisma.CpomInclude;

export type CpomDbList = Prisma.CpomGetPayload<{
  include: typeof cpomListInclude;
}>;

export type CpomDbDetails = Prisma.CpomGetPayload<{
  include: typeof cpomDetailsInclude;
}>;
