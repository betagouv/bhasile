import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import {
  aggregateValues,
  NumericAggregation,
  sumValues,
} from "@/app/utils/math.util";
import { DOCUMENTS_FINANCIERS_OPEN_YEAR } from "@/constants";
import {
  FinanceByYearScopeStat,
  FinanceByYearStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbBudgetAgg,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbStructure,
} from "../shared/db.type";

type FinanceScopeIds = {
  total: number[];
  autorisees: number[];
  subventionnees: number[];
};

const emptyByYearScopeStat = (): FinanceByYearScopeStat => ({
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
});

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

const getFinanceYears = (
  budgets: StatistiqueDbBudgetAgg[],
  indicateurs: StatistiqueDbIndicateurFinancier[],
  minYear: number
): number[] =>
  [
    ...new Set([
      ...budgets.map((budget) => budget.year),
      ...indicateurs.map((indicateur) => indicateur.year),
    ]),
  ]
    .filter((year) => year >= minYear)
    .sort((yearA, yearB) => yearA - yearB);

const computeScopeYearStats = (
  structureIds: number[],
  budgets: StatistiqueDbBudgetAgg[],
  indicateurs: StatistiqueDbIndicateurFinancier[],
  minYear: number,
  aggregation: NumericAggregation
): Array<FinanceByYearScopeStat & { year: number }> => {
  const structureIdSet = new Set(structureIds);
  const scopedIndicateurs = indicateurs.filter(
    (indicateur) =>
      indicateur.structureId !== null &&
      structureIdSet.has(indicateur.structureId)
  );

  let excedentCumule = 0;
  let deficitCumule = 0;

  return getFinanceYears(budgets, scopedIndicateurs, minYear).map((year) => {
    const budget = budgets.find((budgetRow) => budgetRow.year === year);
    const indicateursForYear = scopedIndicateurs.filter(
      (indicateur) => indicateur.year === year
    );
    const totalProduits = budget?.totalProduits ?? 0;
    const totalCharges = budget?.totalCharges ?? 0;
    const resultatNet = totalProduits - totalCharges;
    const excedent = resultatNet > 0 ? resultatNet : 0;
    const deficit = resultatNet < 0 ? Math.abs(resultatNet) : 0;

    excedentCumule += excedent;
    deficitCumule += deficit;

    return {
      year,
      dotationDemandee: budget?.dotationDemandee ?? 0,
      dotationAccordee: budget?.dotationAccordee ?? 0,
      totalETP:
        sumValues(indicateursForYear.map((indicateur) => indicateur.ETP)) ?? 0,
      tauxEncadrement: aggregateValues(
        indicateursForYear.map((indicateur) => indicateur.tauxEncadrement),
        aggregation
      ),
      coutJournalier: aggregateValues(
        indicateursForYear.map((indicateur) => indicateur.coutJournalier),
        aggregation
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
  const scopeStat =
    stats.find((yearStat) => yearStat.year === year) ?? {
      year,
      ...emptyByYearScopeStat(),
    };

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
};

const buildByYearStats = (
  scopeIds: FinanceScopeIds,
  budgets: {
    total: StatistiqueDbBudgetAgg[];
    autorisees: StatistiqueDbBudgetAgg[];
    subventionnees: StatistiqueDbBudgetAgg[];
  },
  indicateurs: StatistiqueDbIndicateurFinancier[],
  aggregation: NumericAggregation
): FinanceByYearStat[] => {
  const totalStats = computeScopeYearStats(
    scopeIds.total,
    budgets.total,
    indicateurs,
    DOCUMENTS_FINANCIERS_OPEN_YEAR,
    aggregation
  );
  const autoriseesStats = computeScopeYearStats(
    scopeIds.autorisees,
    budgets.autorisees,
    indicateurs,
    DOCUMENTS_FINANCIERS_OPEN_YEAR,
    aggregation
  );
  const subventionneesStats = computeScopeYearStats(
    scopeIds.subventionnees,
    budgets.subventionnees,
    indicateurs,
    DOCUMENTS_FINANCIERS_OPEN_YEAR,
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
  budgets: {
    total: StatistiqueDbBudgetAgg[];
    autorisees: StatistiqueDbBudgetAgg[];
    subventionnees: StatistiqueDbBudgetAgg[];
  },
  indicateurs: StatistiqueDbIndicateurFinancier[],
  aggregation: NumericAggregation
): StatistiqueApiRead["finance"] => ({
  aggregation,
  byYear: buildByYearStats(scopeIds, budgets, indicateurs, aggregation),
});
