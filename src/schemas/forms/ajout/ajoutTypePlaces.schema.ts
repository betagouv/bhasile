import { z } from "zod";

import { structureTypologieSchema } from "../base/structureTypologie.schema";

export const ajoutTypePlacesSchema = z.object({
  typologies: z.array(structureTypologieSchema).optional(),
});

export type AjoutTypePlacesFormValues = z.infer<typeof ajoutTypePlacesSchema>;
