import z from "zod";

import { typeBatiAndAdressesSchema } from "@/schemas/forms/base/adresse.schema";
import { structureTypologieWithoutEvolutionSchema } from "@/schemas/forms/base/structureTypologie.schema";

export const creationPlacesEtHebergementSchema = typeBatiAndAdressesSchema.and(
  z.object({
    structureTypologies: z.tuple([structureTypologieWithoutEvolutionSchema]),
  })
);

export type CreationPlacesEtHebergementFormValues = z.infer<
  typeof creationPlacesEtHebergementSchema
>;
