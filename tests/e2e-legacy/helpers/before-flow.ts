import { Page } from "@playwright/test";

import { deleteStructure } from "@/app/api/structures/structure.repository";

import { mockAddressApi } from "./mocks/address-api";
import { seedStructureForSelection } from "./structure-creator";
import { TestStructureData } from "./test-data/types";

export async function beforeFlow(
  data: TestStructureData | Partial<TestStructureData>,
  page: Page
): Promise<number> {
  await mockAddressApi(page, data.adresseAdministrative?.complete ?? "");

  if (!data.codeBhasile) {
    throw new Error("codeBhasile is required");
  }

  // Sometimes the cleanup doesn't happen
  try {
    await deleteStructure(data.codeBhasile as string);
  } catch {}
  const id = await seedStructureForSelection(
    data as Partial<TestStructureData> & { codeBhasile: string }
  );

  return id;
}
