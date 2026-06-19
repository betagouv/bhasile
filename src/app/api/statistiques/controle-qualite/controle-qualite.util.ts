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
  EigStat,
  StatistiqueApiRead,
} from "@/schemas/api/statistique.schema";

import {
  buildDnaCodeToStructureIds,
  getMonthKey,
  getTwelveMonthCutoffKey,
  groupByMonthKey,
  mergeSortedMonthKeys,
  monthKeyToDate,
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

const computeEvaluationNotesForMonth = (
  evaluations: StatistiqueDbEvaluation[],
  aggregation: NumericAggregation
) => {
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

const computeControleQualiteByMonth = (
  activeStructureIds: number[],
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): ControleQualiteByMonthStat[] => {
  const activeStructureIdSet = new Set(activeStructureIds);
  const totalStructures = activeStructureIds.length;
  const dnaCodeToStructureIds = buildDnaCodeToStructureIds(dnaLinks);
  const eigsByMonth = groupByMonthKey(eigs, (eig) => eig.evenementDate);
  const evaluationsByMonth = groupByMonthKey(
    evaluations,
    (evaluation) => evaluation.date
  );

  return mergeSortedMonthKeys(eigsByMonth, evaluationsByMonth).map(
    (monthKey) => {
      const eigsForMonth = eigsByMonth.get(monthKey) ?? [];
      const evaluationsForMonth = evaluationsByMonth.get(monthKey) ?? [];
      const { nbEig, nbEigComportementViolent } = countEigs(eigsForMonth);
      const structureIdsWithEig = getStructureIdsFromEigs(
        eigsForMonth,
        dnaCodeToStructureIds,
        activeStructureIdSet
      );
      const nbStructuresSansDeclarationEig =
        totalStructures - structureIdsWithEig.size;
      const partSansDeclaration = ratio(
        nbStructuresSansDeclarationEig,
        totalStructures
      );

      return {
        date: monthKeyToDate(monthKey),
        nbStructuresSansDeclarationEig,
        partStructuresSansDeclarationEig: toStatRate(partSansDeclaration),
        nbEig,
        nbEigComportementViolent,
        tauxEigComportementViolent: toStatRate(
          ratio(nbEigComportementViolent, nbEig)
        ),
        ...computeEvaluationNotesForMonth(evaluationsForMonth, aggregation),
      };
    }
  );
};

export const computeControleQualiteStatistiques = (
  activeStructureIds: number[],
  totalPlacesAutorisees: number,
  eigs: StatistiqueDbEig[],
  evaluations: StatistiqueDbEvaluation[],
  dnaLinks: StatistiqueDbDnaLink[],
  aggregation: NumericAggregation
): StatistiqueApiRead["controleQualite"] => ({
  aggregation,
  eig: computeEigSummary(
    eigs,
    totalPlacesAutorisees,
    evaluations,
    new Set(activeStructureIds),
    aggregation
  ),
  byMonth: computeControleQualiteByMonth(
    activeStructureIds,
    eigs,
    evaluations,
    dnaLinks,
    aggregation
  ),
});
