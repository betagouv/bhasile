export const ActeAdministratifCategory = [
  "ARRETE_AUTORISATION",
  "CONVENTION",
  "ARRETE_TARIFICATION",
  "INSPECTION_CONTROLE",
  "EVALUATION",
  "AUTRE",
] as const;

export type ActeAdministratifCategoryType = typeof ActeAdministratifCategory;
