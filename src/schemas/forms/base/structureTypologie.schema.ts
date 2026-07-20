import z from "zod";

import {
  zId,
  zSafePositiveInteger,
  zSafeYear,
} from "@/app/utils/zodCustomFields";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";

// Cas commun (tableau par année : modif / actualisation / finalisation) :
// placesAutorisees ≥ seuil est dérivée de la version courante et affichée en
// lecture seule → nullable. L'exigence « rempli pour les années legacy » est
// portée par le wrapper structureTypologiesSchema (superRefine), pas ici : un
// refine transformerait cet objet en ZodEffects et casserait le .partial() de
// l'autosave.
export const structureTypologieSchema = z.object({
  id: zId(),
  placesAutorisees: zSafePositiveInteger().nullish(),
  pmr: zSafePositiveInteger(),
  lgbt: zSafePositiveInteger(),
  fvvTeh: zSafePositiveInteger(),
  year: zSafeYear(),
});

export const structureTypologiesSchema = z
  .object({
    structureTypologies: z.array(structureTypologieSchema),
  })
  .superRefine((values, ctx) => {
    values.structureTypologies.forEach((typologie, index) => {
      if (
        typologie.year < PLACES_VERSIONED_FROM_YEAR &&
        typologie.placesAutorisees == null
      ) {
        ctx.addIssue({
          code: "custom",
          path: ["structureTypologies", index, "placesAutorisees"],
          message: "Le nombre de places autorisées est requis",
        });
      }
    });
  });

export const structureTypologiesAutoSaveSchema = z.object({
  structureTypologies: z.array(
    structureTypologieSchema.partial().extend({ year: zSafeYear() })
  ),
});

// Transfo : une seule année (celle de la transfo, ≥ seuil), la capacité est un
// input éditable et requis (la nouvelle capacité déclarée), pas une dérivée.
export const transformationTypologieSchema = structureTypologieSchema.extend({
  placesAutorisees: zSafePositiveInteger(),
});

export type StructureTypologieSchemaTypeFormValues = z.infer<
  typeof structureTypologieSchema
>;
