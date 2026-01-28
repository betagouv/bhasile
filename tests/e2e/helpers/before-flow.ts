import { Page } from "@playwright/test";

import { mockAddressApi } from "./mocks/address-api";
import { seedStructureForSelection } from "./structure-creator";
import { TestStructureData } from "./test-data/types";

export async function beforeFlow(
  data: TestStructureData | Partial<TestStructureData>,
  page: Page
): Promise<void> {
  await mockAddressApi(page, data.adresseAdministrative?.complete ?? "");

  if (data.dnaCode) {
    await seedStructureForSelection(
      data as Partial<TestStructureData> & { dnaCode: string }
    );
  }
}
