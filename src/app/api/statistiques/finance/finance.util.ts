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
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbBudget,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbIndicateurFinancierMetriques,
  StatistiqueDbStructure,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  collectDistinctYears,
  lookupActiveStructureIds,
} from "../statistiques.utils";

type FinanceScope = "total" | "autorisees" | "subventionnees";

const FINANCE_SCOPES: FinanceScope[] = [
  "total",
  "autorisees",
  "subventionnees",
];

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
  context: StatistiquesContext,
  aggregation: NumericAggregation
): Array<FinanceByYearScopeStat & { year: number }> => {
  const { activeStructureIdsByPeriod, budgets, indicateurs } = context;
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

  return collectDistinctYears(scopedBudgets, scopedIndicateurs).map((year) => {
    const activeStructureIds = lookupActiveStructureIds(
      activeStructureIdsByPeriod,
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
    const { year: _year, ...stat } = scopeStat;
    return stat;
  }

  const previousStat = [...stats]
    .filter((yearStat) => yearStat.year < year)
    .at(-1);

  if (previousStat) {
    return {
      ...emptyByYearScopeStat(),
      excedentCumule: previousStat.excedentCumule,
      deficitCumule: previousStat.deficitCumule,
      soldeCumule: previousStat.soldeCumule,
    };
  }

  return emptyByYearScopeStat();
};

export const computeFinanceStatistiques = (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): StatistiqueApiRead["finance"] => {
  const scopeIds = getStructureIdsByFinanceScope(context.allStructures);
  const statsByScope = Object.fromEntries(
    FINANCE_SCOPES.map((scope) => [
      scope,
      computeScopeYearStats(scopeIds[scope], context, aggregation),
    ])
  ) as Record<FinanceScope, Array<FinanceByYearScopeStat & { year: number }>>;

  const years = collectDistinctYears(...FINANCE_SCOPES.map((s) => statsByScope[s]));

  return {
    byYear: years.map((year) => ({
      year,
      total: scopeStatForYear(statsByScope.total, year),
      autorisees: scopeStatForYear(statsByScope.autorisees, year),
      subventionnees: scopeStatForYear(statsByScope.subventionnees, year),
    })),
  };
};
