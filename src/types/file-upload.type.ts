export const ActeAdministratifCategory = [
  "ARRETE_AUTORISATION",
  "CPOM",
  "CONVENTION",
  "ARRETE_TARIFICATION",
  "INSPECTION_CONTROLE",
  "EVALUATION",
  "AUTRE",
] as const;

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

export const FileUploadCategory = [
  ...ActeAdministratifCategory,
  ...DocumentFinancierCategory,
] as const;

export const DocumentFinancierGranularity = [
  "STRUCTURE",
  "CPOM",
  "STRUCTURE_ET_CPOM",
] as const;

export type ActeAdministratifCategoryType = typeof ActeAdministratifCategory;

export type DocumentFinancierCategoryType = typeof DocumentFinancierCategory;

export type FileUploadCategoryType = typeof FileUploadCategory;

export type DocumentFinancierGranularityType =
  typeof DocumentFinancierGranularity;
