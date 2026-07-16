import { NumericAggregation } from "@/app/utils/math.util";
import {
  ControleQualitePeriodStat,
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
  toMonthKey,
  toTrimesterKey,
  toYearKey,
  trimesterKeyToDate,
  yearKeyToDate,
} from "../statistiques.utils";
import {
  computeEigPeriodMetrics,
  computeEigRates,
} from "./controle-qualite-eig.util";
import {
  computeEvaluationGlobalSummary,
  filterEvaluationsInScope,
  sumEvaluationNotes,
} from "./controle-qualite-evaluation.util";

type PeriodSeriesConfig = {
  granularity: StatistiquesPeriodGranularity;
  toPeriodKey: (date: Date) => string;
  toDate: (periodKey: string) => Date;
};

// TODO: confirmer métier - `date` = 1er jour du mois / trimestre / année,
// plutôt que `year` + `trimester` (ou `year` + `month`) en champs séparés.
const computePeriodSeries = (
  context: StatistiquesContext,
  aggregation: NumericAggregation,
  config: PeriodSeriesConfig
): ControleQualitePeriodStat[] => {
  const {
    eigs,
    evaluations,
    dnaLinks,
    structureVersionTimeline,
    activeStructureIdsByPeriod,
  } = context;
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
        date: config.toDate(periodKey),
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

/** Computes the yearly series only, for the cartographie one-indicator requests. */
export const computeControleQualiteByYear = (
  context: StatistiquesContext,
  aggregation: NumericAggregation
): ControleQualitePeriodStat[] =>
  computePeriodSeries(context, aggregation, {
    granularity: "year",
    toPeriodKey: toYearKey,
    toDate: yearKeyToDate,
  });

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

  // TODO: confirmer métier - fenêtre glissante 12 mois vs année civile (ex. 2026).
  const recentEigs = filterByTwelveMonthWindow(
    eigs,
    (eig) => eig.evenementDate
  );
  const recentEvaluations = filterByTwelveMonthWindow(
    filterEvaluationsInScope(evaluations, activeStructureIds),
    (evaluation) => evaluation.date
  );

  return {
    eig: {
      ...computeEigRates(recentEigs, totalPlaces),
      ...computeEvaluationGlobalSummary(recentEvaluations, aggregation),
    },
    byMonth: computePeriodSeries(context, aggregation, {
      granularity: "month",
      toPeriodKey: toMonthKey,
      toDate: monthKeyToDate,
    }),
    byTrimester: computePeriodSeries(context, aggregation, {
      granularity: "trimester",
      toPeriodKey: toTrimesterKey,
      toDate: trimesterKeyToDate,
    }),
    byYear: computePeriodSeries(context, aggregation, {
      granularity: "year",
      toPeriodKey: toYearKey,
      toDate: yearKeyToDate,
    }),
  };
};
