import { Page } from "@playwright/test";

import { TestStructureData } from "../../test-data";

export class TypePlacesPage {
  constructor(private page: Page) {}

  async fillForm(data: TestStructureData) {
    for (const [i, typologie] of data.structureTypologies.entries()) {
      // Fill typologie fields (date is auto-filled by the form)
      await this.page.fill(
        `input[id="typologies.${i}.placesAutorisees"]`,
        typologie.placesAutorisees.toString()
      );
      await this.page.fill(
        `input[id="typologies.${i}.pmr"]`,
        typologie.pmr.toString()
      );
      await this.page.fill(
        `input[id="typologies.${i}.lgbt"]`,
        typologie.lgbt.toString()
      );
      await this.page.fill(
        `input[id="typologies.${i}.fvvTeh"]`,
        typologie.fvvTeh.toString()
      );
    }
  }

  async submit(dnaCode: string) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/ajout-structure/${dnaCode}/04-documents`
    );
  }
}
