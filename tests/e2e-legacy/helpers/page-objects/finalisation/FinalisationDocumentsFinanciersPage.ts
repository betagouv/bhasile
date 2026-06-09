import { Page } from "@playwright/test";

import { URLS } from "../../constants";
import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data/types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class FinalisationDocumentsFinanciersPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async fillForm(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "finalisation");
    const waitHelper = new WaitHelper(this.page);
    await waitHelper.waitForAutosave();
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.submitAndWaitForUrl(
        URLS.finalisationStep(structureId, "03-finance")
      );
    }
  }
}
