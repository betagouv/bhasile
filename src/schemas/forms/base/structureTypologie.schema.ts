import z from "zod";

import {
  zId,
  zSafePositiveInteger,
  zSafeYear,
} from "@/app/utils/zodCustomFields";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";

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

export const transformationTypologieSchema = structureTypologieSchema.extend({
  placesAutorisees: zSafePositiveInteger(),
});

export type StructureTypologieSchemaTypeFormValues = z.infer<
  typeof structureTypologieSchema
>;
