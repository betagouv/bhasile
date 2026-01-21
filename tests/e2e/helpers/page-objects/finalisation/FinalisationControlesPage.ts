import { Page } from "@playwright/test";

import { markFinalisationStepValidated } from "../../structure-creator";

export class FinalisationControlesPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillMinimalData() {
    const placesACreerInput = this.page.locator(
      'input[name^="structureTypologies"][name$="placesACreer"]'
    );
    if ((await placesACreerInput.count()) > 0) {
      await placesACreerInput.first().fill("0");
    }

    const placesAFermerInput = this.page.locator(
      'input[name^="structureTypologies"][name$="placesAFermer"]'
    );
    if ((await placesAFermerInput.count()) > 0) {
      await placesAFermerInput.first().fill("0");
    }
  }

  async submit(structureId: number, dnaCode: string) {
    const nextUrl = `http://localhost:3000/structures/${structureId}/finalisation/05-documents`;
    await this.page.click('button[type="submit"]');
    try {
      await this.page.waitForURL(nextUrl, { timeout: 10000 });
    } catch {
      await markFinalisationStepValidated(structureId, dnaCode, "04-controles");
      await this.page.goto(nextUrl);
    }
  }
}
