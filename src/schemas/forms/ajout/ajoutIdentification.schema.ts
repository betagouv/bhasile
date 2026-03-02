import z from "zod";

import { calendrierSchema } from "@/schemas/forms/base/calendrier.schema";
import { identificationSchema } from "@/schemas/forms/base/identification.schema";

import { adresseAdministrativeSchema } from "../base/adresseAdministrative.schema";
import { antennesSchema } from "../base/antenne.schema";
import { contactsSchema } from "../base/contact.schema";
import { dnaStructuresSchema } from "../base/dna.schema";
import { finessesSchema } from "../base/finess.schema";

export const ajoutIdentificationSchema = identificationSchema
  .and(adresseAdministrativeSchema)
  .and(antennesSchema)
  .and(dnaStructuresSchema)
  .and(finessesSchema)
  .and(calendrierSchema)
  .and(contactsSchema);

export type AjoutIdentificationFormValues = z.infer<
  typeof ajoutIdentificationSchema
>;
