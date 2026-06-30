import z from "zod";

import { emptyValuesToUndefined } from "@/app/utils/zodCustomFields";
import {
  typeBatiAndAdressesAutoSaveSchema,
  typeBatiAndAdressesSchema,
} from "@/schemas/forms/base/adresse.schema";
import {
  structureTypologiesAutoSaveSchema,
  structureTypologieSchema,
} from "@/schemas/forms/base/structureTypologie.schema";
import { FormKind } from "@/types/global";
import { PublicType } from "@/types/structure.type";

export const creationPlacesEtHebergementSchema = typeBatiAndAdressesSchema.and(
  z.object({
    public: z.nativeEnum(PublicType),
    structureTypologies: z.tuple([structureTypologieSchema]),
  })
);

export const creationPlacesEtHebergementDraftSchema = z.preprocess(
  emptyValuesToUndefined,
  typeBatiAndAdressesAutoSaveSchema
    .and(z.object({ public: z.nativeEnum(PublicType).optional() }))
    .and(structureTypologiesAutoSaveSchema)
);

export type CreationPlacesEtHebergementFormValues = z.infer<
  typeof creationPlacesEtHebergementSchema
>;

export type CreationPlacesEtHebergementDraftFormValues = z.infer<
  typeof creationPlacesEtHebergementDraftSchema
>;

const PLACES_AUTORISEES_PATH = ["structureTypologies", 0, "placesAutorisees"];

export const getPlacesEtHebergementSchema = (
  formKind: FormKind,
  originalPlaces?: number
) => {
  const isExtensionOrContraction =
    formKind === FormKind.EXTENSION || formKind === FormKind.CONTRACTION;

  if (originalPlaces === undefined || !isExtensionOrContraction) {
    return creationPlacesEtHebergementSchema;
  }

  return creationPlacesEtHebergementSchema.superRefine((data, ctx) => {
    const placesAutorisees = data.structureTypologies?.[0]?.placesAutorisees;

    if (!Number.isFinite(placesAutorisees)) {
      return;
    }

    if (formKind === FormKind.EXTENSION && placesAutorisees <= originalPlaces) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le nombre de places autorisées doit être supérieur au nombre de places précédent (${originalPlaces}).`,
        path: PLACES_AUTORISEES_PATH,
      });
    }

    if (
      formKind === FormKind.CONTRACTION &&
      placesAutorisees >= originalPlaces
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Le nombre de places autorisées doit être inférieur au nombre de places précédent (${originalPlaces}).`,
        path: PLACES_AUTORISEES_PATH,
      });
    }
  });
};
