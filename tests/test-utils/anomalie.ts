import { TEST_CURRENT_YEAR } from "tests/test-utils/factories/anomalie-context.factory";

import { computeAnomalies } from "@/lib/anomalies/anomalie.compute";
import type { AnomalieContext } from "@/lib/anomalies/anomalie.context.type";
import type { AnomalieCode } from "@/types/anomalie.type";

export const detectionsOf = (
  code: AnomalieCode,
  context: AnomalieContext,
  currentYear: number = TEST_CURRENT_YEAR
): { year: number; targetId: number }[] =>
  computeAnomalies(context, { currentYear })
    .detected.filter((detectee) => detectee.code === code)
    .map(({ year, targetId }) => ({ year, targetId }));
