import { Page } from "@playwright/test";

import { runModificationStep } from "./flow-step-runner";
import { ModificationCalendrierPage } from "./page-objects/modification/ModificationCalendrierPage";
import { ModificationControlePage } from "./page-objects/modification/ModificationControlePage";
import { ModificationDescriptionPage } from "./page-objects/modification/ModificationDescriptionPage";
import { ModificationNotesPage } from "./page-objects/modification/ModificationNotesPage";
import { ModificationTypePlacesPage } from "./page-objects/modification/ModificationTypePlacesPage";
import { StructureDetailsPage } from "./page-objects/structure/StructureDetailsPage";
import { ModificationData, TestStructureData } from "./test-data/types";

/**
 * Runs the modification flow: apply modification data for description,
 * calendrier, type places, controle, notes, then verify modifications were applied.
 * Expects the page to already be on the structure details page.
 */
export async function completeModificationFlow(
  page: Page,
  structureId: number,
  formData: TestStructureData,
  modificationData: ModificationData
): Promise<void> {
  const structurePage = new StructureDetailsPage(page);

  const modificationSteps = [
    {
      openEdit: () => structurePage.openDescriptionEdit(),
      page: new ModificationDescriptionPage(page),
    },
    {
      openEdit: () => structurePage.openCalendrierEdit(),
      page: new ModificationCalendrierPage(page),
    },
    {
      openEdit: () => structurePage.openTypePlacesEdit(),
      page: new ModificationTypePlacesPage(page),
    },
    {
      openEdit: () => structurePage.openControleEdit(),
      page: new ModificationControlePage(page),
    },
    {
      openEdit: () => structurePage.openNotesEdit(),
      page: new ModificationNotesPage(page),
    },
  ];
  for (const { openEdit, page } of modificationSteps) {
    await runModificationStep(
      openEdit,
      page,
      structurePage,
      structureId,
      modificationData
    );
  }
}
