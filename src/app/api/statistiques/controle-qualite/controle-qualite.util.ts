import { NumericAggregation } from "@/app/utils/math.util";
import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import type { StatistiquesContext } from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterByTwelveMonthWindow,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  monthKeyToDate,
  parseTrimesterKey,
  toMonthKey,
  toTrimesterKey,
  toYearKey,
} from "../statistiques.utils";
import { computeEigRates } from "./controle-qualite-eig.util";
import {
  computeEvaluationGlobalSummary,
  computePeriodSeries,
  filterEvaluationsInScope,
} from "./controle-qualite-evaluation.util";

export const computeControleQualiteStatistiques = (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): StatistiqueApiRead["controleQualite"] => {
  const { structures, typologies, eigs, evaluations } = context;
  const typologieMap = getLastTypologiePerStructure(typologies);
  const structuresWithTypologie = filterStructuresWithTypologie(
    structures,
    typologieMap
  );
  const activeStructureIds = new Set(
    structuresWithTypologie.map((structure) => structure.id)
  );
  const totalPlaces = computeTotalPlaces(structuresWithTypologie, typologieMap);

  // TODO: confirmer métier — fenêtre glissante 12 mois vs année civile (ex. 2026).
  const recentEigs = filterByTwelveMonthWindow(eigs, (eig) => eig.evenementDate);
  const recentEvaluations = filterByTwelveMonthWindow(
    filterEvaluationsInScope(evaluations, activeStructureIds),
    (evaluation) => evaluation.date
  );

  return {
    eig: {
      ...computeEigRates(recentEigs, totalPlaces),
      ...computeEvaluationGlobalSummary(recentEvaluations, aggregation),
    },
    byMonth: computePeriodSeries<{ date: Date }>(context, aggregation, {
      granularity: "month",
      toPeriodKey: toMonthKey,
      toPeriod: (monthKey) => ({ date: monthKeyToDate(monthKey) }),
    }),
    byTrimester: computePeriodSeries<{ year: number; trimester: number }>(
      context,
      aggregation,
      {
        granularity: "trimester",
        toPeriodKey: toTrimesterKey,
        toPeriod: parseTrimesterKey,
      }
    ),
    byYear: computePeriodSeries<{ year: number }>(context, aggregation, {
      granularity: "year",
      toPeriodKey: toYearKey,
      toPeriod: (yearKey) => ({ year: Number(yearKey) }),
    }),
  };
};
