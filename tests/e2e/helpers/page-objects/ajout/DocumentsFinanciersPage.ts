import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data";

export class DocumentsFinanciersPage {
  constructor(private page: Page) {}

  async fillForm(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "ajout");
  }

  async submit(dnaCode: string) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(URLS.ajoutStep(dnaCode, "05-verification"), {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }
}
