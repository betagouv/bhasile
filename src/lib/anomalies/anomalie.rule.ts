import type { AnomalieContext } from "@/lib/anomalies/anomalie.type";
import type { AnomalieCode } from "@/types/anomalie.type";

export type DetectedAnomalie = {
  code: AnomalieCode;
  year: number;
  targetId: number;
};

export type AnomalieOptions = {
  currentYear: number;
};

export type AnomalieRule<
  K extends keyof AnomalieContext = keyof AnomalieContext,
> = {
  code: AnomalieCode;
  requires: readonly K[];
  evaluates: (
    context: Required<Pick<AnomalieContext, K>>,
    options: AnomalieOptions
  ) => Omit<DetectedAnomalie, "code">[];
};

export const defineRule = <K extends keyof AnomalieContext>(
  rule: AnomalieRule<K>
): AnomalieRule => rule as unknown as AnomalieRule;
