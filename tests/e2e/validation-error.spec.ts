import { test } from "@playwright/test";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { deleteStructureViaApi } from "./helpers/structure-creator";
import { cada1 } from "./helpers/test-data/cada-1";
import { TestStructureDataBuilder } from "./helpers/test-data/test-data-builder";
import { TestStructureScenario } from "./helpers/test-data/types";

const invalidTestCases: TestStructureScenario[] = [
  // Identification failures
  {
    name: "should fail validation at identification page when finessCode is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("finessCode")
      .build(),
    failingStep: "identification",
  },
  {
    name: "should fail validation at identification page when creationDate is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("creationDate")
      .build(),
    failingStep: "identification",
  },
  {
    name: "should fail validation at identification page when public is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("public")
      .build(),
    failingStep: "identification",
  },
  {
    name: "should fail validation at identification page when contactPrincipal is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("contactPrincipal")
      .build(),
    failingStep: "identification",
  },
  {
    name: "should fail validation at identification page when contactPrincipal email is invalid",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withContactPrincipalEmail("invalid-email-format")
      .build(),
    failingStep: "identification",
  },
  {
    name: "should fail validation at identification page when contactPrincipal telephone is invalid",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withContactPrincipalPhone("123")
      .build(),
    failingStep: "identification",
  },
  // Adresses failures
  {
    name: "should fail validation at adresses page when adresseAdministrative is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("adresseAdministrative")
      .build(),
    failingStep: "adresses",
  },
  {
    name: "should fail validation at adresses page when typeBati is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("typeBati")
      .build(),
    failingStep: "adresses",
  },
  // Finalisation failures
  {
    name: "should fail validation at finalisationDocumentsFinanciers page when documentsFinanciers files are missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withDocumentsFinanciers({
        allAddedViaAjout: false,
        files: [],
      })
      .build(),
    failingStep: "finalisationDocumentsFinanciers",
  },
  {
    name: "should fail validation at finalisationFinance page when finances are missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("finances")
      .build(),
    failingStep: "finalisationFinance",
  },
  {
    name: "should fail validation at finalisationDocuments page when actesAdministratifs are missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("actesAdministratifs")
      .build(),
    failingStep: "finalisationDocuments",
  },
];

for (const { name, formData, failingStep } of invalidTestCases) {
  test(name, async ({ page }) => {
    await beforeFlow(formData, page);

    try {
      await completeStructureFlow(page, formData, {
        failingStep,
      });
    } finally {
      if (formData.dnaCode) {
        await deleteStructureViaApi(formData.dnaCode);
      }
    }
  });
}
