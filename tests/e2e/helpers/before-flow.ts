import { Page } from "@playwright/test";

import { deleteStructure } from "@/app/api/structures/structure.repository";

import { mockAddressApi } from "./mocks/address-api";
import { seedStructureForSelection } from "./structure-creator";
import { TestStructureData } from "./test-data/types";

export async function beforeFlow(
  data: TestStructureData | Partial<TestStructureData>,
  page: Page
): Promise<void> {
  await mockAddressApi(page, data.adresseAdministrative?.complete ?? "");

  if (data.dnaCode) {
    // Sometimes the cleanup doesn't happen
    try {
      await deleteStructure(data.dnaCode as string);
    } catch {}
    await seedStructureForSelection(
      data as Partial<TestStructureData> & { dnaCode: string }
    );
  }
}
