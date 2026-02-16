export const ActeAdministratifCategory = [
  "ARRETE_AUTORISATION",
  "CONVENTION",
  "ARRETE_TARIFICATION",
  "AUTRE",
] as const;

export type ActeAdministratifCategory =
  (typeof ActeAdministratifCategory)[number];
