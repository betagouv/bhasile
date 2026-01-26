import z from "zod";

import {
  frenchDateToYear,
  optionalFrenchDateToYear,
  zId,
} from "@/app/utils/zodCustomFields";
import { CpomGranularity } from "@/types/cpom.type";

import { operateurSchema } from "../base/operateur.schema";

const cpomStructureSchema = z.object({
  yearStart: optionalFrenchDateToYear(),
  yearEnd: optionalFrenchDateToYear(),
  structureId: zId(),
});

export const cpomAjoutIdentificationSchema = z.object({
  name: z.string().optional(),
  structures: z.array(cpomStructureSchema),
  yearStart: frenchDateToYear(),
  yearEnd: frenchDateToYear(),
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
