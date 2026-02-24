export const CpomGranularity = [
  "DEPARTEMENTALE",
  "INTERDEPARTEMENTALE",
  "REGIONALE",
] as const;

export type CpomGranularity = (typeof CpomGranularity)[number];
