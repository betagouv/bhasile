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
  StatistiqueDbIndicateurFinancierMetriques,
  StatistiqueDbStructure,
  StatistiquesActivityContext,
} from "../statistiques.db.type";
import { getActiveStructureIds } from "../statistiques.utils";

type FinanceScopeIds = {
  total: number[];
  autorisees: number[];
  subventionnees: number[];
};

const emptyByYearScopeStat = {
  dotationDemandee: 0,
  dotationAccordee: 0,
  totalETP: 0,
  tauxEncadrement: null,
  coutJournalier: null,
  totalProduits: 0,
  totalCharges: 0,
  resultatNet: 0,
  excedentCumule: 0,
  deficitCumule: 0,
  soldeCumule: 0,
};

export const getStructureIdsByFinanceScope = (
  structures: StatistiqueDbStructure[]
): FinanceScopeIds => {
  const total: number[] = [];
  const autorisees: number[] = [];
  const subventionnees: number[] = [];

  for (const structure of structures) {
    total.push(structure.id);
    if (isStructureAutorisee(structure.type)) {
      autorisees.push(structure.id);
    }
    if (isStructureSubventionnee(structure.type)) {
      subventionnees.push(structure.id);
    }
  }

  return { total, autorisees, subventionnees };
};

const aggregateBudgetsByYear = (
  budgets: StatistiqueDbBudget[]
): Map<number, Omit<StatistiqueDbBudget, "id" | "structureId">> => {
  const budgetsByYear = new Map<
    number,
    Omit<StatistiqueDbBudget, "id" | "structureId">
  >();

  for (const budget of budgets) {
    const current = budgetsByYear.get(budget.year) ?? {
      year: budget.year,
      dotationDemandee: 0,
      dotationAccordee: 0,
      totalProduits: 0,
      totalCharges: 0,
    };

    budgetsByYear.set(budget.year, {
      year: budget.year,
      dotationDemandee: current.dotationDemandee + budget.dotationDemandee,
      dotationAccordee: current.dotationAccordee + budget.dotationAccordee,
      totalProduits: current.totalProduits + budget.totalProduits,
      totalCharges: current.totalCharges + budget.totalCharges,
    });
  }

  return budgetsByYear;
};

const getYearExcedentAndDeficit = (
  budgets: StatistiqueDbBudget[],
  year: number
): { excedent: number; deficit: number } => {
  let excedent = 0;
  let deficit = 0;

  for (const budget of budgets) {
    if (budget.year !== year) {
      continue;
    }

    const resultatNet = budget.totalProduits - budget.totalCharges;
    if (resultatNet > 0) {
      excedent += resultatNet;
    } else if (resultatNet < 0) {
      deficit += Math.abs(resultatNet);
    }
  }

  return { excedent, deficit };
};

const getFinanceYears = (
  budgets: StatistiqueDbBudget[],
  indicateurs: StatistiqueDbIndicateurFinancier[]
): number[] =>
  [
    ...new Set([
      ...budgets.map((budget) => budget.year),
      ...indicateurs.map((indicateur) => indicateur.year),
    ]),
  ].sort((yearA, yearB) => yearA - yearB);

const resolveIndicateurFinancier = (
  realise: StatistiqueDbIndicateurFinancier | undefined,
  previsionnel: StatistiqueDbIndicateurFinancier | undefined
): StatistiqueDbIndicateurFinancierMetriques => ({
  ETP: realise?.ETP ?? previsionnel?.ETP ?? null,
  tauxEncadrement:
    realise?.tauxEncadrement ?? previsionnel?.tauxEncadrement ?? null,
  coutJournalier:
    realise?.coutJournalier ?? previsionnel?.coutJournalier ?? null,
});

const getResolvedIndicateursForYear = (
  structureIds: number[],
  indicateurs: StatistiqueDbIndicateurFinancier[],
  year: number
): StatistiqueDbIndicateurFinancierMetriques[] => {
  const byStructureAndType = new Map<
    string,
    StatistiqueDbIndicateurFinancier
  >();

  for (const indicateur of indicateurs) {
    if (indicateur.structureId === null || indicateur.year !== year) {
      continue;
    }
    byStructureAndType.set(
      `${indicateur.structureId}-${indicateur.type}`,
      indicateur
    );
  }

  return structureIds.map((structureId) =>
    resolveIndicateurFinancier(
      byStructureAndType.get(`${structureId}-REALISE`),
      byStructureAndType.get(`${structureId}-PREVISIONNEL`)
    )
  );
};

