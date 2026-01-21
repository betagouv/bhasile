import { v4 as uuidv4 } from "uuid";

import { Repartition } from "@/types/adresse.type";

import { baseCadaData } from "./base-cada";
import { baseCaesData } from "./base-caes";
import { baseCphData } from "./base-cph";
import { baseHudaData } from "./base-huda";
import { TestStructureData } from "./types";

export type TestDataOverrides = Partial<TestStructureData> & {
  dnaCode?: string;
  operateurName?: string;
};

/**
 * Build test data by merging base data with overrides
 * Special handling for documentsFinanciers to merge files arrays
 */
export const buildTestData = (
  base: TestStructureData,
  { dnaCode, operateurName, documentsFinanciers, ...rest }: TestDataOverrides
): TestStructureData => {
  let mergedDocumentsFinanciers = base.documentsFinanciers;

  if (documentsFinanciers) {
    // If files are explicitly provided, use them; otherwise keep base files
    mergedDocumentsFinanciers = {
      ...base.documentsFinanciers,
      ...documentsFinanciers,
      files:
        documentsFinanciers.files !== undefined
          ? documentsFinanciers.files
          : base.documentsFinanciers.files,
    };
  }

  return {
    ...base,
    ...rest,
    dnaCode: dnaCode ?? base.dnaCode,
    operateur: operateurName
      ? { name: operateurName, searchTerm: "Operateur E2E" }
      : base.operateur,
    documentsFinanciers: mergedDocumentsFinanciers,
  };
};

/**
 * Factory function to create CADA test data with variations
 */
export function createCadaTestData(
  overrides: TestDataOverrides = {}
): TestStructureData {
  const dnaCode = overrides.dnaCode ?? `C${uuidv4()}`;
  const operateurName =
    overrides.operateurName ?? `Operateur E2E ${Date.now()}`;

  return buildTestData(
    { ...baseCadaData, dnaCode: "placeholder" } as TestStructureData,
    {
      dnaCode,
      operateurName,
      ...overrides,
    }
  );
}

/**
 * Pre-defined CADA test case 1: Full data with evaluations and controls
 */
export const cada1Config: TestDataOverrides = {
  // Uses all defaults from baseCadaData
};

/**
 * Factory function to create CPH test data with variations
 */
export function createCphTestData(
  overrides: TestDataOverrides = {}
): TestStructureData {
  const dnaCode = overrides.dnaCode ?? `P${uuidv4()}`;
  const operateurName =
    overrides.operateurName ?? `Operateur E2E ${Date.now()}`;

  return buildTestData(
    { ...baseCphData, dnaCode: "placeholder" } as TestStructureData,
    {
      dnaCode,
      operateurName,
      ...overrides,
    }
  );
}

/**
 * Factory function to create HUDA test data with variations
 */
export function createHudaTestData(
  overrides: TestDataOverrides = {}
): TestStructureData {
  const dnaCode = overrides.dnaCode ?? `H${uuidv4()}`;
  const operateurName =
    overrides.operateurName ?? `Operateur E2E ${Date.now()}`;

  return buildTestData(
    { ...baseHudaData, dnaCode: "placeholder" } as TestStructureData,
    {
      dnaCode,
      operateurName,
      ...overrides,
    }
  );
}

/**
 * Factory function to create CAES test data with variations
 */
export function createCaesTestData(
  overrides: TestDataOverrides = {}
): TestStructureData {
  const dnaCode = overrides.dnaCode ?? `E${uuidv4()}`;
  const operateurName =
    overrides.operateurName ?? `Operateur E2E ${Date.now()}`;

  return buildTestData(
    { ...baseCaesData, dnaCode: "placeholder" } as TestStructureData,
    {
      dnaCode,
      operateurName,
      ...overrides,
    }
  );
}

/**
 * Pre-defined CADA test case 2: Mixte type, no evaluations/controls (young structure)
 */
export const cada2Config: TestDataOverrides = {
  typeBati: Repartition.MIXTE,
  lgbt: false,
  fvvTeh: false,
  contactSecondaire: undefined,
  adresses: [
    {
      adresseComplete: "1 Rue de la Paix 75001 Paris",
      searchTerm: "1 Rue de la Paix 75001 Paris",
      placesAutorisees: 50,
      repartition: Repartition.DIFFUS,
    },
    {
      adresseComplete: "2 Rue de la Paix 75001 Paris",
      searchTerm: "2 Rue de la Paix 75001 Paris",
      placesAutorisees: 150,
      repartition: Repartition.COLLECTIF,
    },
  ],
  structureTypologies: [
    { placesAutorisees: 150, pmr: 5, lgbt: 10, fvvTeh: 83 },
    { placesAutorisees: 148, pmr: 5, lgbt: 10, fvvTeh: 83 },
    { placesAutorisees: 145, pmr: 4, lgbt: 8, fvvTeh: 71 },
  ],
  // TODO: remove evaluation (young structure)
  evaluations: [
    { date: "2021-05-12", filePath: "tests/e2e/fixtures/sample.csv" },
  ],
  // No controls
  controles: [],
  finalisationNotes:
    "Notes de finalisation (CADA 2 - jeune structure) : pas encore d'évaluation.",
};
