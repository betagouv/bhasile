import { TestCpomAjoutData, TestCpomFinanceData } from "./cpom-types";

/**
 * Valid interdépartementale CPOM test case.
 * No avenant. Different finance fields (cumulResultatNet, repriseEtat, affectationReservesFondsDedies).
 * Requires at least one structure (e.g. C1234 from cada1) to be seeded.
 * Departements: left to form default (all departements of region) or we could select 75, 92.
 */
export const cpomInterdepartementale: {
  name: string;
  formData: TestCpomAjoutData;
  financeData: TestCpomFinanceData;
} = {
  name: "CPOM interdépartemental - Île-de-France, pas d'avenant, finance",
  formData: {
    granularity: "INTERDEPARTEMENTALE",
    region: "Île-de-France",
    departements: ["75", "92"],
    operateur: {
      name: "Opérateur 1",
      searchTerm: "Opér",
      id: 1,
    },
    actesAdministratifs: [
      {
        startDate: "2024-06-01",
        endDate: "2025-12-31",
        filePath: "tests/e2e/fixtures/sample.pdf",
      },
    ],
    avenants: [],
    structureIds: "all",
  },
  financeData: {
    2024: {
      cumulResultatNet: -5000,
      repriseEtat: 2000,
      affectationReservesFondsDedies: 1000,
    },
    2025: {
      cumulResultatNet: 3000,
      repriseEtat: 1500,
      affectationReservesFondsDedies: 500,
    },
  },
};
