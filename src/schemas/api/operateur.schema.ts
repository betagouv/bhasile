import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

import {
  acteAdministratifApiSchema,
  ActeAdministratifApiType,
} from "./acteAdministratif.schema";
import { contactApiSchema, ContactApiType } from "./contact.schema";
import { fileApiSchema, FileUploadApiType } from "./file.schema";

export const operateurSuggestionApiSchema = z.object({
  id: z.number().optional(),
  structureDnaCode: z.string().optional(),
  name: z.string().min(1, "Le nom de l'opérateur est requis"),
});

export type OperateurSuggestionApiRead = z.infer<
  typeof operateurSuggestionApiSchema
>;

export type OperateurApiRead = {
  id: number;
  name: string;
  directionGenerale?: string | null;
  siret?: string | null;
  siegeSocial?: string | null;
  actesAdministratifs: ActeAdministratifApiType[];
  contacts: ContactApiType[];
  logo: FileUploadApiType;
};

export const operateurWriteApiSchema = z.object({
  id: zId(),
  name: z.string().optional(),
  directionGenerale: z.string().nullish(),
  siret: z.string().nullish(),
  siegeSocial: z.string().nullish(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  contacts: z.array(contactApiSchema).optional(),
  logo: fileApiSchema.optional(),
});

export type OperateurApiWrite = z.infer<typeof operateurWriteApiSchema>;
