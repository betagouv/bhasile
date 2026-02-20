import { Page } from "@playwright/test";

import { fillActesForm } from "../../actes-form-helper";
import { TIMEOUTS, URLS } from "../../constants";
import { SELECTORS } from "../../selectors";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class FinalisationDocumentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillForm(data: TestStructureData) {
    await fillActesForm(
      this.page,
      data.actesAdministratifs ?? [],
      "finalisation"
    );
    const waitHelper = new WaitHelper(this.page);
    await waitHelper.waitForAutosave();
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
      await submitButton.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await submitButton.click({ force: true });
      await this.page.waitForURL(
        URLS.finalisationStep(structureId, "06-notes"),
        { timeout: TIMEOUTS.SUBMIT, waitUntil: "commit" }
      );
    }
  }
}
