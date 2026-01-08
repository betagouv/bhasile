import { z } from "zod";

import { zSafeDecimalsNullish, zSafeYear } from "@/app/utils/zodCustomFields";
import { zSafeDecimals } from "@/app/utils/zodSafeDecimals";

import { budgetBaseSchema } from "./budget.base.schema";
import { avecCpomSchema } from "./budget.cpom.schema";

export const subventionneeFirstYearsSchema = z.object({
  id: z.preprocess(
    (val) => (val === "" ? undefined : val),
    z.number().optional()
  ),
  year: zSafeYear(),
  ETP: zSafeDecimals(),
  tauxEncadrement: zSafeDecimals(),
  coutJournalier: zSafeDecimals(),
});

export const subventionneeSansCpomSchema = budgetBaseSchema.extend({
  cumulResultatsNetsCPOM: zSafeDecimalsNullish(),
  affectationReservesFondsDedies: zSafeDecimalsNullish(),
  chargesNonReconductibles: zSafeDecimalsNullish(),
  reserveCompensationAmortissements: zSafeDecimalsNullish(),
  reserveCompensationBFR: zSafeDecimalsNullish(),
  reserveCompensationDeficits: zSafeDecimalsNullish(),
  reserveInvestissement: zSafeDecimalsNullish(),
  totalChargesProposees: zSafeDecimalsNullish(),
});
