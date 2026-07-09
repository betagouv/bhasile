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
    public: z.enum(PublicType),
    structureTypologies: z.tuple([structureTypologieSchema]),
  })
);

export const creationPlacesEtHebergementDraftSchema = z.preprocess(
  emptyValuesToUndefined,
  typeBatiAndAdressesAutoSaveSchema
    .and(z.object({ public: z.enum(PublicType).optional() }))
    .and(structureTypologiesAutoSaveSchema)
);

export type CreationPlacesEtHebergementFormValues = z.infer<
  typeof creationPlacesEtHebergementSchema
>;

export type CreationPlacesEtHebergementDraftFormValues = z.infer<
  typeof creationPlacesEtHebergementDraftSchema
>;

const PLACES_AUTORISEES_PATH = ["structureTypologies", 0, "placesAutorisees"];

export type PlacesDirection = "valid" | "contradiction" | "unchanged";

export const getPlacesDirection = (
  formKind: FormKind,
  originalPlaces: number,
  placesAutorisees: number | undefined
): PlacesDirection => {
  const isExtension = formKind === FormKind.EXTENSION;
  const isContraction = formKind === FormKind.CONTRACTION;
  if (!isExtension && !isContraction) {
    return "valid";
  }
  if (placesAutorisees === undefined || !Number.isFinite(placesAutorisees)) {
    return "valid";
  }
  if (placesAutorisees === originalPlaces) {
    return "unchanged";
  }
  const isIncreasing = placesAutorisees > originalPlaces;
  const isCoherent = isExtension ? isIncreasing : !isIncreasing;
  return isCoherent ? "valid" : "contradiction";
};

export const getPlacesDirectionMessage = (
  formKind: FormKind,
  originalPlaces: number
): string =>
  formKind === FormKind.EXTENSION
    ? `Le nombre de places autorisées doit être supérieur au nombre de places précédent (${originalPlaces}).`
    : `Le nombre de places autorisées doit être inférieur au nombre de places précédent (${originalPlaces}).`;

export const getPlacesEtHebergementSchema = (
  formKind: FormKind,
  originalPlaces?: number
) => {
  const isExtensionOrContraction =
    formKind === FormKind.EXTENSION || formKind === FormKind.CONTRACTION;

  if (originalPlaces === undefined || !isExtensionOrContraction) {
    return creationPlacesEtHebergementSchema;
  }

  return creationPlacesEtHebergementSchema.check(
    z.superRefine((data, ctx) => {
      const placesAutorisees = data.structureTypologies?.[0]?.placesAutorisees;
      const direction = getPlacesDirection(
        formKind,
        originalPlaces,
        placesAutorisees
      );

      if (direction === "valid") {
        return;
      }

      ctx.addIssue({
        code: "custom",
        message: getPlacesDirectionMessage(formKind, originalPlaces),
        path: PLACES_AUTORISEES_PATH,
      });
    })
  );
};
