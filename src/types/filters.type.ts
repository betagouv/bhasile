export const GLOBAL_FILTER_KEYS = [
  "departements",
  "operateurs",
  "types",
] as const;

export type GlobalFilterKey = (typeof GLOBAL_FILTER_KEYS)[number];

export type Filters = Record<GlobalFilterKey, string | null>;
