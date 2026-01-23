import z from "zod";

import { zId, zSafeYear } from "@/app/utils/zodCustomFields";
import { CpomGranularity } from "@/types/cpom.type";

import { operateurSchema } from "../base/operateur.schema";

const cpomStructureSchema = z.object({
  yearStart: zSafeYear(),
  yearEnd: zSafeYear(),
  structureId: zId(),
});

export const cpomAjoutIdentificationSchema = z.object({
  name: z.string().optional(),
  structures: z.array(cpomStructureSchema),
  yearStart: zSafeYear(),
  yearEnd: zSafeYear(),
  operateur: operateurSchema,
  granularity: z
    .enum([
      CpomGranularity.DEPARTEMENTALE,
      CpomGranularity.INTERDEPARTEMENTALE,
      CpomGranularity.REGIONALE,
    ])
    .optional(),
  departements: z.array(z.number()),
});

export type CpomStructureFormType = z.infer<typeof cpomStructureSchema>;
