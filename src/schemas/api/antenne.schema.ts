import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const antenneApiSchema = z.object({
  id: zId(),
  name: z.string(),
  adresse: z.string(),
  codePostal: z.string(),
  commune: z.string(),
  departement: z.string(),
});

export type AntenneApiType = z.infer<typeof antenneApiSchema>;
