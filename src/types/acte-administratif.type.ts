export const ActeAdministratifCategory = [
  "ARRETE_AUTORISATION",
  "CONVENTION",
  "ARRETE_TARIFICATION",
  "FRAIS_DE_SIEGE",
  "STATUTS",
  "AUTRE",
  "CPOM",
] as const;

export type ActeAdministratifCategory =
  (typeof ActeAdministratifCategory)[number];
