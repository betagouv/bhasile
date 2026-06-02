import z from "zod";

import { nullishFrenchDateToISO } from "@/app/utils/zodCustomFields";
import { adresseAdministrativeSchema } from "@/schemas/forms/base/adresseAdministrative.schema";
import { antennesSchema } from "@/schemas/forms/base/antenne.schema";
import { contactsSchema } from "@/schemas/forms/base/contact.schema";
import { dnaStructuresSchema } from "@/schemas/forms/base/dna.schema";
import { finessesSchema } from "@/schemas/forms/base/finess.schema";
import { operateurSchema } from "@/schemas/forms/base/operateur.schema";
import { structureBaseSchema } from "@/schemas/forms/base/structure.base.schema";

const baseCreationIdentificationSchema = structureBaseSchema.extend({
  operateur: operateurSchema,
  creationDate: nullishFrenchDateToISO(),
  filiale: z.string().optional(),
});

export const creationIdentificationSchema = baseCreationIdentificationSchema
  .and(adresseAdministrativeSchema)
  .and(antennesSchema)
  .and(dnaStructuresSchema)
  .and(finessesSchema)
  .and(contactsSchema);

export type CreationIdentificationFormValues = z.infer<
  typeof creationIdentificationSchema
>;
