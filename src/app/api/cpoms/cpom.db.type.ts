import { Prisma } from "@/generated/prisma/client";
import { CpomApiWrite } from "@/schemas/api/cpom.schema";

import {
  cpomLinkedStructureSelect,
  includedStructureWhere,
} from "../structures/structure.db.type";

const regionWithDepartementsInclude = {
  include: { departements: true },
} satisfies Prisma.RegionDefaultArgs;

export const cpomListInclude = {
  structures: {
    where: { structure: includedStructureWhere },
    include: { structure: { select: { type: true } } },
  },
  budgets: true,
  operateur: true,
  region: regionWithDepartementsInclude,
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
    where: { fileUploads: { some: {} } },
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
  region: regionWithDepartementsInclude,
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
    where: { fileUploads: { some: {} } },
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
  operateurId: true,
  granularity: true,
  regionId: true,
  structures: { select: { structureId: true } },
  departements: { select: { departement: { select: { numero: true } } } },
} satisfies Prisma.CpomSelect;

export type CpomDbScope = Prisma.CpomGetPayload<{
  select: typeof cpomScopeSelect;
}>;

export type CpomToSave = CpomApiWrite & {
  operateurId: number;
  regionId?: number | null;
};
