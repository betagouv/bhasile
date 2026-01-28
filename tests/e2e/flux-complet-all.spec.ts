import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { deleteStructureViaApi } from "./helpers/structure-creator";
import { cada1 } from "./helpers/test-data/cada-1";
import { cada2 } from "./helpers/test-data/cada-2";
import { cada3 } from "./helpers/test-data/cada-3";
import { caes1 } from "./helpers/test-data/caes-1";
import { caes2 } from "./helpers/test-data/caes-2";
import { cph1 } from "./helpers/test-data/cph-1";
import { cph2 } from "./helpers/test-data/cph-2";
import { huda1 } from "./helpers/test-data/huda-1";
import { huda2 } from "./helpers/test-data/huda-2";

// For faster iterations during development, we currently run only the first
// valid test case. Add more entries back to this array when needed.
const validTestCases = [cada1];

for (const { name, formData } of validTestCases) {
  test(`${name} - Flux complet (création, finalisation, modification)`, async ({
    page,
  }) => {
    await beforeFlow(formData, page);

    try {
      await completeStructureFlow(page, formData);
    } finally {
      await deleteStructureViaApi(formData.dnaCode as string);
    }
  });
}
