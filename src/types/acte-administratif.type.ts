export const ActeAdministratifCategory = [
  "ARRETE_AUTORISATION",
  "ARRETE_FUSION",
  "CONVENTION",
  "ARRETE_TARIFICATION",
  "RAPPORT_ACTIVITE_OPERATEUR",
  "FRAIS_DE_SIEGE",
  "STATUTS",
  "AUTRE",
  "CPOM",
] as const;

export type ActeAdministratifCategory =
  (typeof ActeAdministratifCategory)[number];
