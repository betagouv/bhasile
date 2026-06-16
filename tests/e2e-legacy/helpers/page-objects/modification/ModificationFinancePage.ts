import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { fillFinanceForm } from "../../finance-form-helper";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationFinancePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async fillForm(data: ModificationData) {
    await fillFinanceForm(this.page, data.finances);
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
  }
}
