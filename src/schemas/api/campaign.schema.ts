import { z } from "zod";

import { StepStatus } from "@/types/form.type";

import { acteAdministratifApiSchema } from "./acteAdministratif.schema";
import { budgetApiSchema } from "./budget.schema";
import { documentFinancierApiSchema } from "./documentFinancier.schema";
import { indicateurFinancierApiSchema } from "./indicateurFinancier.schema";
import { structureTypologieApiSchema } from "./structure-typologie.schema";

export const campaignApiWriteSchema = z.object({
  structureId: z.number(),
  year: z.number(),
  structureTypologies: z.array(structureTypologieApiSchema).optional(),
  budgets: z.array(budgetApiSchema).optional(),
  indicateursFinanciers: z.array(indicateurFinancierApiSchema).optional(),
  documentsFinanciers: z.array(documentFinancierApiSchema).optional(),
  actesAdministratifs: z.array(acteAdministratifApiSchema).optional(),
  step: z
    .object({ slug: z.string(), status: z.nativeEnum(StepStatus) })
    .optional(),
  validate: z.boolean().optional(),
});

export type CampaignApiWrite = z.infer<typeof campaignApiWriteSchema>;
