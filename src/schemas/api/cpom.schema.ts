import z from "zod";

import { zId } from "@/app/utils/zodCustomFields";
import { StructureType } from "@/types/structure.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { budgetApiSchema } from "./budget.schema";
import { departementApiSchema } from "./departement.schema";
import { formApiSchema } from "./form.schema";
import { operateurSuggestionApiSchema } from "./operateur.schema";
import { regionApiSchema } from "./region.schema";

export const cpomDepartementApiSchema = z.object({
  id: zId(),
  cpomId: zId(),
  departementId: zId(),
  departement: departementApiSchema.optional(),
});

export const cpomApiSchema = z.object({
  id: zId(),
  name: z.string().nullish(),
  operateur: operateurSuggestionApiSchema.optional(),
  operateurId: z.number().optional(),
  region: regionApiSchema.optional(),
  departements: z.array(cpomDepartementApiSchema).optional(),
  granularity: z
    .enum(["DEPARTEMENTALE", "INTERDEPARTEMENTALE", "REGIONALE"])
    .optional(),
  budgets: z.array(budgetApiSchema).optional(),
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
            operateur: operateurSuggestionApiSchema,
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
  operateur: operateurSuggestionApiSchema,
});

// This schema is never used. It is only for infering CpomApiRead type.
export const cpomApiReadSchema = cpomApiSchema.extend({
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
});

export type CpomDepartementApiType = z.infer<typeof cpomDepartementApiSchema>;
export type CpomStructureApiType = z.infer<typeof cpomStructureApiSchema>;
export type CpomApiWrite = z.infer<typeof cpomApiSchema>;
export type CpomApiRead = z.infer<typeof cpomApiReadSchema>;
