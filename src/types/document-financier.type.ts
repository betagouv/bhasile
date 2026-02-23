export const DocumentFinancierCategory = [
  "BUDGET_PREVISIONNEL_DEMANDE",
  "RAPPORT_BUDGETAIRE",
  "BUDGET_PREVISIONNEL_RETENU",
  "BUDGET_RECTIFICATIF",
  "COMPTE_ADMINISTRATIF_SOUMIS",
  "RAPPORT_ACTIVITE",
  "COMPTE_ADMINISTRATIF_RETENU",
  "DEMANDE_SUBVENTION",
  "COMPTE_RENDU_FINANCIER",
  "RAPPORT_ACTIVITE_OPERATEUR",
  "AUTRE_FINANCIER",
] as const;

export type DocumentFinancierCategory =
  (typeof DocumentFinancierCategory)[number];

export const DocumentFinancierGranularity = [
  "STRUCTURE",
  "CPOM",
  "STRUCTURE_ET_CPOM",
] as const;

export type DocumentFinancierGranularity =
  (typeof DocumentFinancierGranularity)[number];
