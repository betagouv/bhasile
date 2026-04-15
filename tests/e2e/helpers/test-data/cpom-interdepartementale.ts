import { StructureType } from "@/types/structure.type";

import { TestCpomAjoutData, TestCpomFinanceData } from "./cpom-types";

/**
 * Valid interdépartementale CPOM test case.
 * No avenant. Different finance fields (repriseEtat, affectationReservesFondsDedies).
 * Requires at least one structure (e.g. C1234 from cada1) to be seeded.
 * Departements: left to form default (all departements of region) or we could select 75, 92.
 */
export const cpomInterdepartementale: {
  name: string;
  formData: TestCpomAjoutData;
  financeData: TestCpomFinanceData;
  modificationFormData: TestCpomAjoutData;
  modificationFinanceData: TestCpomFinanceData;
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
    [StructureType.CADA]: {
      2024: {
        repriseEtat: 2000,
        affectationReservesFondsDedies: 1000,
      },
    },
    [StructureType.CAES]: {
      2024: {
        repriseEtat: 2000,
      },
    },
  },
  modificationFormData: {
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
        startDate: "2024-07-01",
        endDate: "2026-12-31",
        filePath: "tests/e2e/fixtures/sample.pdf",
      },
    ],
    avenants: [],
    structureIds: "seeded",
  },
  modificationFinanceData: {
    [StructureType.CADA]: {
      2024: {
        repriseEtat: 2500,
        affectationReservesFondsDedies: 1100,
        totalProduitsProposes: 120000,
        totalProduits: 118000,
        totalChargesProposees: 100000,
        totalCharges: 98500,
      },
    },
    [StructureType.CAES]: {
      2024: {
        repriseEtat: 2100,
        fondsDedies: 900,
        totalProduits: 87000,
        totalCharges: 81000,
      },
    },
  },
};
