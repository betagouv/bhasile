import { roundTo } from "./math.util";

const STATS_RATE_SIGNIFICANT_DIGITS = 3;

export const roundStatsNumber = (value: number | null): number | null =>
  value == null ? null : roundTo(value, 1);

/** Arrondi à 3 chiffres significatifs */
export const roundStatsRate = (value: number | null): number | null => {
  if (value == null) {
    return null;
  }
  if (value === 0) {
    return 0;
  }

  return Number(value.toPrecision(STATS_RATE_SIGNIFICANT_DIGITS));
};
