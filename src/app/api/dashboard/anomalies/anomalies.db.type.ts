import { FINALISATION_FORM_SLUG } from "@/app/api/forms/form.constants";
import {
  resolvableVersionSelect,
  transformationStatusSelect,
} from "@/app/api/structure-versions/structure-version.db.type";
import { Prisma } from "@/generated/prisma/client";
import { DISPLAYED_ANOMALIE_CODES } from "@/lib/anomalies/anomalie.definition";

export const anomalieStructureSelect = {
  id: true,
  codeBhasile: true,
  type: true,
  departementAdministratif: true,
  fermetureDate: true,
  operateur: { select: { id: true, name: true } },
  forms: {
    where: { formDefinition: { slug: FINALISATION_FORM_SLUG } },
    select: { status: true, formDefinition: { select: { slug: true } } },
  },
  // Toutes les versions : isBornFromCreation les parcourt, pas seulement la courante.
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
  anomalies: {
    where: { code: { in: DISPLAYED_ANOMALIE_CODES } },
    select: {
      id: true,
      code: true,
      year: true,
      isJustified: true,
      commentaire: true,
    },
  },
} satisfies Prisma.StructureSelect;

export type AnomalieStructure = Prisma.StructureGetPayload<{
  select: typeof anomalieStructureSelect;
}>;
