import { Page } from "@playwright/test";

import { fillActesForm } from "../../actes-form-helper";
import { TIMEOUTS, URLS } from "../../constants";
import { SELECTORS } from "../../selectors";
import { TestStructureData } from "../../test-data/types";
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
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.page
        .waitForLoadState("networkidle", {
          timeout: TIMEOUTS.FILE_UPLOAD,
        })
        .catch(() => {});
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
