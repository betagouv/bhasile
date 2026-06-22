export const roundStatsNumber = (value: number | null): number | null =>
  value == null ? null : Number(value.toFixed(1));

export const roundStatsRate = (value: number | null): number | null =>
  value == null ? null : Number(value.toFixed(3));
