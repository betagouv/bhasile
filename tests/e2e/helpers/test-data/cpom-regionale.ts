import { TestCpomAjoutData, TestCpomFinanceData } from "./cpom-types";

/**
 * Valid régionale CPOM test case.
 * No avenant. Different finance fields (dotationDemandee, dotationAccordee, commentaire).
 * Requires at least one structure (e.g. C1234 from cada1) to be seeded.
 */
export const cpomRegionale: {
  name: string;
  formData: TestCpomAjoutData;
  financeData: TestCpomFinanceData;
} = {
  name: "CPOM régional - Île-de-France, pas d'avenant, finance",
  formData: {
    granularity: "REGIONALE",
    region: "Île-de-France",
    departements: [],
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
    avenants: [],
    structureIds: "all",
  },
  financeData: {
    2024: {
      dotationDemandee: 200000,
      dotationAccordee: 190000,
      commentaire: "Régionale 2024",
    },
    2025: {
      dotationDemandee: 210000,
      dotationAccordee: 200000,
      commentaire: "Régionale 2025",
    },
  },
};
