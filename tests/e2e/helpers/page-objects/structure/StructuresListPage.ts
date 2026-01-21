import { expect, Page } from "@playwright/test";

import { URLS } from "../../constants";

export class StructuresListPage {
  constructor(private page: Page) {}

  async navigate() {
    await this.page.goto(URLS.STRUCTURES);
  }

  async searchByDna(dnaCode: string) {
    const searchInput = this.page.locator('input#search[type="text"]');
    await expect(searchInput).toBeVisible();
    await searchInput.fill(dnaCode);
  }

  async startFinalisationForDna(dnaCode: string) {
    const row = this.page.getByRole("row", { name: new RegExp(dnaCode) });
    await expect(row).toBeVisible();

    const finaliseButton = row.getByRole("button", {
      name: new RegExp(`Finaliser la création de la structure ${dnaCode}`),
    });
    await finaliseButton.click();

    const confirmButton = this.page.getByRole("button", {
      name: "Je finalise la création",
    });
    await expect(confirmButton).toBeVisible();
    await confirmButton.click();

    await this.page.waitForURL(
      new RegExp("/structures/\\d+/finalisation/01-identification")
    );
  }
}
