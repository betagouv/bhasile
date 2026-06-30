import { roundTo } from "./math.util";

export const roundStatsNumber = (value: number | null): number | null =>
  value == null ? null : roundTo(value, 1);

export const roundStatsRate = (value: number | null): number | null =>
  value == null ? null : roundTo(value, 3);
