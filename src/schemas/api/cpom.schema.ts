import z from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";

import { operateurApiSchema } from "./operateur.schema";

export const cpomMillesimeApiSchema = z.object({
  id: z.number().optional(),
  year: zSafeYear(),
  dotationDemandee: z.number().nullish(),
  dotationAccordee: z.number().nullish(),
  cumulResultatNet: z.number().nullish(),
  repriseEtat: z.number().nullish(),
  affectationReservesFondsDedies: z.number().nullish(),
  reserveInvestissement: z.number().nullish(),
  chargesNonReconductibles: z.number().nullish(),
  reserveCompensationDeficits: z.number().nullish(),
  reserveCompensationBFR: z.number().nullish(),
  reserveCompensationAmortissements: z.number().nullish(),
  fondsDedies: z.number().nullish(),
  reportANouveau: z.number().nullish(),
  autre: z.number().nullish(),
  commentaire: z.string().nullish(),
});

export const cpomStructureApiSchema = z.object({
  id: z.number().optional(),
  cpomId: z.number().optional(),
  structureId: z.number(),
  yearStart: zSafeYear(),
  yearEnd: zSafeYear(),
});

export const cpomApiSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullish(),
  yearStart: zSafeYear(),
  yearEnd: zSafeYear(),
  structures: z.array(cpomStructureApiSchema),
  cpomMillesimes: z.array(cpomMillesimeApiSchema).optional(),
  operateur: operateurApiSchema,
});

export type CpomMillesimeApiType = z.infer<typeof cpomMillesimeApiSchema>;
export type CpomApiType = z.infer<typeof cpomApiSchema>;
export type CpomStructureApiType = z.infer<typeof cpomStructureApiSchema>;
