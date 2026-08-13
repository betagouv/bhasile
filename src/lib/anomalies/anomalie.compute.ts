import type {
  AnomalieOptions,
  DetectedAnomalie,
} from "@/lib/anomalies/anomalie.rule";
import type { AnomalieContext } from "@/lib/anomalies/anomalie.type";
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

// evaluatedCodes est indispensable pour ne cibler que les anomalies réellement évaluées
export type AnomalieComputeResult = {
  detected: DetectedAnomalie[];
  evaluatedCodes: AnomalieCode[];
};
