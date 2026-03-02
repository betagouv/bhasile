import z from "zod";

import { isStructureAutorisee } from "@/app/utils/structure.util";
import { frenchDateToISO } from "@/app/utils/zodCustomFields";
import { contactSchema } from "@/schemas/forms/base/contact.schema";
import { PublicType } from "@/types/structure.type";

import { operateurSchema } from "./operateur.schema";
import { structureBaseSchema } from "./structure.base.schema";

const baseIdentificationSchema = structureBaseSchema.extend({
  operateur: operateurSchema,
  creationDate: frenchDateToISO(),
  public: z.nativeEnum(PublicType),
  filiale: z.string().optional(),
  lgbt: z.boolean(),
  fvvTeh: z.boolean(),
});

export const identificationSchema = structureBaseSchema.and(
  baseIdentificationSchema
);

export const identificationSchemaWithContacts = identificationSchema.and(
  z.object({
    contacts: z.array(z.union([contactSchema, contactSchema.optional()])),
  })
);

export const identificationSchemaWithContactsAutoSaveSchema =
  structureBaseSchema
    .partial()
    .and(baseIdentificationSchema.partial())
    .and(
      z
        .object({
          contacts: z.array(z.union([contactSchema, contactSchema.optional()])),
        })
        .partial()
    );

export type IdentificationWithContactsFormValues = z.infer<
  typeof identificationSchemaWithContacts
>;
