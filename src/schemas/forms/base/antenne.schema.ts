import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

const antenneSchema = z.object({
  id: zId(),
  structureId: zId(),
  name: z.string().min(1),
  adresseComplete: z.string().optional(),
  adresse: z.string().min(1),
  codePostal: z.string().min(1),
  commune: z.string().min(1),
  departement: z.string().optional(),
});

export const antennesSchema = z.object({
  antennes: z.array(antenneSchema),
});

export type AntenneFormValues = z.infer<typeof antenneSchema>;
