import { test } from "@playwright/test";

import { deleteStructure } from "@/app/api/structures/structure.repository";

import { beforeFlow } from "./helpers/before-flow";
import { completeStructureFlow } from "./helpers/complete-structure-flow";
import { cada1 } from "./helpers/test-data/cada-1";
import { TestStructureDataBuilder } from "./helpers/test-data/test-data-builder";
import { TestStructureScenario } from "./helpers/test-data/types";

const invalidTestCases: TestStructureScenario[] = [
  // Identification failures
  {
    name: "should fail validation at identification page when finess code is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withField("finesses", [{ code: "", description: "Finess 1" }])
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
    name: "should fail validation at identification page when contacts are missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("contacts")
      .build(),
    failingStep: "identification",
  },
  {
    name: "should fail validation at identification page when first contact email is invalid",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withFirstContactEmail("invalid-email-format")
      .build(),
    failingStep: "identification",
  },
  {
    name: "should fail validation at identification page when first contact telephone is invalid",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withFirstContactPhone("123")
      .build(),
    failingStep: "identification",
  },
  // Adresses failures
  {
    name: "should fail validation at identification page when adresseAdministrative is missing",
    formData: TestStructureDataBuilder.basedOn(cada1)
      .withoutField("adresseAdministrative")
      .build(),
    failingStep: "identification",
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
        fileUploads: [],
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
    const id = await beforeFlow(formData, page);

    try {
      await completeStructureFlow(
        page,
        { ...formData, id },
        {
          failingStep,
        }
      );
    } finally {
      if (formData.codeBhasile) {
        await deleteStructure(formData.codeBhasile);
      }
    }
  });
}
