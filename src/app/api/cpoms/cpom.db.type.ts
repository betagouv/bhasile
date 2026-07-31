import { Prisma } from "@/generated/prisma/client";

import { resolvableVersionSelect } from "../structure-versions/structure-version.db.type";

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
              ...resolvableVersionSelect,
              communeAdministrative: true,
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
} satisfies Prisma.CpomInclude;

export type CpomDbList = Prisma.CpomGetPayload<{
  include: typeof cpomListInclude;
}>;

export type CpomDbDetails = Prisma.CpomGetPayload<{
  include: typeof cpomDetailsInclude;
}>;
