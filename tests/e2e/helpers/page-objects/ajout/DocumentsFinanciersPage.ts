import { Page } from "@playwright/test";

import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data";

export class DocumentsFinanciersPage {
  constructor(private page: Page) {}

  async fillForm(data: TestStructureData) {
    await handleDocumentsFinanciers(this.page, data, "ajout");
  }

  async submit(dnaCode: string) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/ajout-structure/${dnaCode}/05-verification`,
      { timeout: 10000 }
    );
  }
}
