import { BudgetApiType } from "@/schemas/api/budget.schema";

export const AFFECTATION_DETAIL_FIELDS = [
  "reserveInvestissement",
  "chargesNonReconductibles",
  "reserveCompensationDeficits",
  "reserveCompensationBFR",
  "reserveCompensationAmortissements",
  "reportANouveau",
  "autre",
] as const satisfies readonly (keyof BudgetApiType)[];
