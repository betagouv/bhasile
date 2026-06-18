import { NumericAggregation } from "@/app/utils/math.util";

export const parseNumericAggregation = (
  aggregationParam: string | null
): NumericAggregation =>
  aggregationParam === "mediane" ? "mediane" : "moyenne";
