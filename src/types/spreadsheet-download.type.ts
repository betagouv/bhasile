import { BudgetApiType } from "@/schemas/api/budget.schema";
import { IndicateurFinancierApiType } from "@/schemas/api/indicateurFinancier.schema";

export type SheetOption<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> = {
  sheetName: string;
  data: TRecord[];
  headersMap: Record<string, string>;
  emptyMessage?: string;
};

export type DownloadOptions<
  TRecord extends Record<string, unknown> = Record<string, unknown>,
> = {
  fileName: string;
  sheetName?: string;
  data?: TRecord[];
  headersMap?: Record<string, string>;
  emptyMessage?: string;
  sheets?: SheetOption[];
};

export type CombinedFinancialData = Partial<IndicateurFinancierApiType> &
  Partial<BudgetApiType> & {
    year: number;
    resultatNet?: number;
    resultatNetProposeParOperateur?: number;
  };
