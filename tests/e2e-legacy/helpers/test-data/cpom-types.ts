/**
 * Test data types for CPOM e2e tests
 */

import { StructureType } from "@/types/structure.type";

import { FinanceValue } from "./types";

export type TestCpomAjoutData = {
  granularity: "DEPARTEMENTALE" | "INTERDEPARTEMENTALE" | "REGIONALE";
  region: string;
  departements: string | string[]; // single departement numero for DEPARTEMENTALE, or array for others
  operateur: {
    name: string;
    searchTerm: string;
    id: number;
  };
  actesAdministratifs: Array<{
    startDate: string;
    endDate: string;
    filePath: string;
  }>;
  avenants: Array<{
    date: string;
    endDate?: string;
    filePath: string;
  }>;
  /** Structure IDs to select (from the list). "all" = select all, "seeded" = only the structure seeded by beforeFlow (e.g. cada1). */
  structureIds?: number[] | "all" | "seeded";
};

export type TestCpomFinanceLineData = {
  dotationDemandee?: FinanceValue;
  dotationAccordee?: FinanceValue;
  totalProduitsProposes?: FinanceValue;
  totalProduits?: FinanceValue;
  totalChargesProposees?: FinanceValue;
  totalCharges?: FinanceValue;
  repriseEtat?: FinanceValue;
  excedentRecupere?: FinanceValue;
  excedentDeduit?: FinanceValue;
  affectationReservesFondsDedies?: FinanceValue;
  reserveInvestissement?: FinanceValue;
  chargesNonReconductibles?: FinanceValue;
  reserveCompensationDeficits?: FinanceValue;
  reserveCompensationBFR?: FinanceValue;
  reserveCompensationAmortissements?: FinanceValue;
  fondsDedies?: FinanceValue;
  reportANouveau?: FinanceValue;
  autre?: FinanceValue;
  commentaire?: string;
};

/** Finance table values by structure type and year (cpomMillesimes) */
export type TestCpomFinanceData = Partial<
  Record<StructureType, Record<number, TestCpomFinanceLineData>>
>;
