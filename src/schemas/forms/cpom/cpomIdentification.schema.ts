import z from "zod";

import {
  frenchDateToYear,
  nullishFrenchDateToYear,
  zId,
} from "@/app/utils/zodCustomFields";
import { zSafeDecimals } from "@/app/utils/zodSafeDecimals";
import { CpomGranularity } from "@/types/cpom.type";

import { operateurSchema } from "../base/operateur.schema";

const cpomStructureSchema = z.object({
  yearStart: nullishFrenchDateToYear(),
  yearEnd: nullishFrenchDateToYear(),
  structureId: zId(),
});

export const cpomIdentificationSchema = z.object({
  name: z.string().nullish(),
  structures: z.array(cpomStructureSchema),
  yearStart: frenchDateToYear(),
  yearEnd: frenchDateToYear(),
  operateur: operateurSchema,
  granularity: z.enum([
    CpomGranularity.DEPARTEMENTALE,
    CpomGranularity.INTERDEPARTEMENTALE,
    CpomGranularity.REGIONALE,
  ]),
  departements: z.array(zSafeDecimals()),
});

export type CpomStructureFormType = z.infer<typeof cpomStructureSchema>;

export type CpomIdentificationFormValues = z.infer<
  typeof cpomIdentificationSchema
>;
