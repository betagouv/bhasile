import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { deleteStructureViaApi } from "./helpers/structure-creator";
import { cada1Config, cada2Config } from "./helpers/test-data";

const testCases = [
  { name: "CADA 1 - avec évaluations et contrôles", config: cada1Config },
  { name: "CADA 2 - jeune structure sans évaluation", config: cada2Config },
];

for (const { name, config } of testCases) {
  test(`${name} - Flux complet (création, finalisation, modification)`, async ({
    page,
  }) => {
    const formData = await beforeFlow(config, page);

    try {
      await completeStructureFlow(page, formData);
    } finally {
      await deleteStructureViaApi(formData.dnaCode);
    }
  });
}
