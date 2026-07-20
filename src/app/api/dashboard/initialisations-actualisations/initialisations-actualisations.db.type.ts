import { Prisma } from "@/generated/prisma/client";

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
      id: true,
      effectiveDate: true,
      communeAdministrative: true,
      departementAdministratif: true,
      structureVersionTransformationId: true,
      structureVersionTransformation: {
        select: {
          type: true,
          transformation: { select: { form: { select: { status: true } } } },
        },
      },
    },
  },
} satisfies Prisma.StructureSelect;

export type DashboardStructure = Prisma.StructureGetPayload<{
  select: typeof dashboardStructureSelect;
}>;
