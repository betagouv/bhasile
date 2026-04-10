import z from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";

export const indicateurFinancierApiSchema = z.object({
  id: z.number().optional(),
  year: zSafeYear(),
  type: z.enum(IndicateurFinancierType),
  ETP: z.number().nullish(),
  tauxEncadrement: z.number().nullish(),
  coutJournalier: z.number().nullish(),
});

export type IndicateurFinancierApiType = z.infer<
  typeof indicateurFinancierApiSchema
>;
