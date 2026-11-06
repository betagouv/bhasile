import {
  toMonthKey,
  toTrimesterKey,
  toYearKey,
} from "@/app/utils/date.util";
import { NumericAggregation, sumValues } from "@/app/utils/math.util";
import {
  ControleQualitePeriodStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiquesContext,
  StatistiquesPeriodGranularity,
} from "../statistiques.db.type";
import {
  countDaysBetween,
  filterByTwelveMonthWindow,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getStructureOpenBounds,
  getTwelveMonthWindow,
  groupByPeriodKey,
  isStructureOpenAt,
  lookupActiveStructureIds,
  monthKeyToDate,
  resolveDnaEventStructureIds,
  trimesterKeyToDate,
  yearKeyToDate,
} from "../statistiques.util";
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
    resolveDnaStructureIds,
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
          resolveDnaStructureIds
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
  const { allStructures, typologies, eigs, evaluations } = context;
  const typologieMap = getLastTypologiePerStructure(typologies);
  const structuresWithTypologie = filterStructuresWithTypologie(
    allStructures,
    typologieMap
  );
  const structureIdsWithTypologie = new Set(
    structuresWithTypologie.map((structure) => structure.id)
  );
  const window = getTwelveMonthWindow();

  // Une structure compte au numérateur et au dénominateur tant qu'elle est
  // ouverte : ses places sont pondérées par sa durée d'ouverture sur la fenêtre.
  const placesMoyennes =
    sumValues(
      structuresWithTypologie.map((structure) => {
        const bounds = getStructureOpenBounds(
          context,
          structure.id,
          window.start,
          window.end
        );
        const places = typologieMap.get(structure.id)?.placesAutorisees;
        return bounds && places != null
          ? (places * countDaysBetween(bounds.start, bounds.end)) /
              countDaysBetween(window.start, window.end)
          : null;
      })
    ) ?? 0;

  const recentEigs = filterByTwelveMonthWindow(
    eigs,
    (eig) => eig.evenementDate
  ).filter(
    (eig) =>
      eig.dnaCode !== null &&
      resolveDnaEventStructureIds(
      context.resolveDnaStructureIds,
      eig.dnaCode,
      eig.evenementDate,
      structureIdsWithTypologie
    ).some((structureId) =>
      isStructureOpenAt(context, structureId, eig.evenementDate)
    )
  );
  const recentEvaluations = filterByTwelveMonthWindow(
    evaluations,
    (evaluation) => evaluation.date
  ).filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      evaluation.date !== null &&
      isStructureOpenAt(context, evaluation.structureId, evaluation.date)
  );

  return {
    eig: {
      ...computeEigRates(recentEigs, placesMoyennes),
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
