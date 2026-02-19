import { Page } from "@playwright/test";

import { runFinalisationStep } from "./flow-step-runner";
import { FinalisationControlesPage } from "./page-objects/finalisation/FinalisationControlesPage";
import { FinalisationDocumentsFinanciersPage } from "./page-objects/finalisation/FinalisationDocumentsFinanciersPage";
import { FinalisationDocumentsPage } from "./page-objects/finalisation/FinalisationDocumentsPage";
import { FinalisationFinancePage } from "./page-objects/finalisation/FinalisationFinancePage";
import { FinalisationIdentificationPage } from "./page-objects/finalisation/FinalisationIdentificationPage";
import { FinalisationNotesPage } from "./page-objects/finalisation/FinalisationNotesPage";
import { StructuresListPage } from "./page-objects/structure/StructuresListPage";
import { FailingStep, TestStructureData } from "./test-data/types";

export type CompleteFinalisationFlowResult =
  | { completed: true }
  | { stoppedAtFailingStep: true };

/**
 * Runs the finalisation flow: navigate to structures list, start finalisation,
 * run all finalisation steps (identification, documents financiers, finance,
 * controles, documents, notes), then finalize and go to structure page.
 * Returns completed on success, or stoppedAtFailingStep when validation fails at expected step.
 */
export async function completeFinalisationFlow(
  page: Page,
  structureId: number,
  formData: TestStructureData,
  dnaCode: string,
  failingStep?: FailingStep
): Promise<CompleteFinalisationFlowResult> {
  const structuresListPage = new StructuresListPage(page);
  await structuresListPage.navigate();
  await structuresListPage.searchByDna(dnaCode);
  await structuresListPage.startFinalisationForDna(dnaCode);

  const finalisationNotesPage = new FinalisationNotesPage(page);
  const finalisationSteps = [
    {
      page: new FinalisationIdentificationPage(page),
      stepKey: "finalisationIdentification" as const,
    },
    {
      page: new FinalisationDocumentsFinanciersPage(page),
      stepKey: "finalisationDocumentsFinanciers" as const,
    },
    {
      page: new FinalisationFinancePage(page),
      stepKey: "finalisationFinance" as const,
    },
    {
      page: new FinalisationControlesPage(page),
      stepKey: "finalisationControles" as const,
    },
    {
      page: new FinalisationDocumentsPage(page),
      stepKey: "finalisationDocuments" as const,
    },
    {
      page: finalisationNotesPage,
      stepKey: "finalisationNotes" as const,
    },
  ];

  for (const { page: stepPage, stepKey } of finalisationSteps) {
    const shouldContinue = await runFinalisationStep(
      stepPage,
      structureId,
      formData,
      failingStep,
      stepKey
    );
    if (!shouldContinue) {
      return { stoppedAtFailingStep: true };
    }
  }

  await finalisationNotesPage.finalizeAndGoToStructure(structureId);
  return { completed: true };
}
