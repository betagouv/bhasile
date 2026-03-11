import { z } from "zod";

export const adresseAdministrativeSchema = z.object({
  nom: z.string().optional(),
  adresseAdministrativeComplete: z.string().min(3),
  adresseAdministrative: z.string().nonempty(),
  codePostalAdministratif: z.string().nonempty(),
  communeAdministrative: z.string().nonempty(),
  departementAdministratif: z.string().nonempty(),
});

export const adresseAdministrativeAutoSaveSchema =
  adresseAdministrativeSchema.partial();

export type AdresseAdministrativeFormValues = z.infer<
  typeof adresseAdministrativeSchema
>;
