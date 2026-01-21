import { Page } from "@playwright/test";

import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data";

export class FinalisationDocumentsFinanciersPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillMinimalData(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "finalisation");
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/structures/${structureId}/finalisation/03-finance`,
      { timeout: 10000 }
    );
  }
}
