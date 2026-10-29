import {
  aggregateValues,
  NumericAggregation,
  ratio,
  sumValues,
} from "@/app/utils/math.util";
import { getNow } from "@/app/utils/now.util";
import { roundStatsNumber } from "@/app/utils/statistiques-format.util";
import {
  isStructureAutorisee,
  isStructureSubventionnee,
} from "@/app/utils/structure.util";
import { PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import {
  FinanceByYearScopeStat,
  FinanceByYearStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import {
  FINANCE_REALISE_LAG_YEARS,
  resolveStructuresForYear,
} from "../completude.util";
import type {
  StatistiqueDbBudget,
  StatistiqueDbBudgetAgg,
  StatistiqueDbCpomBudget,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbStructure,
  StatistiqueDbTypologieValues,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  collectDistinctYears,
  getInitialisedStructuresActiveInYear,
  getTypologieMapForExactYear,
  isCpomLinkActiveInYear,
} from "../statistiques.util";
import { computeStructureJoursPlaces } from "./finance-theorique.util";

type FinanceScope = keyof Omit<FinanceByYearStat, "year">;

const isStructureInFinanceScope = (
  structure: StatistiqueDbStructure,
  scope: FinanceScope
): boolean => {
  if (scope === "autorisees") {
    return isStructureAutorisee(structure.type);
  }
  if (scope === "subventionnees") {
    return isStructureSubventionnee(structure.type);
  }
  return true;
};

/**
 * Budget compté sur une année : celui d'une structure, ou celui d'un CPOM (par
 * type de structure) qui remplace alors le budget de ses structures.
 */
type FinanceBudgetEntry = StatistiqueDbBudgetAgg & {
  structureIds: number[];
};

const sumBudgetsForYear = (budgetsForYear: FinanceBudgetEntry[]) => {
  let dotationDemandee = 0;
  let dotationAccordee = 0;
  let totalProduits = 0;
  let totalCharges = 0;
  let excedentCumule = 0;
  let deficitCumule = 0;

  for (const budget of budgetsForYear) {
    dotationDemandee += budget.dotationDemandee;
    dotationAccordee += budget.dotationAccordee;
    totalProduits += budget.totalProduits;
    totalCharges += budget.totalCharges;

    const resultatNet = budget.totalProduits - budget.totalCharges;
    if (resultatNet > 0) {
      excedentCumule += resultatNet;
    } else {
      deficitCumule += Math.abs(resultatNet);
    }
  }

  return {
    dotationDemandee,
    dotationAccordee,
    totalProduits,
    totalCharges,
    resultatNet: totalProduits - totalCharges,
    excedentCumule,
    deficitCumule,
  };
};

const toCpomBudgetKey = (
  cpomId: number,
  year: number,
  structureType: string | null
): string => `${cpomId}|${year}|${structureType}`;

// Le formulaire CPOM enregistre une ligne par année même non saisie : une ligne à zéro vaut absence de budget.
const hasBudgetAmount = (budget: StatistiqueDbBudgetAgg): boolean =>
  budget.dotationDemandee !== 0 ||
  budget.dotationAccordee !== 0 ||
  budget.totalProduits !== 0 ||
  budget.totalCharges !== 0;

export const indexCpomBudgets = (
  cpomBudgets: StatistiqueDbCpomBudget[]
): Map<string, StatistiqueDbCpomBudget> =>
  new Map(
    cpomBudgets
      .filter(hasBudgetAmount)
      .map((budget) => [
        toCpomBudgetKey(budget.cpomId, budget.year, budget.structureType),
        budget,
      ])
  );

/**
 * Une structure sous CPOM sur l'année est comptée via le budget global de son
 * CPOM (ligne de son type), en entier même si le périmètre ne retient qu'une
 * partie des structures du CPOM. Sans budget CPOM saisi pour l'année, repli sur
 * le budget de la structure.
 */
const buildBudgetEntries = (
  structures: StatistiqueDbStructure[],
  structureBudgets: StatistiqueDbBudget[],
  context: Pick<StatistiquesContext, "cpomLinks" | "cpomBudgetByKey">,
  year: number
): FinanceBudgetEntry[] => {
  const structureById = new Map(
    structures.map((structure) => [structure.id, structure])
  );
  const cpomEntryByBudgetId = new Map<number, FinanceBudgetEntry>();
  const structureIdsUnderCpomBudget = new Set<number>();

  for (const link of context.cpomLinks) {
    const structure = structureById.get(link.structureId);
    if (!structure || !isCpomLinkActiveInYear(link, year)) {
      continue;
    }
    const cpomBudget = context.cpomBudgetByKey.get(
      toCpomBudgetKey(link.cpomId, year, structure.type)
    );
    if (!cpomBudget) {
      continue;
    }
    const entry = cpomEntryByBudgetId.get(cpomBudget.id) ?? {
      ...cpomBudget,
      structureIds: [],
    };
    entry.structureIds.push(structure.id);
    cpomEntryByBudgetId.set(cpomBudget.id, entry);
    structureIdsUnderCpomBudget.add(structure.id);
  }

  return [
    ...cpomEntryByBudgetId.values(),
    ...structureBudgets
      .filter((budget) => !structureIdsUnderCpomBudget.has(budget.structureId))
      .map((budget) => ({
        ...budget,
        structureIds: [budget.structureId],
      })),
  ];
};

type StructureFinanceIndicateurs = {
  structureId: number;
  etpPrevisionnel: number | null;
  etpRealise: number | null;
  tauxPrevisionnel: number | null;
  tauxRealise: number | null;
  tauxCible: number | null;
  coutTheorique: number | null;
  coutCible: number | null;
};

type FinanceYearData = {
  budgets: FinanceBudgetEntry[];
  indicateurs: StructureFinanceIndicateurs[];
  hasData: boolean;
};

const indexIndicateursByStructureId = (
  indicateurs: StatistiqueDbIndicateurFinancier[],
  type: StatistiqueDbIndicateurFinancier["type"]
): Map<number, StatistiqueDbIndicateurFinancier> => {
  const indicateurByStructureId = new Map<
    number,
    StatistiqueDbIndicateurFinancier
  >();
  for (const indicateur of indicateurs) {
    if (indicateur.structureId !== null && indicateur.type === type) {
      indicateurByStructureId.set(indicateur.structureId, indicateur);
    }
  }
  return indicateurByStructureId;
};

const divideOrNull = (
  numerator: number | null | undefined,
  denominator: number | null | undefined
): number | null =>
  numerator != null && denominator != null
    ? ratio(numerator, denominator)
    : null;

/** Budgets et indicateurs par structure d'une année, calculés une fois puis agrégés par scope. */
const computeFinanceYearData = (
  structures: StatistiqueDbStructure[],
  context: StatistiquesContext,
  year: number
): FinanceYearData => {
  const structureIds = new Set(structures.map((structure) => structure.id));
  const structureBudgets = context.budgets.filter(
    (budget) => budget.year === year && structureIds.has(budget.structureId)
  );
  const budgets = buildBudgetEntries(
    structures,
    structureBudgets,
    context,
    year
  );
  const indicateursForYear = context.indicateurs.filter(
    (indicateur) =>
      indicateur.year === year &&
      indicateur.structureId !== null &&
      structureIds.has(indicateur.structureId)
  );

  const now = getNow();
  const typologieMap: Map<number, StatistiqueDbTypologieValues> =
    year >= PLACES_VERSIONED_FROM_YEAR
      ? new Map()
      : getTypologieMapForExactYear(context.typologies, year);
  const previsionnelByStructureId = indexIndicateursByStructureId(
    indicateursForYear,
    "PREVISIONNEL"
  );
  const realiseByStructureId = indexIndicateursByStructureId(
    indicateursForYear,
    "REALISE"
  );
  // Le coût théorique se calcule par structure : il garde la dotation propre de chacune.
  const dotationByStructureId = new Map(
    structureBudgets.map((budget) => [
      budget.structureId,
      budget.dotationAccordee,
    ])
  );

  const indicateurs = structures.map((structure) => {
    const joursPlaces = computeStructureJoursPlaces(
      context,
      structure.id,
      year,
      context.timelineByStructureId.get(structure.id) ?? [],
      typologieMap.get(structure.id)?.placesAutorisees ?? null,
      now
    );
    const placesMoyennes = divideOrNull(
      joursPlaces?.joursPlaces,
      joursPlaces?.jours
    );
    const etpPrevisionnel =
      previsionnelByStructureId.get(structure.id)?.ETP ?? null;
    const etpRealise = realiseByStructureId.get(structure.id)?.ETP ?? null;

    return {
      structureId: structure.id,
      etpPrevisionnel,
      etpRealise,
      tauxPrevisionnel: divideOrNull(placesMoyennes, etpPrevisionnel),
      tauxRealise: divideOrNull(placesMoyennes, etpRealise),
      tauxCible: context.ciblesFinancieres.getTauxEncadrementCible(structure, year),
      coutTheorique: divideOrNull(
        dotationByStructureId.get(structure.id) || null,
        joursPlaces?.joursPlaces
      ),
      // TODO : coût cible non renvoyé par l'API, à supprimer si l'abandon est confirmé
      coutCible: context.ciblesFinancieres.getTarifJournalierCible(structure, year),
    };
  });

  return {
    budgets,
    indicateurs,
    hasData: budgets.length > 0 || indicateursForYear.length > 0,
  };
};

const resolveFinanceStructuresForYear = (
  context: StatistiquesContext,
  year: number,
  scope: FinanceScope
): ReturnType<typeof resolveStructuresForYear> =>
  resolveStructuresForYear(
    context,
    getInitialisedStructuresActiveInYear(context, year).filter((structure) =>
      isStructureInFinanceScope(structure, scope)
    ),
    year,
    FINANCE_REALISE_LAG_YEARS
  );

const aggregateFinanceScope = (
  yearData: FinanceYearData,
  scoped: ReturnType<typeof resolveStructuresForYear>,
  aggregation: NumericAggregation
): FinanceByYearScopeStat => {
  const structureIds = new Set(
    scoped.structures.map((structure) => structure.id)
  );
  const indicateurs = yearData.indicateurs.filter((indicateur) =>
    structureIds.has(indicateur.structureId)
  );
  const aggregate = (
    field: keyof Omit<StructureFinanceIndicateurs, "structureId">
  ): number | null =>
    roundStatsNumber(
      aggregateValues(
        indicateurs.map((indicateur) => indicateur[field]),
        aggregation
      )
    );
  const sum = (field: "etpPrevisionnel" | "etpRealise"): number | null =>
    roundStatsNumber(
      sumValues(indicateurs.map((indicateur) => indicateur[field]))
    );

  return {
    completude: scoped.completude,
    totalETPPrevisionnel: sum("etpPrevisionnel"),
    totalETPRealise: sum("etpRealise"),
    tauxEncadrementCible: aggregate("tauxCible"),
    tauxEncadrementTheoriquePrevisionnel: aggregate("tauxPrevisionnel"),
    tauxEncadrementTheoriqueRealise: aggregate("tauxRealise"),
    coutJournalierTheorique: aggregate("coutTheorique"),
    ...sumBudgetsForYear(
      yearData.budgets.filter((budget) =>
        budget.structureIds.some((structureId) => structureIds.has(structureId))
      )
    ),
  };
};

export const computeFinanceStatistiques = (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): StatistiqueApiRead["finance"] => {
  const currentYear = getNow().getUTCFullYear();
  const years = collectDistinctYears(
    context.budgets,
    [...context.cpomBudgetByKey.values()],
    context.indicateurs
  ).filter((year) => year <= currentYear);

  return {
    byYear: years.map((year) => {
      const total = resolveFinanceStructuresForYear(context, year, "total");
      const yearData = computeFinanceYearData(total.structures, context, year);
      const [autorisees, subventionnees] = (
        ["autorisees", "subventionnees"] as const
      ).map((scope) =>
        aggregateFinanceScope(
          yearData,
          resolveFinanceStructuresForYear(context, year, scope),
          aggregation
        )
      );

      return {
        year,
        total: aggregateFinanceScope(yearData, total, aggregation),
        autorisees,
        subventionnees,
      };
    }),
  };
};

export type FinanceCartographieField =
  | "dotationAccordee"
  | "resultatNet"
  | "etp"
  | "tauxEncadrement"
  | "coutJournalier";

// La cartographie n'affiche qu'un état : réalisé, sinon prévisionnel, résolu structure par structure.
const computeCartographieValue = (
  yearData: FinanceYearData,
  total: ReturnType<typeof resolveStructuresForYear>,
  aggregation: NumericAggregation,
  field: FinanceCartographieField
): number | null => {
  if (field === "etp") {
    return roundStatsNumber(
      sumValues(
        yearData.indicateurs.map(
          (indicateur) => indicateur.etpRealise ?? indicateur.etpPrevisionnel
        )
      )
    );
  }
  if (field === "tauxEncadrement") {
    return roundStatsNumber(
      aggregateValues(
        yearData.indicateurs.map(
          (indicateur) => indicateur.tauxRealise ?? indicateur.tauxPrevisionnel
        ),
        aggregation
      )
    );
  }

  const stat = aggregateFinanceScope(yearData, total, aggregation);
  return field === "coutJournalier"
    ? stat.coutJournalierTheorique
    : stat[field];
};

/** Computes a single total field for given years, for the cartographie one-indicator requests. */
export const computeFinanceTotalValuesForYears = (
  context: StatistiquesContext,
  years: number[],
  aggregation: NumericAggregation,
  field: FinanceCartographieField
): (number | null)[] =>
  years.map((year) => {
    const total = resolveFinanceStructuresForYear(context, year, "total");
    const yearData = computeFinanceYearData(total.structures, context, year);

    return yearData.hasData
      ? computeCartographieValue(yearData, total, aggregation, field)
      : null;
  });
