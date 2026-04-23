import { test } from "@playwright/test";

import { deleteStructure } from "@/app/api/structures/structure.repository";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { cada1 } from "./helpers/test-data/cada-1";
import { cada2 } from "./helpers/test-data/cada-2";
import { cada3 } from "./helpers/test-data/cada-3";
import { caes1 } from "./helpers/test-data/caes-1";
import { caes2 } from "./helpers/test-data/caes-2";
import { cph1 } from "./helpers/test-data/cph-1";
import { cph2 } from "./helpers/test-data/cph-2";
import { huda1 } from "./helpers/test-data/huda-1";
import { huda2 } from "./helpers/test-data/huda-2";

const validTestCases = [
  cada1,
  cada2,
  cada3,
  cph1,
  cph2,
];

for (const {
  name,
  formData,
  modificationData,
  failingStep,
} of validTestCases) {
  test(`${name} - Flux complet (création, finalisation, modification)`, async ({
    page,
  }) => {
    test.setTimeout(300000); // End-to-end flow includes multiple uploads and retries
    const id = await beforeFlow(formData, page);

    try {
      await completeStructureFlow(page, {
        formData: { ...formData, id },
        modificationData,
        failingStep: failingStep,
      });
    } finally {
      try {
        await deleteStructure(formData.codeBhasile as string);
      } catch {
        // Structure may not exist if test failed before creation
      }
    }
  });
}
