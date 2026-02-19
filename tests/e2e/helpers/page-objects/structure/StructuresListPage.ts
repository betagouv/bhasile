import { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { SELECTORS } from "../../selectors";
import { BasePage } from "../BasePage";

export class StructuresListPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async navigate() {
    await this.page.goto(URLS.STRUCTURES);
  }

  async searchByDna(dnaCode: string) {
    // Use .first() - page can have duplicate search inputs (e.g. responsive layout)
    const searchInput = this.page.locator(SELECTORS.SEARCH_INPUT).first();
    await searchInput.waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
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
