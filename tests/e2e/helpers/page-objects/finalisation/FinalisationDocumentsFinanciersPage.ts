import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data";

export class FinalisationDocumentsFinanciersPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  async fillForm(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "finalisation");
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(URLS.finalisationStep(structureId, "03-finance"), {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }
}
