import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";

export class FinalisationIdentificationPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      URLS.finalisationStep(structureId, "02-documents-financiers"),
      { timeout: TIMEOUTS.NAVIGATION }
    );
  }
}
