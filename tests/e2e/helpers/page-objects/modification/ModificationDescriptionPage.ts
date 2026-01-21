import { expect } from "@playwright/test";

import { URLS } from "../../constants";
import { BasePage } from "../BasePage";

export class ModificationDescriptionPage extends BasePage {
  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async updatePublic(publicValue: string) {
    await this.page.selectOption("#public", publicValue);
  }

  async setVulnerabilites({
    lgbt,
    fvvTeh,
  }: {
    lgbt: boolean;
    fvvTeh: boolean;
  }) {
    await this.toggleCheckbox('input[name="lgbt"]', lgbt);
    await this.toggleCheckbox('input[name="fvvTeh"]', fvvTeh);
  }

  async updateContactPrincipalEmail(email: string) {
    await this.page.fill('input[name="contacts.0.email"]', email);
  }

  async submit(structureId: number) {
    await this.submitAndWaitForUrl(URLS.structure(structureId));
  }

  private async toggleCheckbox(selector: string, shouldBeChecked: boolean) {
    const checkbox = this.page.locator(selector);
    await expect(checkbox).toBeVisible();
    const isChecked = await checkbox.isChecked();
    if (isChecked !== shouldBeChecked) {
      await this.page.click(`${selector} + label`);
    }
  }
}
