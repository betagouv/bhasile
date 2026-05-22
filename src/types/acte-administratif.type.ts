export const ActeAdministratifCategory = [
  "ARRETE_AUTORISATION",
  "CONVENTION",
  "ARRETE_TARIFICATION",
  "FRAIS_DE_SIEGE",
  "RAPPORT_ACTIVITE_OPERATEUR",
  "AUTRE",
  "CPOM",
] as const;

export type ActeAdministratifCategory =
  (typeof ActeAdministratifCategory)[number];
