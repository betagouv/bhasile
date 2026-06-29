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

import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
  StatistiquesYearContext,
} from "../statistiques.db.type";
import {
  getActiveStructureIdsForPeriod,
  getActiveStructureIdsForYear,
  getMonthPeriodBounds,
  getTrimesterPeriodBounds,
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
): ControleQualitePeriodStat => {
  const evaluationsActives = evaluationsForPeriod.filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      activeStructureIdSet.has(evaluation.structureId)
  );

  return {
    ...computeEigPeriodMetrics(
      eigsForPeriod,
      activeStructureIdSet,
      totalStructures,
      dnaCodeToStructureIds
    ),
    ...computeEvaluationNotes(evaluationsActives, aggregation),
  };
};

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
  ) => Omit<Entry, keyof ControleQualitePeriodStat>,
  getPeriodContext?: (periodKey: string) => ControleQualiteSeriesContext
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
    .map((periodKey) => {
      const periodContext = getPeriodContext?.(periodKey) ?? context;

      return {
        ...mapPeriodKey(periodKey),
        ...computeControleQualitePeriodStat(
          eigsByPeriod.get(periodKey) ?? [],
          evaluationsByPeriod.get(periodKey) ?? [],
          periodContext.activeStructureIdSet,
          periodContext.totalStructures,
          periodContext.dnaCodeToStructureIds,
          periodContext.aggregation
        ),
      } as Entry;
    });
};

const buildSeriesContextForPeriod = (
  activeStructureIdSet: Set<number>,
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteSeriesContext => ({
  activeStructureIdSet,
  totalStructures: activeStructureIdSet.size,
  dnaCodeToStructureIds: buildDnaCodeToStructureIds(
    dnaLinks.filter(
      (link) =>
        link.structureId !== null &&
        activeStructureIdSet.has(link.structureId)
    )
  ),
  aggregation,
});

const buildSeriesContextForYear = (
  year: number,
  yearContext: StatistiquesYearContext,
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteSeriesContext =>
  buildSeriesContextForPeriod(
    getActiveStructureIdsForYear(yearContext, year),
    dnaLinks,
    aggregation
  );

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
  aggregation: NumericAggregation,
  yearContext: StatistiquesYearContext
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
      evaluations,
      seriesContext,
      toMonthKey,
      (monthKey) => ({ date: monthKeyToDate(monthKey) }),
      (monthKey) => {
        const { start, end } = getMonthPeriodBounds(monthKey);
        return buildSeriesContextForPeriod(
          getActiveStructureIdsForPeriod(yearContext, start, end),
          dnaLinks,
          aggregation
        );
      }
    ),
    byTrimester: computeControleQualiteByPeriod<ControleQualiteByTrimesterStat>(
      eigs,
      evaluations,
      seriesContext,
      toTrimesterKey,
      parseTrimesterKey,
      (trimesterKey) => {
        const { year, trimester } = parseTrimesterKey(trimesterKey);
        const { start, end } = getTrimesterPeriodBounds(year, trimester);
        return buildSeriesContextForPeriod(
          getActiveStructureIdsForPeriod(yearContext, start, end),
          dnaLinks,
          aggregation
        );
      }
    ),
    byYear: computeControleQualiteByPeriod<ControleQualiteByYearStat>(
      eigs,
      evaluations,
      seriesContext,
      toYearKey,
      (yearKey) => ({ year: Number(yearKey) }),
      (yearKey) =>
        buildSeriesContextForYear(
          Number(yearKey),
          yearContext,
          dnaLinks,
          aggregation
        )
    ),
  };
};
