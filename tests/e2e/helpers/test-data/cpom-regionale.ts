import { StructureType } from "@/types/structure.type";

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
  modificationFormData: TestCpomAjoutData;
  modificationFinanceData: TestCpomFinanceData;
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
    [StructureType.CADA]: {
      2024: {
        dotationDemandee: 200000,
        dotationAccordee: 190000,
      },
      2025: {
        dotationDemandee: 210000,
        dotationAccordee: 200000,
      },
    },
    [StructureType.CAES]: {
      2024: {
        dotationDemandee: 200000,
        dotationAccordee: 190000,
      },
      2025: {
        dotationDemandee: 210000,
        dotationAccordee: 200000,
      },
    },
  },
  modificationFormData: {
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
        startDate: "2024-03-01",
        endDate: "2026-12-31",
        filePath: "tests/e2e/fixtures/sample.pdf",
      },
    ],
    avenants: [],
    structureIds: "all",
  },
  modificationFinanceData: {
    [StructureType.CADA]: {
      2024: {
        dotationDemandee: 230000,
        dotationAccordee: 220000,
        totalProduits: 300000,
        totalCharges: 295000,
        repriseEtat: 500,
      },
    },
    [StructureType.CAES]: {
      2024: {
        dotationDemandee: 180000,
        dotationAccordee: 175000,
        totalProduits: 250000,
        totalCharges: 245000,
        fondsDedies: 90,
      },
    },
    [StructureType.HUDA]: {
      2024: {
        dotationDemandee: 145000,
        dotationAccordee: 140000,
        totalProduits: 180000,
        totalCharges: 175000,
        excedentRecupere: 300,
        excedentDeduit: 200,
        fondsDedies: 150,
      },
    },
  },
};
