import { Page } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

import { mockAddressApi } from "./mocks/address-api";
import { mockFileApi } from "./mocks/file-api";
import { seedStructureForSelection } from "./structure-creator";
import { buildTestData, TestStructureData } from "./test-data";

export async function beforeFlow(data: TestStructureData, page: Page) {
  const formData = buildTestData(data, {
    dnaCode: `C${uuidv4()}`,
    operateurName: `Operateur E2E ${Date.now()}`,
  });

  await mockFileApi(page, { mockFileKey: "e2e-cada-doc" });
  await mockAddressApi(page, formData.adresseAdministrative.complete);

  await seedStructureForSelection(formData);

  return formData;
}
