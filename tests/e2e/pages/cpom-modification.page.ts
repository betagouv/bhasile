import type { Locator, Page } from "@playwright/test";

import { expect } from "../fixtures/test";
import { SAMPLE_PDF, uploadContainer, uploadToContainer } from "./upload.helper";

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

    await this.page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
  }

  private conventionFieldset(): Locator {
    return this.page.locator('fieldset:has(> legend:has-text("Contrat CPOM"))');
  }

  private autreFieldset(): Locator {
    return this.page.locator(
      'fieldset:has(> legend:has-text("Autres documents"))'
    );
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

  async fillConventionDates(startDate: string, endDate: string): Promise<void> {
    const fieldset = this.conventionFieldset();
    await fieldset.locator('input[name$=".startDate"]').first().fill(startDate);
    await fieldset.locator('input[name$=".endDate"]').first().fill(endDate);
  }

  async uploadConventionDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadToContainer(
      uploadContainer(this.conventionFieldset()).first(),
      filePath
    );
  }

  async addConventionAvenant(): Promise<void> {
    await this.conventionFieldset()
      .getByRole("button", { name: /Ajouter un avenant/ })
      .click();
  }

  async fillAvenantDate(date: string): Promise<void> {
    await this.conventionFieldset()
      .locator('input[name$=".date"]')
      .first()
      .fill(date);
  }

  async uploadAvenantDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadToContainer(
      uploadContainer(this.conventionFieldset()).last(),
      filePath
    );
  }

  async addAutreDocument(): Promise<void> {
    await this.autreFieldset()
      .getByRole("button", { name: /Ajouter un document/ })
      .click();
  }

  async fillAutreName(name: string): Promise<void> {
    await this.autreFieldset()
      .locator('input[name$=".name"]')
      .first()
      .fill(name);
  }

  async uploadAutreDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadToContainer(
      uploadContainer(this.autreFieldset()).first(),
      filePath
    );
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
