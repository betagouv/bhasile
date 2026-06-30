import { aggregateValues, NumericAggregation } from "@/app/utils/math.util";
import { roundStatsNumber } from "@/app/utils/statistiques-format.util";
import {
  ControleQualiteEvaluationStat,
  ControleQualitePeriodBase,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbEvaluation,
  StatistiquesContext,
  StatistiquesPeriodGranularity,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
  filterStructuresWithTypologie,
  getLastTypologiePerStructure,
  getTwelveMonthCutoffKey,
  groupByPeriodKey,
  lookupActiveStructureIds,
  monthKeyToDate,
  parseTrimesterKey,
  toMonthKey,
  toTrimesterKey,
  toYearKey,
} from "../statistiques.utils";
import {
  buildDnaCodeToStructureIds,
  computeEigPeriodMetrics,
  computeEigRates,
  filterRecentEigs,
} from "./controle-qualite-eig.util";

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

const computePeriodSeries = <Period>(
  context: StatistiquesContext,
  aggregation: NumericAggregation,
  config: PeriodSeriesConfig<Period>
): (ControleQualitePeriodBase & Period)[] => {
  const { eigs, evaluations, dnaLinks, activeStructureIdsByPeriod } = context;
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
      const dnaCodeToStructureIds = buildDnaCodeToStructureIds(
        dnaLinks.filter(
          (link) =>
            link.structureId !== null &&
            activeStructureIds.has(link.structureId)
        )
      );
      const evaluationsForPeriod = (
        evaluationsByPeriod.get(periodKey) ?? []
      ).filter(
        (evaluation) =>
          evaluation.structureId !== null &&
          activeStructureIds.has(evaluation.structureId)
      );

      return {
        ...config.toPeriod(periodKey),
        ...computeEigPeriodMetrics(
          eigsByPeriod.get(periodKey) ?? [],
          activeStructureIds,
          activeStructureIds.size,
          dnaCodeToStructureIds
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
  const evaluationsInScope = evaluations.filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      activeStructureIds.has(evaluation.structureId)
  );

  // TODO: confirmer métier — fenêtre glissante 12 mois vs année civile (ex. 2026).
  // Même jour il y a 1 an dans les deux cas pour l'instant.
  const twelveMonthCutoff = getTwelveMonthCutoffKey();
  const recentEvaluations = evaluationsInScope.filter(
    (evaluation) =>
      evaluation.date !== null &&
      toMonthKey(new Date(evaluation.date)) >= twelveMonthCutoff
  );

  return {
    eig: {
      ...computeEigRates(
        filterRecentEigs(eigs),
        computeTotalPlaces(structuresWithTypologie, typologieMap)
      ),
      moyenneEvaluationsCurrentYear: roundStatsNumber(
        aggregateValues(
          recentEvaluations.map((evaluation) => evaluation.note),
          aggregation
        )
      ),
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
