import { isEigComportementViolent } from "@/app/utils/eig.util";
import {
  aggregateValues,
  NumericAggregation,
  ratio,
} from "@/app/utils/math.util";
import { toStatNumber, toStatRate } from "@/app/utils/statistiques-format.util";
import { CURRENT_YEAR } from "@/constants";
import {
  ControleQualiteByMonthStat,
  ControleQualiteByTrimesterStat,
  ControleQualiteByYearStat,
  ControleQualitePeriodStat,
  EigStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
} from "../statistiques.db.type";

const toMonthKey = (date: Date): string => date.toISOString().slice(0, 7);

const toYearKey = (date: Date): string => date.toISOString().slice(0, 4);

const toTrimesterKey = (date: Date): string => {
  const month = Number(date.toISOString().slice(5, 7));
  const year = date.toISOString().slice(0, 4);
  return `${year}-Q${Math.ceil(month / 3)}`;
};

const parseTrimesterKey = (
  trimesterKey: string
): { year: number; trimester: number } => {
  const [year, trimesterPart] = trimesterKey.split("-Q");
  return { year: Number(year), trimester: Number(trimesterPart) };
};

const getTwelveMonthCutoffKey = (): string => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  return toMonthKey(twelveMonthsAgo);
};

const buildDnaCodeToStructureIds = (
  dnaLinks: StatistiqueDbDnaLink[]
): Map<string, Set<number>> => {
  const dnaCodeToStructureIds = new Map<string, Set<number>>();

  for (const link of dnaLinks) {
    if (link.structureId === null) {
      continue;
    }
    const structureIds =
      dnaCodeToStructureIds.get(link.dna.code) ?? new Set<number>();
    structureIds.add(link.structureId);
    dnaCodeToStructureIds.set(link.dna.code, structureIds);
  }

  return dnaCodeToStructureIds;
};

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
      eig.evenementDate && toMonthKey(new Date(eig.evenementDate)) >= cutoff
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

  return [
    ...new Set([
      ...eigsByPeriod.keys(),
      ...evaluationsByPeriod.keys(),
    ]),
  ]
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
    aggregation,
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
      (monthKey) => ({ date: new Date(`${monthKey}-01`) })
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
