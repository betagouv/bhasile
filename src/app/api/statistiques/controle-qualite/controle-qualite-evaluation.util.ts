import { aggregateValues, NumericAggregation } from "@/app/utils/math.util";
import { roundStatsNumber } from "@/app/utils/statistiques-format.util";
import { CURRENT_YEAR } from "@/constants";
import {
  ControleQualiteByMonthStat,
  ControleQualiteByTrimesterStat,
  ControleQualiteByYearStat,
  ControleQualiteEvaluationStat,
  ControleQualitePeriodStat,
  EigStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import {
  monthKeyToDate,
  parseTrimesterKey,
  toMonthKey,
  toTrimesterKey,
  toYearKey,
} from "../statistiques.utils";
import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
} from "../statistiques.db.type";
import {
  buildDnaCodeToStructureIds,
  computeEigPeriodMetrics,
  computeEigRates,
  filterRecentEigs,
} from "./controle-qualite-eig.util";

const groupByPeriodKey = <Item>(
  items: Item[],
  getDate: (item: Item) => Date | null | undefined,
  getPeriodKey: (date: Date) => string
): Map<string, Item[]> => {
  const byPeriod = new Map<string, Item[]>();

  for (const item of items) {
    const date = getDate(item);
    if (!date) {
      continue;
    }
    const periodKey = getPeriodKey(date);
    const itemsForPeriod = byPeriod.get(periodKey) ?? [];
    itemsForPeriod.push(item);
    byPeriod.set(periodKey, itemsForPeriod);
  }

  return byPeriod;
};

const filterEvaluationsForYear = (
  evaluations: StatistiqueDbEvaluation[],
  activeStructureIds: Set<number>,
  year: number
): StatistiqueDbEvaluation[] =>
  evaluations.filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      activeStructureIds.has(evaluation.structureId) &&
      evaluation.date !== null &&
      new Date(evaluation.date).getFullYear() === year
  );

const computeMoyenneEvaluationsCurrentYear = (
  evaluations: StatistiqueDbEvaluation[],
  activeStructureIds: Set<number>,
  aggregation: NumericAggregation
): number | null =>
  roundStatsNumber(
    aggregateValues(
      filterEvaluationsForYear(
        evaluations,
        activeStructureIds,
        CURRENT_YEAR
      ).map((evaluation) => evaluation.note),
      aggregation
    )
  );

const computeEigSummary = (
  eigs: StatistiqueDbEig[],
  totalPlacesAutorisees: number,
  evaluations: StatistiqueDbEvaluation[],
  activeStructureIds: Set<number>,
  aggregation: NumericAggregation
): EigStat => ({
  ...computeEigRates(filterRecentEigs(eigs), totalPlacesAutorisees),
  moyenneEvaluationsCurrentYear: computeMoyenneEvaluationsCurrentYear(
    evaluations,
    activeStructureIds,
    aggregation
  ),
});

const computeEvaluationNotes = (
  evaluations: StatistiqueDbEvaluation[],
  aggregation: NumericAggregation
): ControleQualiteEvaluationStat => {
  const structureIds = new Set(
    evaluations
      .map((evaluation) => evaluation.structureId)
      .filter((structureId): structureId is number => structureId !== null)
  );

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

const computeControleQualitePeriodStat = (
  eigsForPeriod: StatistiqueDbEig[],
  evaluationsForPeriod: StatistiqueDbEvaluation[],
  activeStructureIdSet: Set<number>,
  totalStructures: number,
  dnaCodeToStructureIds: Map<string, Set<number>>,
  aggregation: NumericAggregation
): ControleQualitePeriodStat => ({
  ...computeEigPeriodMetrics(
    eigsForPeriod,
    activeStructureIdSet,
    totalStructures,
    dnaCodeToStructureIds
  ),
  ...computeEvaluationNotes(evaluationsForPeriod, aggregation),
});

type ControleQualiteSeriesContext = {
  activeStructureIdSet: Set<number>;
  totalStructures: number;
  dnaCodeToStructureIds: Map<string, Set<number>>;
  aggregation: NumericAggregation;
};

const computeControleQualiteByPeriod = <
  Entry extends ControleQualitePeriodStat,
>(
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  context: ControleQualiteSeriesContext,
  getPeriodKey: (date: Date) => string,
  mapPeriodKey: (
    periodKey: string
  ) => Omit<Entry, keyof ControleQualitePeriodStat>
): Entry[] => {
  const eigsByPeriod = groupByPeriodKey(
    eigs,
    (eig) => eig.evenementDate,
    getPeriodKey
  );
  const evaluationsByPeriod = groupByPeriodKey(
    evaluations,
    (evaluation) => evaluation.date,
    getPeriodKey
  );

  return [...new Set([...eigsByPeriod.keys(), ...evaluationsByPeriod.keys()])]
    .sort()
    .map(
      (periodKey) =>
        ({
          ...mapPeriodKey(periodKey),
          ...computeControleQualitePeriodStat(
            eigsByPeriod.get(periodKey) ?? [],
            evaluationsByPeriod.get(periodKey) ?? [],
            context.activeStructureIdSet,
            context.totalStructures,
            context.dnaCodeToStructureIds,
            context.aggregation
          ),
        }) as Entry
    );
};

const buildSeriesContext = (
  activeStructureIds: number[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteSeriesContext => ({
  activeStructureIdSet: new Set(activeStructureIds),
  totalStructures: activeStructureIds.length,
  dnaCodeToStructureIds: buildDnaCodeToStructureIds(dnaLinks),
  aggregation,
});

export const computeControleQualiteStatistiques = (
  activeStructureIds: number[],
  totalPlacesAutorisees: number,
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): StatistiqueApiRead["controleQualite"] => {
  const activeStructureIdSet = new Set(activeStructureIds);
  const evaluationsActives = evaluations.filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      activeStructureIdSet.has(evaluation.structureId)
  );
  const seriesContext = buildSeriesContext(
    activeStructureIds,
    dnaLinks,
    aggregation
  );

  return {
    eig: computeEigSummary(
      eigs,
      totalPlacesAutorisees,
      evaluationsActives,
      activeStructureIdSet,
      aggregation
    ),
    byMonth: computeControleQualiteByPeriod<ControleQualiteByMonthStat>(
      eigs,
      evaluationsActives,
      seriesContext,
      toMonthKey,
      (monthKey) => ({ date: monthKeyToDate(monthKey) })
    ),
    byTrimester: computeControleQualiteByPeriod<ControleQualiteByTrimesterStat>(
      eigs,
      evaluationsActives,
      seriesContext,
      toTrimesterKey,
      parseTrimesterKey
    ),
    byYear: computeControleQualiteByPeriod<ControleQualiteByYearStat>(
      eigs,
      evaluationsActives,
      seriesContext,
      toYearKey,
      (yearKey) => ({ year: Number(yearKey) })
    ),
  };
};
