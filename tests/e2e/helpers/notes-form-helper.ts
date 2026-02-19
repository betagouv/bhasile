import { Page } from "@playwright/test";

import { TIMEOUTS } from "./constants";
import { FormHelper } from "./form-helper";

export type FillNotesOptions = {
  /** Wait for PUT response to /api/structures before resolving (finalisation autosave) */
  waitForSave?: boolean;
};

/**
 * Fills the notes textarea. Used by both ModificationNotesPage and FinalisationNotesPage.
 */
export async function fillNotesForm(
  page: Page,
  formHelper: FormHelper,
  notes: string,
  options: FillNotesOptions = {}
): Promise<void> {
  const { waitForSave = false } = options;

  if (waitForSave) {
    const saveResponse = page.waitForResponse(
      (response) =>
        response.url().includes("/api/structures") &&
        response.request().method() === "PUT" &&
        response.status() < 400,
      { timeout: TIMEOUTS.NAVIGATION }
    );
    await formHelper.fillInput('textarea[name="notes"]', notes);
    await saveResponse;
  } else {
    await formHelper.fillInput('textarea[name="notes"]', notes);
  }
}
