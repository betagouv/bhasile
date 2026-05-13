import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";
import { acteAdministratifApiSchema } from "@/schemas/api/acte-administratif.schema";
import { documentFinancierApiSchema } from "@/schemas/api/document-financier.schema";

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
  actesAdministratifs: z.array(acteAdministratifApiSchema),
  documentsFinanciers: z.array(documentFinancierApiSchema),
});

export type OperateurUpdateFormValues = z.infer<typeof operateurUpdateSchema>;
