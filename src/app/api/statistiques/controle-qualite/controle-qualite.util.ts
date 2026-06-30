import { NumericAggregation } from "@/app/utils/math.util";
import {
  ControleQualitePeriodBase,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiquesContext,
  StatistiquesPeriodGranularity,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterByTwelveMonthWindow,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  groupByPeriodKey,
  lookupActiveStructureIds,
  monthKeyToDate,
  parseTrimesterKey,
  toMonthKey,
  toTrimesterKey,
  toYearKey,
} from "../statistiques.utils";
import { computeEigPeriodMetrics, computeEigRates } from "./controle-qualite-eig.util";
import {
  computeEvaluationGlobalSummary,
  filterEvaluationsInScope,
  sumEvaluationNotes,
} from "./controle-qualite-evaluation.util";

type PeriodSeriesConfig<Period> = {
  granularity: StatistiquesPeriodGranularity;
  toPeriodKey: (date: Date) => string;
  toPeriod: (periodKey: string) => Period;
};

const computePeriodSeries = <Period>(
  context: StatistiquesContext,
  aggregation: NumericAggregation,
  config: PeriodSeriesConfig<Period>
): (ControleQualitePeriodBase & Period)[] => {
  const { eigs, evaluations, dnaLinks, structureVersionTimeline, activeStructureIdsByPeriod } =
    context;
  const eigsByPeriod = groupByPeriodKey(
    eigs,
    (eig) => eig.evenementDate,
    config.toPeriodKey
  );
  const evaluationsByPeriod = groupByPeriodKey(
    evaluations,
    (evaluation) => evaluation.date,
    config.toPeriodKey
  );

  return [...new Set([...eigsByPeriod.keys(), ...evaluationsByPeriod.keys()])]
    .sort()
    .map((periodKey) => {
      const activeStructureIds = lookupActiveStructureIds(
        activeStructureIdsByPeriod,
        config.granularity,
        periodKey
      );
      const evaluationsForPeriod = filterEvaluationsInScope(
        evaluationsByPeriod.get(periodKey) ?? [],
        activeStructureIds
      );

      return {
        ...config.toPeriod(periodKey),
        ...computeEigPeriodMetrics(
          eigsByPeriod.get(periodKey) ?? [],
          activeStructureIds,
          dnaLinks,
          structureVersionTimeline
        ),
        ...sumEvaluationNotes(evaluationsForPeriod, aggregation),
      };
    });
};

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
