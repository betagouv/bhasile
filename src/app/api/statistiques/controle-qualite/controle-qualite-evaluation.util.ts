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
  StatistiquesContext,
  StatistiquesPeriodGranularity,
} from "../statistiques.db.type";
import {
  computeTotalPlaces,
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
import {
  buildDnaCodeToStructureIds,
  computeEigPeriodMetrics,
  computeEigRates,
  filterRecentEigs,
} from "./controle-qualite-eig.util";

type SeriesContext = {
  activeStructureIdSet: Set<number>;
  totalStructures: number;
  dnaCodeToStructureIds: Map<string, Set<number>>;
  aggregation: NumericAggregation;
};

type PeriodSeriesConfig<Entry extends ControleQualitePeriodStat> = {
  granularity: StatistiquesPeriodGranularity;
  toPeriodKey: (date: Date) => string;
  toEntryMeta: (
    periodKey: string
  ) => Omit<Entry, keyof ControleQualitePeriodStat>;
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

const computePeriodStat = (
  eigsForPeriod: StatistiqueDbEig[],
  evaluationsForPeriod: StatistiqueDbEvaluation[],
  seriesContext: SeriesContext
): ControleQualitePeriodStat => {
  const evaluationsActives = evaluationsForPeriod.filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      seriesContext.activeStructureIdSet.has(evaluation.structureId)
  );

  return {
    ...computeEigPeriodMetrics(
      eigsForPeriod,
      seriesContext.activeStructureIdSet,
      seriesContext.totalStructures,
      seriesContext.dnaCodeToStructureIds
    ),
    ...computeEvaluationNotes(evaluationsActives, seriesContext.aggregation),
  };
};

const buildSeriesContext = (
  activeStructureIdSet: Set<number>,
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): SeriesContext => ({
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

const buildSeriesContextForPeriod = (
  context: StatistiquesContext,
  granularity: StatistiquesPeriodGranularity,
  periodKey: string,
  aggregation: NumericAggregation
): SeriesContext =>
  buildSeriesContext(
    lookupActiveStructureIds(
      context.activeStructureIdsByPeriod,
      granularity,
      periodKey
    ),
    context.dnaLinks,
    aggregation
  );

const computePeriodSeries = <Entry extends ControleQualitePeriodStat>(
  context: StatistiquesContext,
  globalContext: SeriesContext,
  config: PeriodSeriesConfig<Entry>
): Entry[] => {
  const { eigs, evaluations } = context;
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
      const periodContext = buildSeriesContextForPeriod(
        context,
        config.granularity,
        periodKey,
        globalContext.aggregation
      );

      return {
        ...config.toEntryMeta(periodKey),
        ...computePeriodStat(
          eigsByPeriod.get(periodKey) ?? [],
          evaluationsByPeriod.get(periodKey) ?? [],
          periodContext
        ),
      } as Entry;
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
  const activeStructureIdSet = new Set(
    structuresWithTypologie.map((structure) => structure.id)
  );
  const evaluationsActives = evaluations.filter(
    (evaluation) =>
      evaluation.structureId !== null &&
      activeStructureIdSet.has(evaluation.structureId)
  );
  const seriesContext = buildSeriesContext(
    activeStructureIdSet,
    context.dnaLinks,
    aggregation
  );

  return {
    eig: computeEigSummary(
      eigs,
      computeTotalPlaces(structuresWithTypologie, typologieMap),
      evaluationsActives,
      activeStructureIdSet,
      aggregation
    ),
    byMonth: computePeriodSeries<ControleQualiteByMonthStat>(
      context,
      seriesContext,
      {
        granularity: "month",
        toPeriodKey: toMonthKey,
        toEntryMeta: (monthKey) => ({ date: monthKeyToDate(monthKey) }),
      }
    ),
    byTrimester: computePeriodSeries<ControleQualiteByTrimesterStat>(
      context,
      seriesContext,
      {
        granularity: "trimester",
        toPeriodKey: toTrimesterKey,
        toEntryMeta: parseTrimesterKey,
      }
    ),
    byYear: computePeriodSeries<ControleQualiteByYearStat>(
      context,
      seriesContext,
      {
        granularity: "year",
        toPeriodKey: toYearKey,
        toEntryMeta: (yearKey) => ({ year: Number(yearKey) }),
      }
    ),
  };
};
