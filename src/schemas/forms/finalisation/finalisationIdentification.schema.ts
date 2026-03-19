import z from "zod";

import {
  adresseAdministrativeAutoSaveSchema,
  adresseAdministrativeSchema,
} from "@/schemas/forms/base/adresseAdministrative.schema";
import {
  calendrierAutoSaveSchema,
  calendrierSchema,
} from "@/schemas/forms/base/calendrier.schema";
import {
  identificationSchemaWithContacts,
  identificationSchemaWithContactsAutoSaveSchema,
} from "@/schemas/forms/base/identification.schema";
import {
  structureTypologiesAutoSaveSchema,
  structureTypologiesSchema,
} from "@/schemas/forms/base/structureTypologie.schema";

import { antennesSchema } from "../base/antenne.schema";
import { dnaStructuresSchema } from "../base/dna.schema";
import { finessesSchema } from "../base/finess.schema";

export const finalisationIdentificationSchema = identificationSchemaWithContacts
  .and(dnaStructuresSchema)
  .and(finessesSchema)
  .and(calendrierSchema)
  .and(adresseAdministrativeSchema)
  .and(antennesSchema)
  .and(structureTypologiesSchema);

export const finalisationIdentificationAutoSaveSchema =
  identificationSchemaWithContactsAutoSaveSchema
    .and(dnaStructuresSchema)
    .and(finessesSchema)
    .and(calendrierAutoSaveSchema)
    .and(adresseAdministrativeAutoSaveSchema)
    .and(antennesSchema)
    .and(structureTypologiesAutoSaveSchema);

export type FinalisationIdentificationFormValues = z.infer<
  typeof finalisationIdentificationSchema
>;

export type FinalisationIdentificationAutoSaveFormValues = z.infer<
  typeof finalisationIdentificationAutoSaveSchema
>;
