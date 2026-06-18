import { isEigComportementViolent } from "@/app/utils/eig.util";
import {
  aggregateValues,
  NumericAggregation,
} from "@/app/utils/math.util";
import {
  ControleQualiteByMonthStat,
  EigStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import {
  getMonthKey,
  monthKeyToDate,
} from "../shared/utils";
import type {
  StatistiqueDbDnaLink,
  StatistiqueDbEig,
  StatistiqueDbEvaluation,
} from "../shared/db.type";

const buildDnaCodeToStructureIds = (
  dnaLinks: StatistiqueDbDnaLink[]
): Map<string, Set<number>> => {
  const map = new Map<string, Set<number>>();

  for (const link of dnaLinks) {
    if (link.structureId === null) {
      continue;
    }
    const codes = map.get(link.dna.code) ?? new Set<number>();
    codes.add(link.structureId);
    map.set(link.dna.code, codes);
  }

  return map;
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

const getTwelveMonthCutoffKey = (): string => {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
  return getMonthKey(twelveMonthsAgo);
};

export const computeEigSummary = (
  eigs: StatistiqueDbEig[],
  totalPlacesAutorisees: number
): EigStat => {
  const cutoff = getTwelveMonthCutoffKey();
  const recentEigs = eigs.filter(
    (eig) =>
      eig.evenementDate &&
      getMonthKey(new Date(eig.evenementDate)) >= cutoff
  );
  const { nbEig, nbEigComportementViolent } = countEigs(recentEigs);

  return {
    eigPour1000PlacesAutorisees:
      totalPlacesAutorisees > 0 ? (nbEig / totalPlacesAutorisees) * 1000 : null,
    nbEig,
    nbEigComportementViolent,
  };
};

const computeEvaluationNotesForMonth = (
  evaluations: StatistiqueDbEvaluation[],
  aggregation: NumericAggregation
) => {
  const structureIds = new Set(
    evaluations
      .map((evaluation) => evaluation.structureId)
      .filter((id): id is number => id !== null)
  );

  return {
    nbStructuresEvaluees: structureIds.size,
    noteGenerale: aggregateValues(
      evaluations.map((evaluation) => evaluation.note),
      aggregation
    ),
    notePersonne: aggregateValues(
      evaluations.map((evaluation) => evaluation.notePersonne),
      aggregation
    ),
    notePro: aggregateValues(
      evaluations.map((evaluation) => evaluation.notePro),
      aggregation
    ),
    noteStructure: aggregateValues(
      evaluations.map((evaluation) => evaluation.noteStructure),
      aggregation
    ),
  };
};

export const computeControleQualiteByMonth = (
  activeStructureIds: number[],
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteByMonthStat[] => {
  const activeStructureIdSet = new Set(activeStructureIds);
  const totalStructures = activeStructureIds.length;
  const dnaCodeToStructureIds = buildDnaCodeToStructureIds(dnaLinks);

  const eigsByMonth = new Map<string, StatistiqueDbEig[]>();
  for (const eig of eigs) {
    if (!eig.evenementDate) {
      continue;
    }
    const key = getMonthKey(new Date(eig.evenementDate));
    const list = eigsByMonth.get(key) ?? [];
    list.push(eig);
    eigsByMonth.set(key, list);
  }

  const evaluationsByMonth = new Map<string, StatistiqueDbEvaluation[]>();
  for (const evaluation of evaluations) {
    if (!evaluation.date) {
      continue;
    }
    const key = getMonthKey(new Date(evaluation.date));
    const list = evaluationsByMonth.get(key) ?? [];
    list.push(evaluation);
    evaluationsByMonth.set(key, list);
  }

  const monthKeys = [
    ...new Set([...eigsByMonth.keys(), ...evaluationsByMonth.keys()]),
  ].sort();

  return monthKeys.map((key) => {
    const eigsForMonth = eigsByMonth.get(key) ?? [];
    const evaluationsForMonth = evaluationsByMonth.get(key) ?? [];
    const { nbEig, nbEigComportementViolent } = countEigs(eigsForMonth);
    const structureIdsWithEig = getStructureIdsFromEigs(
      eigsForMonth,
      dnaCodeToStructureIds,
      activeStructureIdSet
    );
    const nbStructuresSansDeclarationEig =
      totalStructures - structureIdsWithEig.size;

    return {
      date: monthKeyToDate(key),
      nbStructuresSansDeclarationEig,
      partStructuresSansDeclarationEig:
        totalStructures > 0
          ? (nbStructuresSansDeclarationEig / totalStructures) * 100
          : null,
      nbEig,
      nbEigComportementViolent,
      tauxEigComportementViolent:
        nbEig > 0 ? nbEigComportementViolent / nbEig : null,
      ...computeEvaluationNotesForMonth(evaluationsForMonth, aggregation),
    };
  });
};

export const computeControleQualiteStatistiques = (
  activeStructureIds: number[],
  totalPlacesAutorisees: number,
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): StatistiqueApiRead["controleQualite"] => {
  // TODO(fermeture): exclure les structures avec fermeture effective (filtre global périmètre)
  // TODO(actualisation): exposer updatedAt quand les formulaires d'actualisation seront disponibles

  return {
    aggregation,
    eig: computeEigSummary(eigs, totalPlacesAutorisees),
    byMonth: computeControleQualiteByMonth(
      activeStructureIds,
      eigs,
      evaluations,
      dnaLinks,
      aggregation
    ),
  };
};
