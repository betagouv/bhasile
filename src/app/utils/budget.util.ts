import { BudgetApiType } from "@/schemas/api/budget.schema";
import { anyFinanceFormValues } from "@/schemas/forms/base/budget.schema";

import { getYearRange } from "./date.util";

export const getBudgetsDefaultValues = (
  structureBudgets: BudgetApiType[]
): anyFinanceFormValues => {
  const { years } = getYearRange();

  const budgets = Array(years.length)
    .fill({})
    .map((_, index) => ({
      year: years[index],
    }))
    .map((emptyBudget) => {
      const budget = structureBudgets.find(
        (budget) => budget.year === emptyBudget.year
      );
      if (budget) {
        return {
          ...budget,
          year: budget.year,
          ETP: budget.ETP ?? undefined,
          tauxEncadrement: budget.tauxEncadrement ?? undefined,
          coutJournalier: budget.coutJournalier ?? undefined,
          dotationDemandee: budget.dotationDemandee ?? undefined,
          dotationAccordee: budget.dotationAccordee ?? undefined,
          totalProduits: budget.totalProduits ?? undefined,
          totalCharges: budget.totalCharges ?? undefined,
          totalChargesProposees: budget.totalChargesProposees ?? undefined,
          cumulResultatsNetsCPOM: budget.cumulResultatsNetsCPOM ?? undefined,
          repriseEtat: budget.repriseEtat ?? undefined,
          excedentRecupere: budget.excedentRecupere ?? undefined,
          excedentDeduit: budget.excedentDeduit ?? undefined,
          reserveInvestissement: budget.reserveInvestissement ?? undefined,
          chargesNonReconductibles:
            budget.chargesNonReconductibles ?? undefined,
          reserveCompensationDeficits:
            budget.reserveCompensationDeficits ?? undefined,
          reserveCompensationBFR: budget.reserveCompensationBFR ?? undefined,
          reserveCompensationAmortissements:
            budget.reserveCompensationAmortissements ?? undefined,
          fondsDedies: budget.fondsDedies ?? undefined,
          affectationReservesFondsDedies:
            budget.affectationReservesFondsDedies ?? undefined,
          reportANouveau: budget.reportANouveau ?? undefined,
          autre: budget.autre ?? undefined,
          commentaire: budget.commentaire ?? undefined,
        };
      }
      return emptyBudget;
    }) as anyFinanceFormValues;

  return budgets;
};
