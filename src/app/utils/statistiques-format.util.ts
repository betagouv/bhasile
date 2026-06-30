const STATS_RATE_SIGNIFICANT_DIGITS = 3;

export const roundStatsNumber = (value: number | null): number | null =>
  value == null ? null : Number(value.toFixed(1));

/** Arrondi à 3 chiffres significatifs (ex. 0,000012345 → 0,0000123 ; 0,12345 → 0,123). */
export const roundStatsRate = (value: number | null): number | null => {
  if (value == null) {
    return null;
  }
  if (value === 0) {
    return 0;
  }

  return Number(value.toPrecision(STATS_RATE_SIGNIFICANT_DIGITS));
};
