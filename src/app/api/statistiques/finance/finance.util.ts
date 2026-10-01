import {
  aggregateValues,
  NumericAggregation,
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

import { FIRST_CAMPAGNE_FINANCE_LOOKBACK_YEARS } from "../completude.util";
import type {
  StatistiqueDbBudget,
  StatistiqueDbIndicateurFinancier,
  StatistiqueDbStructure,
  StatistiquesContext,
} from "../statistiques.db.type";
import {
  collectDistinctYears,
  getTypologieMapForExactYear,
  indexTimelineByStructureId,
  resolveCountedStructuresForYear,
} from "../statistiques.util";
import {
  buildCiblesFinancieresLookup,
  computeStructureJoursPlaces,
} from "./finance-theorique.util";

type FinanceScope = keyof Omit<FinanceByYearStat, "year" | "completude">;

const FINANCE_SCOPES: FinanceScope[] = ["total", "autorisees", "subventionnees"];

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

type FinanceCartographieStat = {
  etp: number | null;
  tauxEncadrement: number | null;
};

type ScopeByYearResult = {
  stat: FinanceByYearScopeStat;
  // Réalisé, sinon prévisionnel, résolu par structure : la cartographie n'affiche qu'un état.
  cartographie: FinanceCartographieStat;
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

const sumDotationAccordeeByStructureId = (
  budgets: StatistiqueDbBudget[]
): Map<number, number> => {
  const dotationByStructureId = new Map<number, number>();
  for (const budget of budgets) {
    dotationByStructureId.set(
      budget.structureId,
      (dotationByStructureId.get(budget.structureId) ?? 0) +
        budget.dotationAccordee
    );
  }
  return dotationByStructureId;
};

const divideOrNull = (
  numerator: number | null | undefined,
  denominator: number | null | undefined
): number | null =>
  numerator != null && denominator != null && denominator > 0
    ? numerator / denominator
    : null;

const computeScopeForYear = (
  structures: StatistiqueDbStructure[],
  context: StatistiquesContext,
  aggregation: NumericAggregation,
  year: number
): ScopeByYearResult => {
  const structureIds = new Set(structures.map((structure) => structure.id));
  const budgetsForYear = context.budgets.filter(
    (budget) => budget.year === year && structureIds.has(budget.structureId)
  );
  const indicateursForYear = context.indicateurs.filter(
    (indicateur) =>
      indicateur.year === year &&
      indicateur.structureId !== null &&
      structureIds.has(indicateur.structureId)
  );

  const now = getNow();
  const isVersionedYear = year >= PLACES_VERSIONED_FROM_YEAR;
  const timelineByStructureId = isVersionedYear
    ? indexTimelineByStructureId(context.structureVersionTimeline)
    : new Map();
  const typologieMap = isVersionedYear
    ? new Map()
    : getTypologieMapForExactYear(context.typologies, year);
  const cibles = buildCiblesFinancieresLookup(context);
  const previsionnelByStructureId = indexIndicateursByStructureId(
    indicateursForYear,
    "PREVISIONNEL"
  );
  const realiseByStructureId = indexIndicateursByStructureId(
    indicateursForYear,
    "REALISE"
  );
  const dotationByStructureId =
    sumDotationAccordeeByStructureId(budgetsForYear);

  const etpPrevisionnel: (number | null)[] = [];
  const etpRealise: (number | null)[] = [];
  const etpResolu: (number | null)[] = [];
  const tauxPrevisionnel: (number | null)[] = [];
  const tauxRealise: (number | null)[] = [];
  const tauxResolu: (number | null)[] = [];
  const tauxCible: (number | null)[] = [];
  const coutTheorique: (number | null)[] = [];
  const coutCible: (number | null)[] = [];

  for (const structure of structures) {
    const joursPlaces = computeStructureJoursPlaces(
      context,
      structure.id,
      year,
      timelineByStructureId.get(structure.id) ?? [],
      typologieMap.get(structure.id)?.placesAutorisees ?? null,
      now
    );
    const placesMoyennes = divideOrNull(
      joursPlaces?.joursPlaces,
      joursPlaces?.jours
    );
    const structureEtpPrevisionnel =
      previsionnelByStructureId.get(structure.id)?.ETP ?? null;
    const structureEtpRealise =
      realiseByStructureId.get(structure.id)?.ETP ?? null;
    const structureEtpResolu = structureEtpRealise ?? structureEtpPrevisionnel;

    etpPrevisionnel.push(structureEtpPrevisionnel);
    etpRealise.push(structureEtpRealise);
    etpResolu.push(structureEtpResolu);
    tauxPrevisionnel.push(divideOrNull(placesMoyennes, structureEtpPrevisionnel));
    tauxRealise.push(divideOrNull(placesMoyennes, structureEtpRealise));
    tauxResolu.push(divideOrNull(placesMoyennes, structureEtpResolu));
    tauxCible.push(cibles.getTauxEncadrementCible(structure, year));
    coutTheorique.push(
      divideOrNull(
        dotationByStructureId.get(structure.id) || null,
        joursPlaces?.joursPlaces
      )
    );
    coutCible.push(cibles.getTarifJournalierCible(structure, year));
  }

  const aggregate = (values: (number | null)[]): number | null =>
    roundStatsNumber(aggregateValues(values, aggregation));

  return {
    stat: {
      totalETPPrevisionnel: roundStatsNumber(sumValues(etpPrevisionnel)),
      totalETPRealise: roundStatsNumber(sumValues(etpRealise)),
      tauxEncadrementCible: aggregate(tauxCible),
      tauxEncadrementTheoriquePrevisionnel: aggregate(tauxPrevisionnel),
      tauxEncadrementTheoriqueRealise: aggregate(tauxRealise),
      coutJournalierCible: aggregate(coutCible),
      coutJournalierTheorique: aggregate(coutTheorique),
      ...sumBudgetsForYear(budgetsForYear),
    },
    cartographie: {
      etp: roundStatsNumber(sumValues(etpResolu)),
      tauxEncadrement: aggregate(tauxResolu),
    },
    hasData: budgetsForYear.length > 0 || indicateursForYear.length > 0,
  };
};

export const computeFinanceStatistiques = (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): StatistiqueApiRead["finance"] => {
  const years = collectDistinctYears(context.budgets, context.indicateurs);

  return {
    byYear: years.map((year) => {
      const { structures, completude } = resolveCountedStructuresForYear(
        context,
        year,
        FIRST_CAMPAGNE_FINANCE_LOOKBACK_YEARS
      );
      const [total, autorisees, subventionnees] = FINANCE_SCOPES.map(
        (scope) =>
          computeScopeForYear(
            structures.filter((structure) =>
              isStructureInFinanceScope(structure, scope)
            ),
            context,
            aggregation,
            year
          ).stat
      );

      return { year, completude, total, autorisees, subventionnees };
    }),
  };
};

export type FinanceCartographieField =
  | "dotationAccordee"
  | "resultatNet"
  | "etp"
  | "tauxEncadrement"
  | "coutJournalier";

const pickCartographieValue = (
  result: ScopeByYearResult,
  field: FinanceCartographieField
): number | null => {
  switch (field) {
    case "etp":
      return result.cartographie.etp;
    case "tauxEncadrement":
      return result.cartographie.tauxEncadrement;
    case "coutJournalier":
      return result.stat.coutJournalierTheorique;
    default:
      return result.stat[field];
  }
};

/** Computes a single total field for given years, for the cartographie one-indicator requests. */
export const computeFinanceTotalValuesForYears = (
  context: StatistiquesContext,
  years: number[],
  aggregation: NumericAggregation,
  field: FinanceCartographieField
): (number | null)[] =>
  years.map((year) => {
    const result = computeScopeForYear(
      resolveCountedStructuresForYear(
        context,
        year,
        FIRST_CAMPAGNE_FINANCE_LOOKBACK_YEARS
      ).structures,
      context,
      aggregation,
      year
    );
    return result.hasData ? pickCartographieValue(result, field) : null;
  });
