import { aggregateValues, NumericAggregation } from "@/app/utils/math.util";
import { roundStatsNumber } from "@/app/utils/statistiques-format.util";
import { ControleQualiteEvaluationStat } from "@/schemas/api/statistique.schema";

import type { StatistiqueDbEvaluation } from "../statistiques.db.type";
import { filterByActiveStructureId } from "../statistiques.utils";

export const filterEvaluationsInScope = (
  evaluations: StatistiqueDbEvaluation[],
  activeStructureIds: Set<number>
): StatistiqueDbEvaluation[] =>
  filterByActiveStructureId(evaluations, activeStructureIds);

export const computeEvaluationGlobalSummary = (
  evaluations: StatistiqueDbEvaluation[],
  aggregation: NumericAggregation
): { moyenneEvaluationsLast12Months: number | null } => ({
  moyenneEvaluationsLast12Months: roundStatsNumber(
    aggregateValues(
      evaluations.map((evaluation) => evaluation.note),
      aggregation
    )
  ),
});

export const sumEvaluationNotes = (
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
