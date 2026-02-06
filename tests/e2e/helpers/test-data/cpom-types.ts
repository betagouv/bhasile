/**
 * Test data types for CPOM e2e tests
 */

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
  /** Structure IDs to select (from the list). If "all", select all. */
  structureIds?: number[] | "all";
};

/** Finance table values per year (cpomMillesimes) */
export type TestCpomFinanceData = Record<
  number,
  {
    dotationDemandee?: number;
    dotationAccordee?: number;
    cumulResultatNet?: number;
    repriseEtat?: number;
    affectationReservesFondsDedies?: number;
    reserveInvestissement?: number;
    chargesNonReconductibles?: number;
    reserveCompensationDeficits?: number;
    reserveCompensationBFR?: number;
    reserveCompensationAmortissements?: number;
    fondsDedies?: number;
    reportANouveau?: number;
    autre?: number;
    commentaire?: string;
  }
>;
