import { TestCpomAjoutData, TestCpomFinanceData } from "./cpom-types";

/**
 * Valid départementale CPOM test case.
 * Uses Opérateur 1, Île-de-France, 75. Requires at least one structure
 * (e.g. C1234 from cada1) to be seeded so the structures list is non-empty.
 *
 * - Main CPOM document: 2024-01-01 to 2025-12-31 + file
 * - Avenant that extends end date to 2026-12-31
 * - Select only the seeded structure (cada1)
 */
export const cpomDepartementale: {
  name: string;
  formData: TestCpomAjoutData;
  financeData: TestCpomFinanceData;
} = {
  name: "CPOM départemental - Île-de-France 75, avenant, structures, finance",
  formData: {
    granularity: "DEPARTEMENTALE",
    region: "Île-de-France",
    departements: "75",
    operateur: {
      name: "Opérateur 1",
      searchTerm: "Opér",
      id: 1,
    },
    actesAdministratifs: [
      {
        startDate: "2024-01-01",
        endDate: "2025-12-31",
        filePath: "tests/e2e/fixtures/sample.pdf",
      },
    ],
    avenants: [
      {
        date: "2025-06-01",
        endDate: "2026-12-31",
        filePath: "tests/e2e/fixtures/sample.csv",
      },
    ],
    structureIds: "seeded",
  },
  financeData: {
    2024: {
      dotationDemandee: 100000,
      dotationAccordee: 95000,
      cumulResultatNet: -2000,
      repriseEtat: 1000,
      reserveInvestissement: 5000,
      reportANouveau: 3000,
    },
    2025: {
      dotationDemandee: 105000,
      dotationAccordee: 100000,
      cumulResultatNet: 1500,
      repriseEtat: 500,
      reserveInvestissement: 4000,
      reportANouveau: 2500,
    },
    2026: {
      dotationDemandee: 110000,
      dotationAccordee: 105000,
      cumulResultatNet: 0,
      repriseEtat: 0,
      reserveInvestissement: 3000,
      reportANouveau: 2000,
    },
  },
};
