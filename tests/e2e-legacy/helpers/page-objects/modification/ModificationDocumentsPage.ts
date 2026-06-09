import { Page } from "@playwright/test";

import { fillActesForm } from "../../actes-form-helper";
import { URLS } from "../../constants";
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
    await this.page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
  }
}
