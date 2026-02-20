import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { fillFinanceForm } from "../../finance-form-helper";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class FinalisationFinancePage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillForm(data: TestStructureData) {
    await fillFinanceForm(this.page, data.finances);
    const waitHelper = new WaitHelper(this.page);
    await waitHelper.waitForAutosave();
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(
        URLS.finalisationStep(structureId, "04-controles")
      );
    }
  }
}
