import z from "zod";

import { adresseAdministrativeSchema } from "@/schemas/forms/base/adresseAdministrative.schema";
import { identificationSchemaWithContacts } from "@/schemas/forms/base/identification.schema";

import { antennesSchema } from "../base/antenne.schema";
import { dnaStructuresSchema } from "../base/dna.schema";
import { finessesSchema } from "../base/finess.schema";

export const modificationDescriptionSchema = identificationSchemaWithContacts
  .and(dnaStructuresSchema)
  .and(finessesSchema)
  .and(adresseAdministrativeSchema)
  .and(antennesSchema);

export type ModificationDescriptionFormValues = z.infer<
  typeof modificationDescriptionSchema
>;
