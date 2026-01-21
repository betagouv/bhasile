import z from "zod";

import { zSafeYear } from "@/app/utils/zodCustomFields";

export const budgetApiSchema = z.object({
  id: z.number().optional(),
  year: zSafeYear(),
  ETP: z.number().nullish(),
  tauxEncadrement: z.number().nullish(),
  coutJournalier: z.number().nullish(),
  dotationDemandee: z.number().nullish(),
  dotationAccordee: z.number().nullish(),
  totalProduitsProposes: z.number().nullish(),
  totalProduits: z.number().nullish(),
  totalCharges: z.number().nullish(),
  totalChargesProposees: z.number().nullish(),
  cumulResultatsNetsCPOM: z.number().nullish(),
  repriseEtat: z.number().nullish(),
  excedentRecupere: z.number().nullish(),
  excedentDeduit: z.number().nullish(),
  reserveInvestissement: z.number().nullish(),
  chargesNonReconductibles: z.number().nullish(),
  reserveCompensationDeficits: z.number().nullish(),
  reserveCompensationBFR: z.number().nullish(),
  reserveCompensationAmortissements: z.number().nullish(),
  fondsDedies: z.number().nullish(),
  affectationReservesFondsDedies: z.number().nullish(),
  reportANouveau: z.number().nullish(),
  autre: z.number().nullish(),
  commentaire: z.string().nullish(),
});

export type BudgetApiType = z.infer<typeof budgetApiSchema>;
