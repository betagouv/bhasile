import { Prisma } from "@/generated/prisma/client";

import { resolvableVersionSelect } from "../structure-versions/structure-version.db.type";
import { includedStructureWhere } from "../structures/structure.db.type";

export const cpomListInclude = {
  structures: { where: { structure: includedStructureWhere } },
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
    where: { structure: includedStructureWhere },
    include: {
      structure: {
        select: {
          id: true,
          codeBhasile: true,
          type: true,
          departementAdministratif: true,
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
