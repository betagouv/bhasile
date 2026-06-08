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
  finessesAutoSaveSchema,
  finessesSchema,
} from "@/schemas/forms/base/finess.schema";
import { structureBaseSchema } from "@/schemas/forms/base/structure.base.schema";

const baseTransformationIdentificationSchema = structureBaseSchema.extend({
  effectiveDate: frenchDateToISO(),
});

export const transformationIdentificationSchema =
  baseTransformationIdentificationSchema
    .and(adresseAdministrativeSchema)
    .and(antennesSchema)
    .and(dnaStructuresSchema)
    .and(finessesSchema)
    .and(contactsSchema);

export const transformationIdentificationDraftSchema = z.preprocess(
  blankStringsToUndefined,
  baseTransformationIdentificationSchema
    .partial()
    .and(adresseAdministrativeAutoSaveSchema)
    .and(antennesAutoSaveSchema)
    .and(dnaStructuresAutoSaveSchema)
    .and(finessesAutoSaveSchema)
    .and(contactsAutoSaveSchema)
);

export type TransformationIdentificationFormValues = z.infer<
  typeof transformationIdentificationSchema
>;

export type TransformationIdentificationDraftFormValues = z.infer<
  typeof transformationIdentificationDraftSchema
>;
