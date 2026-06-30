import { aggregateValues, NumericAggregation } from "@/app/utils/math.util";
import { roundStatsNumber } from "@/app/utils/statistiques-format.util";
import {
  ControleQualiteEvaluationStat,
  ControleQualitePeriodBase,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbEvaluation,
  StatistiquesContext,
  StatistiquesPeriodGranularity,
} from "../statistiques.db.type";
import { groupByPeriodKey, lookupActiveStructureIds } from "../statistiques.utils";
import { computeEigPeriodMetrics } from "./controle-qualite-eig.util";

export const filterEvaluationsInScope = (
  evaluations: StatistiqueDbEvaluation[],
  activeStructureIds: Set<number>
): StatistiqueDbEvaluation[] =>
  evaluations.filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      activeStructureIds.has(evaluation.structureId)
  );

export const computeEvaluationGlobalSummary = (
  evaluations: StatistiqueDbEvaluation[],
  aggregation: NumericAggregation
): { moyenneEvaluationsCurrentYear: number | null } => ({
  moyenneEvaluationsCurrentYear: roundStatsNumber(
    aggregateValues(
      evaluations.map((evaluation) => evaluation.note),
      aggregation
    )
  ),
});

type PeriodSeriesConfig<Period> = {
  granularity: StatistiquesPeriodGranularity;
  toPeriodKey: (date: Date) => string;
  toPeriod: (periodKey: string) => Period;
};

const sumEvaluationNotes = (
  evaluations: StatistiqueDbEvaluation[],
  aggregation: NumericAggregation
): ControleQualiteEvaluationStat => {
  const structureIds = new Set<number>();

  for (const evaluation of evaluations) {
    if (evaluation.structureId !== null) {
      structureIds.add(evaluation.structureId);
    }
  }

  return {
    nbStructuresEvaluees: structureIds.size,
    noteGenerale: roundStatsNumber(
      aggregateValues(
        evaluations.map((evaluation) => evaluation.note),
        aggregation
      )
    ),
    notePersonne: roundStatsNumber(
      aggregateValues(
        evaluations.map((evaluation) => evaluation.notePersonne),
        aggregation
      )
    ),
    notePro: roundStatsNumber(
      aggregateValues(
        evaluations.map((evaluation) => evaluation.notePro),
        aggregation
      )
    ),
    noteStructure: roundStatsNumber(
      aggregateValues(
        evaluations.map((evaluation) => evaluation.noteStructure),
        aggregation
      )
    ),
  };
};

export const computePeriodSeries = <Period>(
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
