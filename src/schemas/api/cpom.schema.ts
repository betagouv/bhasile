import z from "zod";

import { zId, zSafeYear } from "@/app/utils/zodCustomFields";
import { StructureType } from "@/types/structure.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { departementApiSchema } from "./departement.schema";
import { formApiSchema } from "./form.schema";
import { operateurApiSchema } from "./operateur.schema";
import { regionApiSchema } from "./region.schema";

export const cpomMillesimeApiSchema = z.object({
  id: zId(),
  year: zSafeYear(),
  type: z.nativeEnum(StructureType),
  dotationDemandee: z.number().nullish(),
  dotationAccordee: z.number().nullish(),
  totalProduitsProposes: z.number().nullish(),
  totalProduits: z.number().nullish(),
  totalChargesProposees: z.number().nullish(),
  totalCharges: z.number().nullish(),
  repriseEtat: z.number().nullish(),
  affectationReservesFondsDedies: z.number().nullish(),
  reserveInvestissement: z.number().nullish(),
  chargesNonReconductibles: z.number().nullish(),
  reserveCompensationDeficits: z.number().nullish(),
  reserveCompensationBFR: z.number().nullish(),
  reserveCompensationAmortissements: z.number().nullish(),
  reportANouveau: z.number().nullish(),
  autre: z.number().nullish(),
  excedentRecupere: z.number().nullish(),
  excedentDeduit: z.number().nullish(),
  fondsDedies: z.number().nullish(),
  commentaire: z.string().nullish(),
});

export const cpomDepartementApiSchema = z.object({
  id: zId(),
  cpomId: zId(),
  departementId: zId(),
  departement: departementApiSchema.optional(),
});

export const cpomApiSchema = z.object({
  id: zId(),
  name: z.string().nullish(),
  operateur: operateurApiSchema.optional(),
  operateurId: z.number().optional(),
  region: regionApiSchema.optional(),
  departements: z.array(cpomDepartementApiSchema).optional(),
  granularity: z
    .enum(["DEPARTEMENTALE", "INTERDEPARTEMENTALE", "REGIONALE"])
    .optional(),
  cpomMillesimes: z.array(cpomMillesimeApiSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  structures: z
    .array(
      z.object({
        id: z.number().optional(),
        cpomId: z.number().optional(),
        structureId: z.number(),
        dateStart: z.string().datetime().nullish(),
        dateEnd: z.string().datetime().nullish(),
        structure: z
          .object({
            id: z.number().optional(),
            codeBhasile: z.string(),
            type: z.nativeEnum(StructureType),
            communeAdministrative: z.string(),
            operateur: operateurApiSchema,
            forms: z.array(formApiSchema),
          })
          .optional(),
      })
    )
    .optional(),
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
export type CpomDepartementApiType = z.infer<typeof cpomDepartementApiSchema>;
export type CpomStructureApiType = z.infer<typeof cpomStructureApiSchema>;
export type CpomApiType = z.infer<typeof cpomApiSchema>;
