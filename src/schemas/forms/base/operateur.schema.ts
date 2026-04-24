import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";

import { documentOperateurSchema } from "./documentOperateur.schema";

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
  vulnerabilites: z.array(z.string()).nullish(),
  documents: z.array(documentOperateurSchema),
});

export type OperateurUpdateFormValues = z.infer<typeof operateurUpdateSchema>;
