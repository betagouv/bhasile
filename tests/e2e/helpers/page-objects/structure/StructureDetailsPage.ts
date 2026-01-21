import { expect, Locator, Page } from "@playwright/test";

export class StructureDetailsPage {
  constructor(private page: Page) {}

  async navigateTo(structureId: number) {
    await this.page.goto(`http://localhost:3000/structures/${structureId}`);
  }

  async waitForLoad() {
    await expect(
      this.page.getByRole("heading", { name: "Description" })
    ).toBeVisible();
  }

  async openDescriptionEdit() {
    const block = this.getBlockByTitle("Description");
    await block.getByRole("button", { name: "Modifier" }).click();
  }

  async showContacts() {
    const block = this.getBlockByTitle("Description");
    const hiddenToggle = block.getByRole("button", {
      name: "Masquer les contacts",
    });
    if (!(await hiddenToggle.isVisible())) {
      await block
        .getByRole("button", { name: "Voir les contacts" })
        .click();
    }
  }

  async expectPublic(publicValue: string) {
    const block = this.getBlockByTitle("Description");
    await expect(
      block.getByText("Public", { exact: true }).locator("..")
    ).toContainText(publicValue);
  }

  async expectVulnerabilite(vulnerabiliteValue: string) {
    const block = this.getBlockByTitle("Description");
    await expect(
      block.getByText("Vulnérabilité", { exact: true }).locator("..")
    ).toContainText(vulnerabiliteValue);
  }

  async expectContactEmail(email: string) {
    const block = this.getBlockByTitle("Description");
    await expect(block.getByText(email, { exact: true })).toBeVisible();
  }

  private getBlockByTitle(title: string): Locator {
    const heading = this.page.getByRole("heading", { name: title, level: 3 });
    return heading.locator("..").locator("..").locator("..");
  }
}
