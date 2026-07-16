import {
  aggregateValues,
  NumericAggregation,
  sumValues,
} from "@/app/utils/math.util";
import { roundStatsNumber } from "@/app/utils/statistiques-format.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import {
  FinanceByYearScopeStat,
  FinanceByYearStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbBudget,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbStructure,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  collectDistinctYears,
  filterByActiveStructureId,
  lookupActiveStructureIds,
} from "../statistiques.utils";

type FinanceScope = keyof Omit<FinanceByYearStat, "year">;

const getStructureIdsByFinanceScope = (
  structures: StatistiqueDbStructure[]
): Record<FinanceScope, number[]> => {
  const scopes: Record<FinanceScope, number[]> = {
    total: [],
    autorisees: [],
    subventionnees: [],
  };

  for (const structure of structures) {
    scopes.total.push(structure.id);
    if (isStructureAutorisee(structure.type)) {
      scopes.autorisees.push(structure.id);
    }
    if (isStructureSubventionnee(structure.type)) {
      scopes.subventionnees.push(structure.id);
    }
  }

  return scopes;
};

const sumBudgetsForYear = (budgetsForYear: StatistiqueDbBudget[]) => {
  let dotationDemandee = 0;
  let dotationAccordee = 0;
  let totalProduits = 0;
  let totalCharges = 0;
  const resultatNetByStructureId = new Map<number, number>();

  for (const budget of budgetsForYear) {
    dotationDemandee += budget.dotationDemandee;
    dotationAccordee += budget.dotationAccordee;
    totalProduits += budget.totalProduits;
    totalCharges += budget.totalCharges;

    resultatNetByStructureId.set(
      budget.structureId,
      budget.totalProduits - budget.totalCharges
    );
  }

  let excedent = 0;
  let deficit = 0;
  for (const resultatNet of resultatNetByStructureId.values()) {
    if (resultatNet > 0) {
      excedent += resultatNet;
    } else if (resultatNet < 0) {
      deficit += Math.abs(resultatNet);
    }
  }

  return {
    dotationDemandee,
    dotationAccordee,
    totalProduits,
    totalCharges,
    resultatNet: totalProduits - totalCharges,
    excedentCumule: excedent,
    deficitCumule: deficit,
  };
};

const sumIndicateursForYear = (
  indicateursForYear: StatistiqueDbIndicateurFinancier[],
  aggregation: NumericAggregation
) => {
  const realiseByStructureId = new Map<
    number,
    StatistiqueDbIndicateurFinancier
  >();
  const previsionnelByStructureId = new Map<
    number,
    StatistiqueDbIndicateurFinancier
  >();

  for (const indicateur of indicateursForYear) {
    if (indicateur.structureId === null) {
      continue;
    }
    if (indicateur.type === "REALISE") {
      realiseByStructureId.set(indicateur.structureId, indicateur);
    } else {
      previsionnelByStructureId.set(indicateur.structureId, indicateur);
    }
  }

  const etpValues: (number | null)[] = [];
  const tauxValues: (number | null)[] = [];
  const coutValues: (number | null)[] = [];

  for (const structureId of new Set([
    ...realiseByStructureId.keys(),
    ...previsionnelByStructureId.keys(),
  ])) {
    const realise = realiseByStructureId.get(structureId);
    const previsionnel = previsionnelByStructureId.get(structureId);
    etpValues.push(realise?.ETP ?? previsionnel?.ETP ?? null);
    tauxValues.push(
      realise?.tauxEncadrement ?? previsionnel?.tauxEncadrement ?? null
    );
    coutValues.push(
      realise?.coutJournalier ?? previsionnel?.coutJournalier ?? null
    );
  }

  return {
    totalETP: roundStatsNumber(sumValues(etpValues) ?? 0) ?? 0,
    tauxEncadrement: roundStatsNumber(aggregateValues(tauxValues, aggregation)),
    coutJournalier: roundStatsNumber(aggregateValues(coutValues, aggregation)),
  };
};

type ScopeByYearResult = {
  stat: FinanceByYearScopeStat;
  hasData: boolean;
};

const computeScopeByYearWithData = (
  structureIdsInScope: number[],
  context: StatistiquesContext,
  aggregation: NumericAggregation,
  years: number[]
): ScopeByYearResult[] => {
  const { activeStructureIdsByPeriod, budgets, indicateurs } = context;
  const structureIdSet = new Set(structureIdsInScope);
  const scopedBudgets = filterByActiveStructureId(budgets, structureIdSet);
  const scopedIndicateurs = filterByActiveStructureId(
    indicateurs,
    structureIdSet
  );

  return years.map((year) => {
    const activeStructureIds = lookupActiveStructureIds(
      activeStructureIdsByPeriod,
      "year",
      String(year)
    );
    const isActive = (structureId: number) =>
      activeStructureIds.has(structureId);

    const budgetsForYear = scopedBudgets.filter(
      (budget) => budget.year === year && isActive(budget.structureId)
    );
    const indicateursForYear = scopedIndicateurs.filter(
      (indicateur) =>
        indicateur.year === year && isActive(indicateur.structureId)
    );

    return {
      stat: {
        ...sumIndicateursForYear(indicateursForYear, aggregation),
        ...sumBudgetsForYear(budgetsForYear),
      },
      hasData: budgetsForYear.length > 0 || indicateursForYear.length > 0,
    };
  });
};

export const computeScopeByYear = (
  structureIdsInScope: number[],
  context: StatistiquesContext,
  aggregation: NumericAggregation,
  years: number[]
): FinanceByYearScopeStat[] =>
  computeScopeByYearWithData(
    structureIdsInScope,
    context,
    aggregation,
    years
  ).map((result) => result.stat);

export const computeFinanceStatistiques = (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): StatistiqueApiRead["finance"] => {
  const years = collectDistinctYears(context.budgets, context.indicateurs);
  const scopeIds = getStructureIdsByFinanceScope(context.allStructures);
  const total = computeScopeByYear(scopeIds.total, context, aggregation, years);
  const autorisees = computeScopeByYear(
    scopeIds.autorisees,
    context,
    aggregation,
    years
  );
  const subventionnees = computeScopeByYear(
    scopeIds.subventionnees,
    context,
    aggregation,
    years
  );

  return {
    byYear: years.map((year, index) => ({
      year,
      total: total[index],
      autorisees: autorisees[index],
      subventionnees: subventionnees[index],
    })),
  };
};

/** Computes a single total field for given years, for the cartographie one-indicator requests. */
export const computeFinanceTotalValuesForYears = (
  context: StatistiquesContext,
  years: number[],
  aggregation: NumericAggregation,
  field: keyof FinanceByYearScopeStat
): (number | null)[] => {
  const structureIdsInScope = context.allStructures.map(
    (structure) => structure.id
  );

  return computeScopeByYearWithData(
    structureIdsInScope,
    context,
    aggregation,
    years
  ).map((result) => (result.hasData ? result.stat[field] : null));
};
