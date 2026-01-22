import { Page } from "@playwright/test";

import { mockAddressApi } from "./mocks/address-api";
import { mockFileApi } from "./mocks/file-api";
import { seedStructureForSelection } from "./structure-creator";
import { TestStructureData } from "./test-data/types";

export async function beforeFlow(
  data: TestStructureData | Partial<TestStructureData>,
  page: Page
): Promise<void> {
  await mockFileApi(page, { mockFileKey: "e2e-cada-doc" });
  await mockAddressApi(page, data.adresseAdministrative?.complete ?? "");

  await seedStructureForSelection(data as TestStructureData);
}
