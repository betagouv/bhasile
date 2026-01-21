import { expect, Page } from "@playwright/test";

export class ModificationDescriptionPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await expect(
      this.page.getByRole("heading", { name: /Modification/i })
    ).toBeVisible();
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
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
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/structures/${structureId}`,
      { timeout: 10000 }
    );
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
