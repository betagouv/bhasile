import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { deleteStructureViaApi } from "./helpers/structure-creator";
import { cadaSansCpom } from "./helpers/test-data";

test("CADA sans CPOM - Flux complet (création, finalisation, modification)", async ({
  page,
}) => {
  const formData = await beforeFlow(cadaSansCpom, page);

  try {
    await completeStructureFlow(page, formData);
  } finally {
    await deleteStructureViaApi(formData.dnaCode);
  }
});
