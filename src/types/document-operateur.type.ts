export const DocumentOperateurCategory = [
  "RAPPORT_ACTIVITE",
  "FRAIS_DE_SIEGE",
  "STATUTS",
  "AUTRE",
] as const;

export type DocumentOperateurCategory =
  (typeof DocumentOperateurCategory)[number];
