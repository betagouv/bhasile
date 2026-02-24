/**
 * Test data types for CPOM e2e tests
 */

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

/** Finance table values per year (cpomMillesimes) */
export type TestCpomFinanceData = Record<
  number,
  {
    dotationDemandee?: FinanceValue;
    dotationAccordee?: FinanceValue;
    cumulResultatNet?: FinanceValue;
    repriseEtat?: FinanceValue;
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
  }
>;
