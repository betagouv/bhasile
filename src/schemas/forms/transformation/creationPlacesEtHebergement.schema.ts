import z from "zod";

import { typeBatiAndAdressesSchema } from "@/schemas/forms/base/adresse.schema";
import { structureTypologieWithoutEvolutionSchema } from "@/schemas/forms/base/structureTypologie.schema";
import { PublicType } from "@/types/structure.type";

export const creationPlacesEtHebergementSchema = typeBatiAndAdressesSchema.and(
  z.object({
    public: z.nativeEnum(PublicType),
    structureTypologies: z.tuple([structureTypologieWithoutEvolutionSchema]),
  })
);

export type CreationPlacesEtHebergementFormValues = z.infer<
  typeof creationPlacesEtHebergementSchema
>;
