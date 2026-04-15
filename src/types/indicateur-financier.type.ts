export const IndicateurFinancierType = ["PREVISIONNEL", "REALISE"] as const;

export type IndicateurFinancierType = (typeof IndicateurFinancierType)[number];
