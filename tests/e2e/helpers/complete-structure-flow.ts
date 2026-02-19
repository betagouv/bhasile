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
type TestStructureDataWithDnaCode = Partial<TestStructureData> & {
  dnaCode: string;
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

  if (!formData.dnaCode) {
    throw new Error("dnaCode is required");
  }
  const dataWithDna = formData as TestStructureDataWithDnaCode;

  // 1. Ajout
  const ajoutResult = await completeAjoutFlow(page, dataWithDna, failingStep);

  if ("stoppedAtFailingStep" in ajoutResult) {
    return;
  }

  const { structureId } = ajoutResult;

  // 2. Finalisation
  const finalisationResult = await completeFinalisationFlow(
    page,
    structureId,
    dataWithDna as TestStructureData,
    dataWithDna.dnaCode,
    failingStep
  );

  if ("stoppedAtFailingStep" in finalisationResult) {
    return;
  }

  const structurePage = new StructureDetailsPage(page);
  await structurePage.navigateTo(structureId);
  await structurePage.waitForLoad();

  await structurePage.expectAllData(dataWithDna as TestStructureData, {});

  if (!modificationData) {
    return;
  }

  // 3. Modification
  await completeModificationFlow(
    page,
    structureId,
    dataWithDna as TestStructureData,
    modificationData
  );

  await structurePage.navigateTo(structureId);
  await structurePage.waitForLoad();
  await page.waitForTimeout(60000);
  await structurePage.expectAllData(
    dataWithDna as TestStructureData,
    modificationData
  );
};
