import { BudgetApiType } from "@/schemas/api/budget.schema";
import { CpomStructureApiWrite } from "@/schemas/api/cpom.schema";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";
import { anyBudgetFormValues } from "@/schemas/forms/base/budget.schema";
import { IndicateurFinancierType } from "@/types/indicateur-financier.type";
import { StructureType } from "@/types/structure.type";

import { isNullOrUndefined } from "./common.util";
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
  type?: StructureType | IndicateurFinancierType,
  disabledYearsStart?: number,
  enabledYears?: number[],
  cpomStructures?: CpomStructureApiWrite[]
): boolean => {
  if (cpomStructures) {
    const { cpomStructureIndex, budgetIndex } =
      getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        year,
        type as StructureType
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
  type?: StructureType | IndicateurFinancierType,
  budgets?: BudgetApiType[],
  cpomStructures?: CpomStructureApiWrite[],
  indicateursFinanciers?: IndicateurFinancierApiType[]
): string => {
  if (budgets) {
    return `budgets.${getMillesimeIndexForAYear(budgets, year, type)}.${name}`;
  }
  if (cpomStructures) {
    const { cpomStructureIndex, budgetIndex } =
      getCpomStructureIndexAndBudgetIndexForAYearAndAType(
        cpomStructures,
        year,
        type as StructureType
      );
    return `cpomStructures.${cpomStructureIndex}.cpom.budgets.${budgetIndex}.${name}`;
  }
  if (indicateursFinanciers) {
    return `indicateursFinanciers.${getMillesimeIndexForAYear(indicateursFinanciers, year, type)}.${name}`;
  }
  return "";
};

export const computeResultatNet = (
  totalProduits: number | null | undefined,
  totalCharges: number | null | undefined
): number | undefined => {
  if (isNullOrUndefined(totalCharges) || isNullOrUndefined(totalProduits)) {
    return undefined;
  }
  return Number(totalProduits) - Number(totalCharges);
};