const computeScopeYearStats = (
  structureIdsInScope: number[],
  activityContext: StatistiquesActivityContext,
  budgets: StatistiqueDbBudget[],
  indicateurs: StatistiqueDbIndicateurFinancier[],
  aggregation: NumericAggregation
): Array<FinanceByYearScopeStat & { year: number }> => {
  const structureIdSet = new Set(structureIdsInScope);
  const scopedIndicateurs = indicateurs.filter(
    (indicateur) =>
      indicateur.structureId !== null &&
      structureIdSet.has(indicateur.structureId)
  );
  const scopedBudgets = budgets.filter((budget) =>
    structureIdSet.has(budget.structureId)
  );

  let excedentCumule = 0;
  let deficitCumule = 0;

  return getFinanceYears(scopedBudgets, scopedIndicateurs).map((year) => {
    const activeStructureIds = getActiveStructureIds(
      activityContext,
      "year",
      String(year)
    );
    const structureIds = structureIdsInScope.filter((structureId) =>
      activeStructureIds.has(structureId)
    );
    const budgetsForYear = scopedBudgets.filter(
      (budget) =>
        budget.year === year && activeStructureIds.has(budget.structureId)
    );
    const budget = aggregateBudgetsByYear(budgetsForYear).get(year);
    const indicateursForYear = getResolvedIndicateursForYear(
      structureIds,
      scopedIndicateurs,
      year
    );
    const totalProduits = budget?.totalProduits ?? 0;
    const totalCharges = budget?.totalCharges ?? 0;
    const resultatNet = totalProduits - totalCharges;
    const { excedent, deficit } = getYearExcedentAndDeficit(budgetsForYear, year);

    excedentCumule += excedent;
    deficitCumule += deficit;

    return {
      year,
      dotationDemandee: budget?.dotationDemandee ?? 0,
      dotationAccordee: budget?.dotationAccordee ?? 0,
      totalETP:
        roundStatsNumber(
          sumValues(indicateursForYear.map((indicateur) => indicateur.ETP)) ?? 0
        ) ?? 0,
      tauxEncadrement: roundStatsNumber(
        aggregateValues(
          indicateursForYear.map((indicateur) => indicateur.tauxEncadrement),
          aggregation
        )
      ),
      coutJournalier: roundStatsNumber(
        aggregateValues(
          indicateursForYear.map((indicateur) => indicateur.coutJournalier),
          aggregation
        )
      ),
      totalProduits,
      totalCharges,
      resultatNet,
      excedentCumule,
      deficitCumule,
      soldeCumule: excedentCumule - deficitCumule,
    };
  });
};

const scopeStatForYear = (
  stats: Array<FinanceByYearScopeStat & { year: number }>,
  year: number
): FinanceByYearScopeStat => {
  const scopeStat = stats.find((yearStat) => yearStat.year === year);
  if (scopeStat) {
    return {
      dotationDemandee: scopeStat.dotationDemandee,
      dotationAccordee: scopeStat.dotationAccordee,
      totalETP: scopeStat.totalETP,
      tauxEncadrement: scopeStat.tauxEncadrement,
      coutJournalier: scopeStat.coutJournalier,
      totalProduits: scopeStat.totalProduits,
      totalCharges: scopeStat.totalCharges,
      resultatNet: scopeStat.resultatNet,
      excedentCumule: scopeStat.excedentCumule,
      deficitCumule: scopeStat.deficitCumule,
      soldeCumule: scopeStat.soldeCumule,
    };
  }

  const previousStat = [...stats]
    .filter((yearStat) => yearStat.year < year)
    .at(-1);

  if (previousStat) {
    return {
      ...emptyByYearScopeStat,
      excedentCumule: previousStat.excedentCumule,
      deficitCumule: previousStat.deficitCumule,
      soldeCumule: previousStat.soldeCumule,
    };
  }

  return emptyByYearScopeStat;
};

const buildByYearFinanceStats = (
  scopeIds: FinanceScopeIds,
  activityContext: StatistiquesActivityContext,
  budgets: {
    total: StatistiqueDbBudget[];
    autorisees: StatistiqueDbBudget[];
    subventionnees: StatistiqueDbBudget[];
  },
  indicateurs: StatistiqueDbIndicateurFinancier[],
  aggregation: NumericAggregation
): FinanceByYearStat[] => {
  const totalStats = computeScopeYearStats(
    scopeIds.total,
    activityContext,
    budgets.total,
    indicateurs,
    aggregation
  );
  const autoriseesStats = computeScopeYearStats(
    scopeIds.autorisees,
    activityContext,
    budgets.autorisees,
    indicateurs,
    aggregation
  );
  const subventionneesStats = computeScopeYearStats(
    scopeIds.subventionnees,
    activityContext,
    budgets.subventionnees,
    indicateurs,
    aggregation
  );

  const years = [
    ...new Set([
      ...totalStats.map((yearStat) => yearStat.year),
      ...autoriseesStats.map((yearStat) => yearStat.year),
      ...subventionneesStats.map((yearStat) => yearStat.year),
    ]),
  ].sort((yearA, yearB) => yearA - yearB);

  return years.map((year) => ({
    year,
    total: scopeStatForYear(totalStats, year),
    autorisees: scopeStatForYear(autoriseesStats, year),
    subventionnees: scopeStatForYear(subventionneesStats, year),
  }));
};

export const computeFinanceStatistiques = (
  scopeIds: FinanceScopeIds,
  activityContext: StatistiquesActivityContext,
  budgets: {
    total: StatistiqueDbBudget[];
    autorisees: StatistiqueDbBudget[];
    subventionnees: StatistiqueDbBudget[];
  },
  indicateurs: StatistiqueDbIndicateurFinancier[],
  aggregation: NumericAggregation
): StatistiqueApiRead["finance"] => ({
  byYear: buildByYearFinanceStats(
    scopeIds,
    activityContext,
    budgets,
    indicateurs,
    aggregation
  ),
});
