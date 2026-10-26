import { Prisma } from "@/generated/prisma/client";

import {
  cpomLinkedStructureSelect,
  includedStructureWhere,
} from "../structures/structure.db.type";

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
      structure: { select: cpomLinkedStructureSelect },
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

export const cpomScopeSelect = {
  structures: { select: { structureId: true } },
  departements: { select: { departement: { select: { numero: true } } } },
} satisfies Prisma.CpomSelect;

export type CpomDbScope = Prisma.CpomGetPayload<{
  select: typeof cpomScopeSelect;
}>;
