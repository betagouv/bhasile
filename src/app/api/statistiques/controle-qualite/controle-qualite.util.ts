import { average } from "@/app/utils/math.util";
import {
  EigMonthStat,
  EigStat,
  EvaluationMonthStat,
  EvaluationStat,
} from "@/schemas/api/statistique.schema";

import {
  getMonthKey,
  getMonthKeysFromDates,
  monthKeyToDate,
} from "../shared/monthly.util";
import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
} from "../shared/db.type";

export const isEigComportementViolent = (type: string): boolean =>
  type.toLowerCase().includes("comportement violent");

export const computeEigByMonth = (eigs: StatistiqueDbEig[]): EigMonthStat[] => {
  const byMonth = new Map<
    string,
    { nbComportementViolent: number; nbAutres: number }
  >();

  for (const eig of eigs) {
    if (!eig.evenementDate) {
      continue;
    }
    const key = getMonthKey(new Date(eig.evenementDate));
    const current = byMonth.get(key) ?? {
      nbComportementViolent: 0,
      nbAutres: 0,
    };
    if (isEigComportementViolent(eig.type)) {
      current.nbComportementViolent += 1;
    } else {
      current.nbAutres += 1;
    }
    byMonth.set(key, current);
  }

  return getMonthKeysFromDates(
    eigs
      .map((eig) => eig.evenementDate)
      .filter((date): date is Date => date !== null)
      .map((date) => new Date(date))
  ).map((key) => {
    const stats = byMonth.get(key) ?? {
      nbComportementViolent: 0,
      nbAutres: 0,
    };
    return {
      date: monthKeyToDate(key),
      nbComportementViolent: stats.nbComportementViolent,
      nbAutres: stats.nbAutres,
      nbTotal: stats.nbComportementViolent + stats.nbAutres,
    };
  });
};

export const computeEigSummary = (
  eigByMonth: EigMonthStat[],
  eigs: StatistiqueDbEig[],
  dnaLinks: StatistiqueDbDnaLink[],
  structureIds: number[],
  totalPlaces: number
): EigStat => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  const cutoff = getMonthKey(twelveMonthsAgo);

  const recentMonths = eigByMonth.filter(
    (monthStat) => getMonthKey(monthStat.date) >= cutoff
  );
  const nbComportementViolent = recentMonths.reduce(
    (acc, monthStat) => acc + monthStat.nbComportementViolent,
    0
  );
  const nbAutres = recentMonths.reduce(
    (acc, monthStat) => acc + monthStat.nbAutres,
    0
  );
  const nbTotal = nbComportementViolent + nbAutres;

  const recentEigs = eigs.filter(
    (eig) =>
      eig.evenementDate &&
      getMonthKey(new Date(eig.evenementDate)) >= cutoff
  );
  const dnaCodesWithEig = new Set(recentEigs.map((eig) => eig.dnaCode));
  const structureIdsWithEig = new Set<number>();

  for (const link of dnaLinks) {
    if (link.structureId !== null && dnaCodesWithEig.has(link.dna.code)) {
      structureIdsWithEig.add(link.structureId);
    }
  }

  return {
    pour1000PlacesSur12Mois:
      totalPlaces > 0 ? (nbTotal / totalPlaces) * 1000 : null,
    tauxComportementViolent:
      nbTotal > 0 ? nbComportementViolent / nbTotal : null,
    nbComportementViolent,
    nbAutres,
    nbStructuresSansDeclaration:
      structureIds.length - structureIdsWithEig.size,
  };
};

const computeEvaluationStatFromList = (
  evaluations: StatistiqueDbEvaluation[]
): EvaluationStat => {
  const structureIds = new Set(
    evaluations
      .map((evaluation) => evaluation.structureId)
      .filter((id): id is number => id !== null)
  );

  return {
    nbEvaluations: evaluations.length,
    nbStructuresEvaluees: structureIds.size,
    moyenneGenerale: average(evaluations.map((evaluation) => evaluation.note)),
    moyennePersonne: average(
      evaluations.map((evaluation) => evaluation.notePersonne)
    ),
    moyennePro: average(evaluations.map((evaluation) => evaluation.notePro)),
    moyenneStructure: average(
      evaluations.map((evaluation) => evaluation.noteStructure)
    ),
  };
};

export const computeEvaluationsByMonth = (
  evaluations: StatistiqueDbEvaluation[]
): EvaluationMonthStat[] => {
  const byMonth = new Map<string, StatistiqueDbEvaluation[]>();

  for (const evaluation of evaluations) {
    if (!evaluation.date) {
      continue;
    }
    const key = getMonthKey(new Date(evaluation.date));
    const list = byMonth.get(key) ?? [];
    list.push(evaluation);
    byMonth.set(key, list);
  }

  return getMonthKeysFromDates(
    evaluations
      .map((evaluation) => evaluation.date)
      .filter((date): date is Date => date !== null)
      .map((date) => new Date(date))
  ).map((key) => ({
    date: monthKeyToDate(key),
    ...computeEvaluationStatFromList(byMonth.get(key) ?? []),
  }));
};

export const computeEvaluationSummary = (
  evaluations: StatistiqueDbEvaluation[]
): EvaluationStat => computeEvaluationStatFromList(evaluations);

export const emptyEvaluationStat = (): EvaluationStat => ({
  nbEvaluations: 0,
  nbStructuresEvaluees: 0,
  moyenneGenerale: null,
  moyennePersonne: null,
  moyennePro: null,
  moyenneStructure: null,
});
