import { Page } from "@playwright/test";

import { fillActesForm } from "../../actes-form-helper";
import { TIMEOUTS, URLS } from "../../constants";
import { SELECTORS } from "../../selectors";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationDocumentsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async fillForm(data: ModificationData) {
    await fillActesForm(
      this.page,
      data.actesAdministratifs ?? [],
      "modification"
    );
  }

  async submit(structureId: number) {
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
    await submitButton.waitFor({
      state: "visible",
      timeout: TIMEOUTS.NAVIGATION,
    });
    await submitButton.click({ force: true });
    await this.page.waitForURL(URLS.structure(structureId), {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }
}
