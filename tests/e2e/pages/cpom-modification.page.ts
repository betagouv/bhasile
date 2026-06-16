import type { Page } from "@playwright/test";

import { expect } from "../fixtures/test";

export type CpomSection =
  | "description"
  | "composition"
  | "finances"
  | "actes-administratifs";

export class CpomModificationPage {
  constructor(
    private readonly page: Page,
    private readonly cpomId: number
  ) {}

  async goto(section: CpomSection): Promise<void> {
    await this.page.goto(`/cpoms/${this.cpomId}/modification/${section}`, {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByRole("button", { name: "Valider", exact: true })
    ).toBeVisible();

    await this.page.waitForLoadState("networkidle", { timeout: 15000 });
  }

  async selectRegion(region: string): Promise<void> {
    await this.page.locator("select#region").selectOption({ label: region });
  }

  async selectDepartement(numero: string): Promise<void> {
    await this.page.locator("select#departements").selectOption(numero);
  }

  async fillDotationDemandee(
    yearRowIndex: number,
    value: number
  ): Promise<void> {
    await this.page
      .locator(`input[id="budgets.${yearRowIndex}.dotationDemandee"]`)
      .fill(String(value));
  }

  async attachStructure(structureId: number): Promise<void> {
    const checkbox = this.page.locator(
      `input[name="structures"][value="${structureId}"]`
    );
    await checkbox.waitFor({ state: "attached", timeout: 10000 });
    if (!(await checkbox.isChecked())) {
      const id = await checkbox.getAttribute("id");
      const label = id
        ? this.page.locator(`label[for="${id}"]`)
        : checkbox.locator("..").locator("label").first();
      await label.click();
    }
  }

  async submitAndWaitForSave(): Promise<void> {
    const savePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes(`/api/cpoms/${this.cpomId}`) &&
        response.request().method() === "PUT" &&
        response.ok(),
      { timeout: 20000 }
    );
    await this.page
      .getByRole("button", { name: "Valider", exact: true })
      .click();
    await savePromise;
  }
}
