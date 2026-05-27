import { StructureType } from "@/types/structure.type";

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
  modificationFormData: TestCpomAjoutData;
  modificationFinanceData: TestCpomFinanceData;
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
    [StructureType.CADA]: {
      2024: {
        dotationDemandee: 100000,
        dotationAccordee: 95000,
        repriseEtat: 1000,
      },
      2025: {
        dotationDemandee: "105 000",
        dotationAccordee: 100000,
      },
    },
  },
  modificationFormData: {
    granularity: "DEPARTEMENTALE",
    region: "Île-de-France",
    departements: "92",
    operateur: {
      name: "Opérateur 1",
      searchTerm: "Opér",
      id: 1,
    },
    actesAdministratifs: [
      {
        startDate: "2024-02-01",
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
        dotationDemandee: 111111,
        dotationAccordee: 109999,
        totalProduitsProposes: 200000,
        totalProduits: 198500,
        totalChargesProposees: 170000,
        totalCharges: 169000,
        repriseEtat: 1200,
        affectationReservesFondsDedies: 750,
        reserveInvestissement: 200,
        chargesNonReconductibles: 100,
        reserveCompensationDeficits: 90,
        reserveCompensationBFR: 80,
        reserveCompensationAmortissements: 70,
        reportANouveau: 60,
        autre: 50,
      },
      2025: {
        dotationDemandee: 122222,
        dotationAccordee: 120000,
      },
    },
  },
};
