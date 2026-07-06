import z from "zod";

import {
  zId,
  zSafePositiveInteger,
  zSafeYear,
} from "@/app/utils/zodCustomFields";

export const structureTypologieSchema = z.object({
  id: zId(),
  placesAutorisees: zSafePositiveInteger(),
  pmr: zSafePositiveInteger(),
  lgbt: zSafePositiveInteger(),
  fvvTeh: zSafePositiveInteger(),
  year: zSafeYear(),
});

export const structureTypologiesSchema = z.object({
  structureTypologies: z.array(structureTypologieSchema),
});

export const structureTypologiesAutoSaveSchema = z.object({
  structureTypologies: z.array(
    structureTypologieSchema.partial().extend({ year: zSafeYear() })
  ),
});

export type StructureTypologieSchemaTypeFormValues = z.infer<
  typeof structureTypologieSchema
>;
