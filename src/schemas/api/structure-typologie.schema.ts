import z from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";

export const structureTypologieApiSchema = z.object({
  id: z.number().optional(),
  year: zSafeYear(),
  placesAutorisees: z.number().int(),
  pmr: z.number().int(),
  lgbt: z.number().int(),
  fvvTeh: z.number().int(),
  placesACreer: z.number().int().nullish(),
  placesAFermer: z.number().int().nullish(),
  echeancePlacesACreer: z.iso.datetime().nullish(),
  echeancePlacesAFermer: z.iso.datetime().nullish(),
});

export type StructureTypologieApiType = z.infer<
  typeof structureTypologieApiSchema
>;
