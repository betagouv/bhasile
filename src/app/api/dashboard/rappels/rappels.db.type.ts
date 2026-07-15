import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import { Prisma } from "@/generated/prisma/client";

const acteDatesSelect = {
  id: true,
  category: true,
  parentId: true,
  startDate: true,
  endDate: true,
} satisfies Prisma.ActeAdministratifSelect;

export const rappelStructureSelect = {
  id: true,
  codeBhasile: true,
  type: true,
  communeAdministrative: true,
  departementAdministratif: true,
  operateur: { select: { id: true, name: true } },
  forms: {
    where: { formDefinition: { slug: FINALISATION_FORM_SLUG } },
    select: { status: true },
  },
  actesAdministratifs: { select: acteDatesSelect },
  evaluations: { select: { date: true } },
  cpomStructures: {
    select: {
      dateStart: true,
      dateEnd: true,
      cpom: {
        select: {
          id: true,
          name: true,
          operateur: { select: { name: true } },
          departements: {
            select: { departement: { select: { numero: true } } },
          },
          actesAdministratifs: { select: acteDatesSelect },
        },
      },
    },
  },
} satisfies Prisma.StructureSelect;

export type RappelStructure = Prisma.StructureGetPayload<{
  select: typeof rappelStructureSelect;
}>;
