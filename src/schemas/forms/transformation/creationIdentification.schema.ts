import z from "zod";

import {
  blankStringsToUndefined,
  frenchDateToISO,
} from "@/app/utils/zodCustomFields";
import {
  adresseAdministrativeAutoSaveSchema,
  adresseAdministrativeSchema,
} from "@/schemas/forms/base/adresseAdministrative.schema";
import {
  antennesAutoSaveSchema,
  antennesSchema,
} from "@/schemas/forms/base/antenne.schema";
import {
  contactsAutoSaveSchema,
  contactsSchema,
} from "@/schemas/forms/base/contact.schema";
import {
  dnaStructuresAutoSaveSchema,
  dnaStructuresSchema,
} from "@/schemas/forms/base/dna.schema";
import {
  structureFinessesAutoSaveSchema,
  structureFinessesSchema,
} from "@/schemas/forms/base/finess.schema";
import { operateurSchema } from "@/schemas/forms/base/operateur.schema";
import { structureBaseSchema } from "@/schemas/forms/base/structure.base.schema";

const baseCreationIdentificationSchema = structureBaseSchema.extend({
  operateur: operateurSchema,
  effectiveDate: frenchDateToISO(),
  filiale: z.string().optional(),
});

export const creationIdentificationSchema = baseCreationIdentificationSchema
  .and(adresseAdministrativeSchema)
  .and(antennesSchema)
  .and(dnaStructuresSchema)
  .and(structureFinessesSchema)
  .and(contactsSchema);

export const creationIdentificationDraftSchema = z.preprocess(
  blankStringsToUndefined,
  baseCreationIdentificationSchema
    .partial()
    .and(adresseAdministrativeAutoSaveSchema)
    .and(antennesAutoSaveSchema)
    .and(dnaStructuresAutoSaveSchema)
    .and(structureFinessesAutoSaveSchema)
    .and(contactsAutoSaveSchema)
);

export type CreationIdentificationFormValues = z.infer<
  typeof creationIdentificationSchema
>;

export type CreationIdentificationDraftFormValues = z.infer<
  typeof creationIdentificationDraftSchema
>;
