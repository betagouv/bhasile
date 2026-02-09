import z from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";
import { StructureType } from "@/types/structure.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { formApiSchema } from "./form.schema";
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

const cpomApiSchema = z.object({
  id: z.number().optional(),
  name: z.string().nullish(),
  operateur: operateurApiSchema.optional(),
  operateurId: z.number().optional(),
  region: z.string().optional(),
  departements: z.array(z.string()).optional(),
  granularity: z.enum(["DEPARTEMENTALE", "INTERDEPARTEMENTALE", "REGIONALE"]),
  cpomMillesimes: z.array(cpomMillesimeApiSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  structures: z.array(
    z.object({
      id: z.number().optional(),
      cpomId: z.number().optional(),
      structureId: z.number(),
      dateStart: z.string().datetime().nullish(),
      dateEnd: z.string().datetime().nullish(),
      structure: z.object({
        id: z.number().optional(),
        dnaCode: z.string(),
        type: z.nativeEnum(StructureType),
        communeAdministrative: z.string(),
        operateur: operateurApiSchema,
        forms: z.array(formApiSchema),
      }),
    })
  ),
});

export const cpomStructureApiSchema = z.object({
  id: z.number().optional(),
  cpomId: z.number().optional(),
  cpom: cpomApiSchema.optional(),
  structureId: z.number(),
  dateStart: z.string().datetime().nullish(),
  dateEnd: z.string().datetime().nullish(),
});

export const cpomApiAjoutSchema = cpomApiSchema.extend({
  operateur: operateurApiSchema,
});

export type CpomMillesimeApiType = z.infer<typeof cpomMillesimeApiSchema>;
export type CpomApiType = z.infer<typeof cpomApiSchema>;

export type CpomStructureApiType = z.infer<typeof cpomStructureApiSchema>;
