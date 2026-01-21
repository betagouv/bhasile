import { Page } from "@playwright/test";

import { mockAddressApi } from "./mocks/address-api";
import { mockFileApi } from "./mocks/file-api";
import { seedStructureForSelection } from "./structure-creator";
import { createCadaTestData, TestStructureData } from "./test-data";

type TestDataOverrides = Partial<TestStructureData> & {
  dnaCode?: string;
  operateurName?: string;
};

/**
 * Sets up the test environment before running the flow
 * - Generates unique test data
 * - Mocks file and address APIs
 * - Seeds the structure for selection
 */
export async function beforeFlow(
  overrides: TestDataOverrides,
  page: Page
): Promise<TestStructureData> {
  const formData = createCadaTestData(overrides);

  await mockFileApi(page, { mockFileKey: "e2e-cada-doc" });
  await mockAddressApi(page, formData.adresseAdministrative.complete);

  await seedStructureForSelection(formData);

  return formData;
}
