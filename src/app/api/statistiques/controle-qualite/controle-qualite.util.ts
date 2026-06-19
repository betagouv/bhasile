import { CURRENT_YEAR } from "@/constants";
import { isEigComportementViolent } from "@/app/utils/eig.util";
import { toStatNumber, toStatRate } from "@/app/utils/statistiques-format.util";
import {
  aggregateValues,
  NumericAggregation,
  ratio,
} from "@/app/utils/math.util";
import {
  ControleQualiteByMonthStat,
  ControleQualiteByTrimesterStat,
  ControleQualiteByYearStat,
  ControleQualitePeriodStat,
  EigStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import {
  buildDnaCodeToStructureIds,
  getMonthKey,
  getTrimesterKey,
  getTwelveMonthCutoffKey,
  getYearKey,
  groupByPeriodKey,
  mergeSortedPeriodKeys,
  monthKeyToDate,
  parseTrimesterKey,
} from "../shared/shared.utils";
import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
} from "../statistiques.db.type";

const getStructureIdsFromEigs = (
  eigs: StatistiqueDbEig[],
  dnaCodeToStructureIds: Map<string, Set<number>>,
  activeStructureIds: Set<number>
): Set<number> => {
  const structureIds = new Set<number>();

  for (const eig of eigs) {
    if (!eig.dnaCode) {
      continue;
    }
    const linkedStructureIds = dnaCodeToStructureIds.get(eig.dnaCode);
    if (!linkedStructureIds) {
      continue;
    }
    for (const structureId of linkedStructureIds) {
      if (activeStructureIds.has(structureId)) {
        structureIds.add(structureId);
      }
    }
  }

  return structureIds;
};

