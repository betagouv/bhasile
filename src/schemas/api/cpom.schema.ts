import z from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";
import { CpomGranularity } from "@/types/cpom.type";

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

const cpomApiBareSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullish(),
  dateStart: z.string().datetime(),
  dateEnd: z.string().datetime(),
  operateur: operateurApiSchema.optional(),
  operateurId: z.number().optional(),
  region: z.string().nullish(),
  departements: z.array(z.string()).optional(),
  granularity: z.enum([
    CpomGranularity.DEPARTEMENTALE,
    CpomGranularity.INTERDEPARTEMENTALE,
    CpomGranularity.REGIONALE,
  ]),
  cpomMillesimes: z.array(cpomMillesimeApiSchema).optional(),
});

export const cpomStructureApiSchema = z.object({
  id: z.number().optional(),
  cpomId: z.number().optional(),
  cpom: cpomApiBareSchema.optional(),
  structureId: z.number(),
  dateStart: z.string().datetime().nullish(),
  dateEnd: z.string().datetime().nullish(),
});

export const cpomApiSchema = cpomApiBareSchema.extend({
  structures: z.array(cpomStructureApiSchema),
});

export const cpomApiAjoutSchema = cpomApiSchema.extend({
  operateur: operateurApiSchema,
});

export type CpomMillesimeApiType = z.infer<typeof cpomMillesimeApiSchema>;
export type CpomApiType = z.infer<typeof cpomApiSchema>;
export type CpomStructureApiType = z.infer<typeof cpomStructureApiSchema>;
