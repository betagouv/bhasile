import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiType } from "@/schemas/api/cpom.schema";
import { anyBudgetFormValues } from "@/schemas/forms/base/budget.schema";
import { StructureType } from "@/types/structure.type";

import { getYearRange } from "./date.util";
import {
  getCpomStructureIndexAndBudgetIndexForAYearAndAType,
  getMillesimeIndexForAYear,
} from "./structure.util";

export const getBudgetsDefaultValues = (
  structureBudgets: BudgetApiType[],
  structureCreationYear?: number,
  type?: StructureType
): anyBudgetFormValues => {
  const { years } = getYearRange();
  const yearsToDisplay = structureCreationYear
    ? years.filter((year) => year >= structureCreationYear)
    : years;

  const budgets = Array(yearsToDisplay.length)
    .fill({})
    .map((_, index) => ({
      year: yearsToDisplay[index],
      cpomStructureType: type,
    }))
    .map((emptyBudget) => {
      const budget = structureBudgets.find((budget) => {
        if (type) {
          return (
            budget.year === emptyBudget.year &&
            budget.cpomStructureType === type
          );
        }
        return budget.year === emptyBudget.year;
      });
      if (budget) {
        return {
          ...budget,
          year: budget.year,
          ETP: budget.ETP ?? undefined,
          tauxEncadrement: budget.tauxEncadrement ?? undefined,
          coutJournalier: budget.coutJournalier ?? undefined,
          dotationDemandee: budget.dotationDemandee ?? undefined,
          dotationAccordee: budget.dotationAccordee ?? undefined,
          totalProduitsProposes: budget.totalProduitsProposes ?? undefined,
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
    }) as anyBudgetFormValues;

  return budgets;
};

export const isInputDisabled = (
  year: number,
  type?: StructureType,
  disabledYearsStart?: number,
  enabledYears?: number[],
  cpomStructures?: CpomStructureApiType[]
): boolean => {
  if (cpomStructures) {
    const { cpomStructureIndex, budgetIndex } =
      getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        year,
        type
      );
    if (cpomStructureIndex === -1 || budgetIndex === -1) {
      return true;
    }
  }
  if (disabledYearsStart) {
    return year >= disabledYearsStart;
  }
  if (enabledYears) {
    return !enabledYears.includes(year);
  }
  return false;
};

export const getName = (
  name: string,
  year: number,
  type?: StructureType,
  budgets?: BudgetApiType[],
  cpomStructures?: CpomStructureApiType[]
): string => {
  if (budgets) {
    return `budgets.${getMillesimeIndexForAYear(budgets, year, type)}.${name}`;
  }
  if (cpomStructures) {
    const { cpomStructureIndex, budgetIndex } =
      getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        year,
        type
      );
    return `cpomStructures.${cpomStructureIndex}.cpom.budgets.${budgetIndex}.${name}`;
  }
  if (budgets) {
    return `budgets.${getMillesimeIndexForAYear(budgets, year, type)}.${name}`;
  }
  return "";
};
