import { Repartition } from "@/types/adresse.type";
import { v4 as uuidv4 } from "uuid";

import { baseCadaData } from "./base-cada";
import { TestStructureData } from "./types";

type TestDataOverrides = Partial<TestStructureData> & {
  dnaCode?: string;
  operateurName?: string;
};

/**
 * Build test data by merging base data with overrides
 */
export const buildTestData = (
  base: TestStructureData,
  { dnaCode, operateurName, ...rest }: TestDataOverrides
): TestStructureData => ({
  ...base,
  ...rest,
  dnaCode: dnaCode ?? base.dnaCode,
  operateur: operateurName
    ? { name: operateurName, searchTerm: "Operateur E2E" }
    : base.operateur,
});

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
  // No evaluations - young structure
  evaluations: [],
  // No controls
  controles: [],
  finalisationNotes: "Notes de finalisation (CADA 2 - jeune structure) : pas encore d'évaluation.",
};
