import z from "zod";

import { calendrierSchema } from "@/schemas/forms/base/calendrier.schema";
import { identificationSchema } from "@/schemas/forms/base/identification.schema";

import { adresseAdministrativeSchema } from "../base/adresseAdministrative.schema";
import { antennesSchema } from "../base/antenne.schema";
import { contactSchema } from "../base/contact.schema";
import { dnaStructuresSchema } from "../base/dna.schema";
import { finessesSchema } from "../base/finess.schema";

export const ajoutIdentificationSchema = identificationSchema
  .and(adresseAdministrativeSchema)
  .and(antennesSchema)
  .and(dnaStructuresSchema)
  .and(finessesSchema)
  .and(calendrierSchema)
  .and(
    z.object({
      contactPrincipal: contactSchema,
      contactSecondaire: contactSchema.optional(),
    })
  );

export type AjoutIdentificationFormValues = z.infer<
  typeof ajoutIdentificationSchema
>;