const countEigs = (
  eigs: StatistiqueDbEig[]
): { nbEig: number; nbEigComportementViolent: number } => {
  let nbEigComportementViolent = 0;

  for (const eig of eigs) {
    if (eig.type && isEigComportementViolent(eig.type)) {
      nbEigComportementViolent += 1;
    }
  }

  return {
    nbEig: eigs.length,
    nbEigComportementViolent,
  };
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

const computeEigSummary = (
  eigs: StatistiqueDbEig[],
  totalPlacesAutorisees: number,
  evaluations: StatistiqueDbEvaluation[],
  activeStructureIds: Set<number>,
  aggregation: NumericAggregation
): EigStat => {
  const cutoff = getTwelveMonthCutoffKey();
  const recentEigs = eigs.filter(
    (eig) =>
      eig.evenementDate && getMonthKey(new Date(eig.evenementDate)) >= cutoff
  );
  const { nbEig, nbEigComportementViolent } = countEigs(recentEigs);
  const evaluationsCurrentYear = filterEvaluationsForYear(
    evaluations,
    activeStructureIds,
    CURRENT_YEAR
  );

  return {
    tauxEig: toStatRate(
      totalPlacesAutorisees > 0 ? nbEig / totalPlacesAutorisees : null
    ),
    nbEig,
    nbEigComportementViolent,
    tauxEigComportementViolent: toStatRate(
      ratio(nbEigComportementViolent, nbEig)
    ),
    moyenneEvaluationsCurrentYear: toStatNumber(
      aggregateValues(
        evaluationsCurrentYear.map((evaluation) => evaluation.note),
        aggregation
      )
    ),
  };
};

const computeEvaluationNotes = (
  evaluations: StatistiqueDbEvaluation[],
  aggregation: NumericAggregation
): Pick<
  ControleQualitePeriodStat,
  | "nbStructuresEvaluees"
  | "noteGenerale"
  | "notePersonne"
  | "notePro"
  | "noteStructure"
> => {
  const structureIds = new Set(
    evaluations
      .map((evaluation) => evaluation.structureId)
      .filter((structureId): structureId is number => structureId !== null)
  );

  return {
    nbStructuresEvaluees: structureIds.size,
    noteGenerale: toStatNumber(
      aggregateValues(
        evaluations.map((evaluation) => evaluation.note),
        aggregation
      )
    ),
    notePersonne: toStatNumber(
      aggregateValues(
        evaluations.map((evaluation) => evaluation.notePersonne),
        aggregation
      )
    ),
    notePro: toStatNumber(
      aggregateValues(
        evaluations.map((evaluation) => evaluation.notePro),
        aggregation
      )
    ),
    noteStructure: toStatNumber(
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
  const { nbEig, nbEigComportementViolent } = countEigs(eigsForPeriod);
  const structureIdsWithEig = getStructureIdsFromEigs(
    eigsForPeriod,
    dnaCodeToStructureIds,
    activeStructureIdSet
  );
  const nbStructuresSansDeclarationEig =
    totalStructures - structureIdsWithEig.size;

  return {
    nbStructuresSansDeclarationEig,
    partStructuresSansDeclarationEig: toStatRate(
      ratio(nbStructuresSansDeclarationEig, totalStructures)
    ),
    nbEig,
    nbEigComportementViolent,
    tauxEigComportementViolent: toStatRate(
      ratio(nbEigComportementViolent, nbEig)
    ),
    ...computeEvaluationNotes(evaluationsForPeriod, aggregation),
  };
};

type ControleQualiteSeriesContext = {
  activeStructureIdSet: Set<number>;
  totalStructures: number;
  dnaCodeToStructureIds: Map<string, Set<number>>;
  aggregation: NumericAggregation;
};

const computeControleQualiteByPeriod = <Entry extends ControleQualitePeriodStat>(
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  context: ControleQualiteSeriesContext,
  getPeriodKey: (date: Date) => string,
  mapPeriodKey: (periodKey: string) => Omit<Entry, keyof ControleQualitePeriodStat>
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

  return mergeSortedPeriodKeys(eigsByPeriod, evaluationsByPeriod).map(
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

const computeControleQualiteByMonth = (
  activeStructureIds: number[],
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteByMonthStat[] =>
  computeControleQualiteByPeriod(
    eigs,
    evaluations,
    buildSeriesContext(activeStructureIds, dnaLinks, aggregation),
    getMonthKey,
    (monthKey) => ({ date: monthKeyToDate(monthKey) })
  );

const computeControleQualiteByTrimester = (
  activeStructureIds: number[],
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteByTrimesterStat[] =>
  computeControleQualiteByPeriod(
    eigs,
    evaluations,
    buildSeriesContext(activeStructureIds, dnaLinks, aggregation),
    getTrimesterKey,
    (trimesterKey) => parseTrimesterKey(trimesterKey)
  );

const computeControleQualiteByYear = (
  activeStructureIds: number[],
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteByYearStat[] =>
  computeControleQualiteByPeriod(
    eigs,
    evaluations,
    buildSeriesContext(activeStructureIds, dnaLinks, aggregation),
    getYearKey,
    (yearKey) => ({ year: Number(yearKey) })
  );

export const computeControleQualiteStatistiques = (
  activeStructureIds: number[],
  totalPlacesAutorisees: number,
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): StatistiqueApiRead["controleQualite"] => {
  const activeStructureIdSet = new Set(activeStructureIds);

  return {
    aggregation,
    eig: computeEigSummary(
      eigs,
      totalPlacesAutorisees,
      evaluations,
      activeStructureIdSet,
      aggregation
    ),
    byMonth: computeControleQualiteByMonth(
      activeStructureIds,
      eigs,
      evaluations,
      dnaLinks,
      aggregation
    ),
    byTrimester: computeControleQualiteByTrimester(
      activeStructureIds,
      eigs,
      evaluations,
      dnaLinks,
      aggregation
    ),
    byYear: computeControleQualiteByYear(
      activeStructureIds,
      eigs,
      evaluations,
      dnaLinks,
      aggregation
    ),
  };
};
