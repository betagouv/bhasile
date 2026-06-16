import { Page } from "@playwright/test";

import { completeAjoutFlow } from "./complete-structure-flow-ajout";
import { completeFinalisationFlow } from "./complete-structure-flow-finalisation";
import { completeModificationFlow } from "./complete-structure-flow-modification";
import { StructureDetailsPage } from "./page-objects/structure/StructureDetailsPage";
import {
  FailingStep,
  ModificationData,
  TestStructureData,
} from "./test-data/types";

// Helper type: Partial data but with required dnaCode
type TestStructureDataWithCodeBhasile = Partial<TestStructureData> & {
  codeBhasile: string;
  id: number;
};

export type CompleteStructureFlowInput = {
  formData: Partial<TestStructureData>;
  modificationData?: ModificationData;
  failingStep?: FailingStep;
};

export const completeStructureFlow = async (
  page: Page,
  input: Partial<TestStructureData> | CompleteStructureFlowInput,
  options?: { failingStep?: FailingStep }
) => {
  const formData =
    "formData" in input
      ? input.formData
      : (input as Partial<TestStructureData>);
  const modificationData =
    "modificationData" in input
      ? (input as CompleteStructureFlowInput).modificationData
      : undefined;
  const failingStep =
    options?.failingStep ??
    ("failingStep" in input
      ? (input as CompleteStructureFlowInput).failingStep
      : undefined);

  if (!formData.codeBhasile) {
    throw new Error("codeBhasile is required");
  }
  const dataWithCodeBhasile = formData as TestStructureDataWithCodeBhasile;

  // 1. Ajout
  const ajoutResult = await completeAjoutFlow(
    page,
    dataWithCodeBhasile,
    failingStep
  );

  if ("stoppedAtFailingStep" in ajoutResult) {
    return;
  }

  // 2. Finalisation
  const finalisationResult = await completeFinalisationFlow(
    page,
    dataWithCodeBhasile,
    failingStep
  );

  if ("stoppedAtFailingStep" in finalisationResult) {
    return;
  }

  const structurePage = new StructureDetailsPage(page);
  await structurePage.navigateTo(dataWithCodeBhasile.id);
  await structurePage.waitForLoad();

  await structurePage.expectAllData(
    dataWithCodeBhasile as TestStructureData,
    {}
  );

  if (!modificationData) {
    return;
  }

  // 3. Modification
  await completeModificationFlow(
    page,
    dataWithCodeBhasile.id,
    modificationData
  );

  await structurePage.navigateTo(dataWithCodeBhasile.id);
  await structurePage.waitForLoad();
  await structurePage.expectAllData(
    dataWithCodeBhasile as TestStructureData,
    modificationData
  );
};
