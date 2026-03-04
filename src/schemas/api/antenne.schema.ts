import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

export const antenneApiSchema = z.object({
  id: zId(),
  name: z.string().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  commune: z.string().optional(),
  departement: z.string().optional(),
});

export type AntenneApiType = z.infer<typeof antenneApiSchema>;
