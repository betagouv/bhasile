import { z } from "zod";

import { Repartition } from "@/types/adresse.type";

export const adresseAdministrativeSchema = z.object({
  nom: z.string().optional(),
  adresseAdministrativeComplete: z.string().min(3),
  adresseAdministrative: z.string().nonempty(),
  codePostalAdministratif: z.string().nonempty(),
  communeAdministrative: z.string().nonempty(),
  departementAdministratif: z.string().nonempty(),
});

export const typeBatiSchema = z.object({
  typeBati: z.nativeEnum(Repartition),
  sameAddress: z.boolean().optional(),
});
export const adresseAdministrativeWithTypeBatiSchema =
  adresseAdministrativeSchema.and(typeBatiSchema);

export const adresseAdministrativeAutoSaveSchema =
  adresseAdministrativeSchema.partial();

export type AdresseAdministrativeFormValues = z.infer<
  typeof adresseAdministrativeSchema
>;
