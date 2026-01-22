import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { deleteStructureViaApi } from "./helpers/structure-creator";
import { cada1 } from "./helpers/test-data/cada-1";
import { TestStructureDataBuilder } from "./helpers/test-data/test-data-builder";

const invalidScenarios = [
  {
    name: "should fail validation at identification page when finessCode is missing",
    data: TestStructureDataBuilder.basedOn(cada1).withoutField("finessCode").build(),
    failingStep: "identification",
  },
];
test("should fail validation at identification page when finessCode is missing", async ({
  page,
}) => {
  // Create invalid data: same as cada1 but without finessCode
  const invalidData = TestStructureDataBuilder.basedOn(cada1)
    .withoutField("finessCode")
    .build();

  await beforeFlow(invalidData, page);

  try {
    // This should fail at the identification step
    await completeStructureFlow(page, invalidData, {
      failingStep: "identification",
    });
  } finally {
    if (invalidData.dnaCode) {
      await deleteStructureViaApi(invalidData.dnaCode);
    }
  }
});
