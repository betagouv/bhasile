import z from "zod";

import { zSafeStrictlyPositiveIntegerNullish } from "@/app/utils/zodCustomFields";
import { Repartition } from "@/types/adresse.type";

export const adresseApiSchema = z.object({
  id: z.number().optional(),
  adresse: z.string().optional(),
  codePostal: z.string().optional(),
  commune: z.string().optional(),
  adresseComplete: z.string().optional(),
  repartition: z.enum(Repartition).optional(),
  placesAutorisees: zSafeStrictlyPositiveIntegerNullish(),
  isQpv: z.boolean().optional(),
  isLogementSocial: z.boolean().optional(),
});

export type AdresseApiType = z.infer<typeof adresseApiSchema>;
