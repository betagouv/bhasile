import {
  aggregateValues,
  NumericAggregation,
  sumValues,
} from "@/app/utils/math.util";
import { roundStatsNumber, roundStatsRate } from "@/app/utils/statistiques-format.util";
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
  StatistiqueDbStructure,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  collectDistinctYears,
  lookupActiveStructureIds,
} from "../statistiques.utils";

type FinanceScope = "total" | "autorisees" | "subventionnees";

type ScopeYearStat = FinanceByYearScopeStat & { year: number };

const FINANCE_SCOPES: FinanceScope[] = [
  "total",
  "autorisees",
  "subventionnees",
];

const emptyScopeStat = (): FinanceByYearScopeStat => ({
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
    soldeCumule: excedent - deficit,
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

  const structureIds = new Set([
    ...realiseByStructureId.keys(),
    ...previsionnelByStructureId.keys(),
  ]);
  const etpValues: (number | null)[] = [];
  const tauxValues: (number | null)[] = [];
  const coutValues: (number | null)[] = [];

  for (const structureId of structureIds) {
    const realise = realiseByStructureId.get(structureId);
    const previsionnel = previsionnelByStructureId.get(structureId);
    etpValues.push(
      roundStatsNumber(realise?.ETP ?? previsionnel?.ETP ?? null)
    );
    tauxValues.push(
      roundStatsRate(
        realise?.tauxEncadrement ?? previsionnel?.tauxEncadrement ?? null
      )
    );
    coutValues.push(
      roundStatsNumber(
        realise?.coutJournalier ?? previsionnel?.coutJournalier ?? null
      )
    );
  }

  return {
    totalETP: roundStatsNumber(sumValues(etpValues) ?? 0) ?? 0,
    tauxEncadrement: roundStatsRate(aggregateValues(tauxValues, aggregation)),
    coutJournalier: roundStatsNumber(
      aggregateValues(coutValues, aggregation)
    ),
  };
};

const computeScopeByYear = (
  structureIdsInScope: number[],
  context: StatistiquesContext,
  aggregation: NumericAggregation
): ScopeYearStat[] => {
  const { activeStructureIdsByPeriod, budgets, indicateurs } = context;
  const structureIdSet = new Set(structureIdsInScope);
  const scopedBudgets = budgets.filter((budget) =>
    structureIdSet.has(budget.structureId)
  );
  const scopedIndicateurs = indicateurs.filter(
    (indicateur) =>
      indicateur.structureId !== null &&
      structureIdSet.has(indicateur.structureId)
  );
  const years = collectDistinctYears(scopedBudgets, scopedIndicateurs);

  return years.map((year) => {
    const activeStructureIds = lookupActiveStructureIds(
      activeStructureIdsByPeriod,
      "year",
      String(year)
    );

    const budgetsForYear = scopedBudgets.filter(
      (budget) =>
        budget.year === year && activeStructureIds.has(budget.structureId)
    );
    const budgetStats = sumBudgetsForYear(budgetsForYear);
    const indicateurStats = sumIndicateursForYear(
      scopedIndicateurs.filter(
        (indicateur) =>
          indicateur.year === year &&
          indicateur.structureId !== null &&
          activeStructureIds.has(indicateur.structureId)
      ),
      aggregation
    );

    return {
      year,
      ...indicateurStats,
      ...budgetStats,
    };
  });
};

const scopeStatForYear = (
  stats: ScopeYearStat[],
  year: number
): FinanceByYearScopeStat => {
  const scopeStat = stats.find((yearStat) => yearStat.year === year);
  if (!scopeStat) {
    return emptyScopeStat();
  }

  const { year: _year, ...stat } = scopeStat;
  return stat;
};

export const computeFinanceStatistiques = (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): StatistiqueApiRead["finance"] => {
  const scopeIds = getStructureIdsByFinanceScope(context.allStructures);
  const statsByScope = Object.fromEntries(
    FINANCE_SCOPES.map((scope) => [
      scope,
      computeScopeByYear(scopeIds[scope], context, aggregation),
    ])
  ) as Record<FinanceScope, ScopeYearStat[]>;

  const years = collectDistinctYears(context.budgets, context.indicateurs);

  return {
    byYear: years.map((year) => ({
      year,
      total: scopeStatForYear(statsByScope.total, year),
      autorisees: scopeStatForYear(statsByScope.autorisees, year),
      subventionnees: scopeStatForYear(statsByScope.subventionnees, year),
    })),
  };
};
