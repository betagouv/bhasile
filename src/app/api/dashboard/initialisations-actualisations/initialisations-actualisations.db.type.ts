import { Prisma } from "@/generated/prisma/client";

import {
  resolvableVersionSelect,
  transformationStatusSelect,
} from "../../structure-versions/structure-version.db.type";

export const dashboardStructureSelect = {
  id: true,
  codeBhasile: true,
  type: true,
  operateur: { select: { id: true, name: true } },
  forms: {
    select: {
      status: true,
      formDefinition: { select: { slug: true } },
      formSteps: {
        select: {
          status: true,
          stepDefinition: { select: { slug: true } },
        },
      },
    },
  },
  structureVersions: {
    select: {
      ...resolvableVersionSelect,
      communeAdministrative: true,
      departementAdministratif: true,
      structureVersionTransformation: {
        select: { type: true, ...transformationStatusSelect },
      },
    },
  },
} satisfies Prisma.StructureSelect;

export type DashboardStructure = Prisma.StructureGetPayload<{
  select: typeof dashboardStructureSelect;
}>;
