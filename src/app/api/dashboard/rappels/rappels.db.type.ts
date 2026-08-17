import { ActeAdministratifDates } from "@/app/api/actes-administratifs/acte-administratif.util";
import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import {
  resolvableVersionSelect,
  transformationStatusSelect,
} from "@/app/api/structure-versions/structure-version.db.type";
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
  departementAdministratif: true,
  fermetureDate: true,
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
  operateur: { select: { id: true, name: true } },
  forms: {
    where: { formDefinition: { slug: FINALISATION_FORM_SLUG } },
    select: { status: true, formDefinition: { select: { slug: true } } },
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

export type RappelCpom = {
  id: number;
  name: string | null;
  operateur: { id: number; name: string };
  departements: { departement: { numero: string } }[];
  actesAdministratifs: ActeAdministratifDates[];
};
