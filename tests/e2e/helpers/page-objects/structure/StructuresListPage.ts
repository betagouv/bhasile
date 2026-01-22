import { Page } from "@playwright/test";
import { expect } from "@playwright/test";

import { FormHelper } from "../../form-helper";
import { URLS } from "../../constants";
import { BasePage } from "../BasePage";

export class StructuresListPage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }

  async navigate() {
    await this.page.goto(URLS.STRUCTURES);
  }

  async searchByDna(dnaCode: string) {
    await this.formHelper.fillInput('input#search[type="text"]', dnaCode);
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
