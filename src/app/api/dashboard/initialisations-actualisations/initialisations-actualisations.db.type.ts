import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import { Prisma } from "@/generated/prisma/client";

export const dashboardStructureSelect = {
  id: true,
  codeBhasile: true,
  operateur: { select: { id: true, name: true } },
  forms: {
    where: { formDefinition: { slug: FINALISATION_FORM_SLUG } },
    select: { status: true },
  },
  structureVersions: {
    select: {
      id: true,
      effectiveDate: true,
      type: true,
      communeAdministrative: true,
      departementAdministratif: true,
      structureVersionTransformationId: true,
      structureVersionTransformation: {
        select: {
          type: true,
          transformation: { select: { form: { select: { status: true } } } },
        },
      },
      campaignId: true,
      campaign: {
        select: {
          campaignDefinition: { select: { slug: true } },
          form: {
            select: {
              status: true,
              formSteps: {
                select: {
                  status: true,
                  stepDefinition: { select: { slug: true } },
                },
              },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.StructureSelect;

export type DashboardStructure = Prisma.StructureGetPayload<{
  select: typeof dashboardStructureSelect;
}>;
