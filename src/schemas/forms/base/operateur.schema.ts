import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";
import { acteAdministratifApiSchema } from "@/schemas/api/acteAdministratif.schema";
import { contactApiSchema } from "@/schemas/api/contact.schema";

export const operateurSchema = z.object({
  id: zId(),
  name: z.string(),
});

export const operateurUpdateSchema = z.object({
  id: zId(),
  name: z.string().optional(),
  directionGenerale: z.string().nullish(),
  siret: z.string().nullish(),
  siegeSocial: z.string().nullish(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  contacts: z.array(contactApiSchema),
});

export type OperateurUpdateFormValues = z.infer<typeof operateurUpdateSchema>;
