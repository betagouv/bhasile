import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

import { structureApiSchema } from "./structure.schema";

export const antenneApiSchema = z.object({
  id: zId(),
  structure: structureApiSchema.optional(),
  name: z.string(),
  adresse: z.string(),
  codePostal: z.string(),
  commune: z.string(),
  departement: z.string(),
});

export type AntenneApiType = z.infer<typeof antenneApiSchema>;
