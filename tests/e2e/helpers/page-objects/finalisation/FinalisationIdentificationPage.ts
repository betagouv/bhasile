import { Page } from "@playwright/test";

export class FinalisationIdentificationPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    // Wait for the form to load
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/structures/${structureId}/finalisation/02-documents-financiers`,
      { timeout: 10000 }
    );
  }
}
