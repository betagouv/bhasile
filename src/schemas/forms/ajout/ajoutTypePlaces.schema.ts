import { z } from "zod";

import { structureTypologieWithoutEvolutionSchema } from "../base/structureTypologie.schema";

export const ajoutTypePlacesSchema = z.object({
  typologies: z.array(structureTypologieWithoutEvolutionSchema).optional(),
});

export type AjoutTypePlacesFormValues = z.infer<typeof ajoutTypePlacesSchema>;
