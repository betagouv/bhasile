import { Page } from "@playwright/test";

import { StructureType } from "@/types/structure.type";

import { mockAddressApi } from "./mocks/address-api";
import { mockFileApi } from "./mocks/file-api";
import { seedStructureForSelection } from "./structure-creator";
import {
  createCadaTestData,
  createCaesTestData,
  createCphTestData,
  createHudaTestData,
  TestDataOverrides,
  TestStructureData,
} from "./test-data";

/**
 * Sets up the test environment before running the flow
 * - Generates unique test data based on structure type
 * - Mocks file and address APIs
 * - Seeds the structure for selection
 */
export async function beforeFlow(
  overrides: TestDataOverrides,
  page: Page
): Promise<TestStructureData> {
  const structureType = overrides.type || StructureType.CADA;

  let formData: TestStructureData;
  switch (structureType) {
    case StructureType.CPH:
      formData = createCphTestData(overrides);
      break;
    case StructureType.HUDA:
      formData = createHudaTestData(overrides);
      break;
    case StructureType.CAES:
      formData = createCaesTestData(overrides);
      break;
    case StructureType.CADA:
    default:
      formData = createCadaTestData(overrides);
      break;
  }

  await mockFileApi(page, { mockFileKey: "e2e-cada-doc" });
  await mockAddressApi(page, formData.adresseAdministrative.complete);

  await seedStructureForSelection(formData);

  return formData;
}
