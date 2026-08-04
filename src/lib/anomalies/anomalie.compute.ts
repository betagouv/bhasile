import type { AnomalieContexte } from "@/lib/anomalies/anomalie.contexte";
import type {
  AnomalieDetectee,
  AnomalieOptions,
} from "@/lib/anomalies/anomalie.regle";
import { REGLES_ANOMALIES } from "@/lib/anomalies/regles";
import type { AnomalieCode } from "@/types/anomalie.type";

export const computeAnomalies = (
  contexte: AnomalieContexte,
  options: AnomalieOptions
): ResultatCalculAnomalies => {
  const detectees: AnomalieDetectee[] = [];
  const codesEvalues: AnomalieCode[] = [];

  for (const regle of REGLES_ANOMALIES) {
    if (!regle.requiert.every((tranche) => contexte[tranche] !== undefined)) {
      continue;
    }

    codesEvalues.push(regle.code);
    for (const detection of regle.evalue(
      contexte as Required<AnomalieContexte>,
      options
    )) {
      detectees.push({ code: regle.code, ...detection });
    }
  }

  return { detectees, codesEvalues };
};

// `codesEvalues` est indispensable à la réconciliation : sans lui, une règle non évaluée
// faute de données est indiscernable d'une règle évaluée sans anomalie, et la suppression
// détruirait des anomalies légitimes ainsi que leurs justifications.
export type ResultatCalculAnomalies = {
  detectees: AnomalieDetectee[];
  codesEvalues: AnomalieCode[];
};
