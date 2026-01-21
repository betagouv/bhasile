import { test } from "@playwright/test";
import { v4 as uuidv4 } from "uuid";

import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { mockAddressApi } from "./helpers/mocks/address-api";
import { mockFileApi } from "./helpers/mocks/file-api";
import {
  deleteStructureViaApi,
  seedStructureForSelection,
} from "./helpers/structure-creator";
import { buildTestData, cadaSansCpom } from "./helpers/test-data";

// Increase timeout for the full create -> finalise -> modify flow
test.setTimeout(60000);

test("CADA sans CPOM - Flux complet (création, finalisation, modification)", async ({
  page,
}) => {
  const formData = buildTestData(cadaSansCpom, {
    dnaCode: `C${uuidv4()}`,
    operateurName: `Operateur E2E ${uuidv4().slice(0, 8)}`,
  });

  await mockFileApi(page, { mockFileKey: `e2e-doc-${uuidv4()}` });
  await mockAddressApi(page, formData.adresses.adresseAdministrative.complete);

  await seedStructureForSelection(formData);

  try {
    await completeStructureFlow(page, formData);
  } finally {
    await deleteStructureViaApi(formData.dnaCode);
  }
});
