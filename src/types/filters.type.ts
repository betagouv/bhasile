export const FILTER_KEYS = [
  "departements",
  "operateurs",
  "types",
] as const;

export type FilterKey = (typeof FILTER_KEYS)[number];

export type Filters = Record<FilterKey, string | null>;
