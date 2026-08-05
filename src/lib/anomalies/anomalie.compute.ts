import type { AnomalieContext } from "@/lib/anomalies/anomalie.context";
import type {
  AnomalieOptions,
  DetectedAnomalie,
} from "@/lib/anomalies/anomalie.rule";
import { ANOMALIE_RULES } from "@/lib/anomalies/rules";
import type { AnomalieCode } from "@/types/anomalie.type";

export const computeAnomalies = (
  context: AnomalieContext,
  options: AnomalieOptions
): AnomalieComputeResult => {
  const detected: DetectedAnomalie[] = [];
  const evaluatedCodes: AnomalieCode[] = [];

  for (const rule of ANOMALIE_RULES) {
    if (!rule.requires.every((slice) => context[slice] !== undefined)) {
      continue;
    }

    evaluatedCodes.push(rule.code);
    for (const detection of rule.evaluates(
      context as Required<AnomalieContext>,
      options
    )) {
      detected.push({ code: rule.code, ...detection });
    }
  }

  return { detected, evaluatedCodes };
};

// `evaluatedCodes` est indispensable à la réconciliation : sans lui, une règle non évaluée
// faute de données est indiscernable d'une règle évaluée sans anomalie, et la suppression
// détruirait des anomalies légitimes ainsi que leurs justifications.
export type AnomalieComputeResult = {
  detected: DetectedAnomalie[];
  evaluatedCodes: AnomalieCode[];
};
