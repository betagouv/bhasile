import type { Page } from "@playwright/test";

import { ControleType } from "@/types/controle.type";

import { expect } from "../fixtures/test";

export type Section =
  | "description"
  | "type-places"
  | "finances"
  | "controle-qualite"
  | "notes"
  | "actes-administratifs";

export class StructureModificationPage {
  constructor(
    private readonly page: Page,
    private readonly structureId: number
  ) {}

  async goto(section: Section): Promise<void> {
    await this.page.goto(
      `/structures/${this.structureId}/modification/${section}`,
      { waitUntil: "domcontentloaded" }
    );
    await this.waitForForm();
  }

  async waitForForm(): Promise<void> {
    await expect(
      this.page.getByRole("button", { name: "Valider", exact: true })
    ).toBeVisible();
    await this.page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
  }

  async fillNotes(text: string): Promise<void> {
    const textarea = this.page.locator("textarea#notes").last();
    await textarea.fill(text);
  }

  async selectPublic(label: string): Promise<void> {
    await this.page.getByLabel("Public").selectOption({ label });
  }

  async fillPlacesAutorisees(
    yearRowIndex: number,
    value: number
  ): Promise<void> {
    await this.page
      .locator(
        `input[id="structureTypologies.${yearRowIndex}.placesAutorisees"]`
      )
      .fill(String(value));
  }

  async fillDotationDemandee(
    yearRowIndex: number,
    value: number
  ): Promise<void> {
    await this.page
      .locator(`input[id="budgets.${yearRowIndex}.dotationDemandee"]`)
      .fill(String(value));
  }

  async markStructureHasNoEvaluation(): Promise<void> {
    await this.page
      .locator(`input[name="noEvaluationStructure"]`)
      .check({ force: true });
  }

  async addControle(date: string, type: ControleType): Promise<void> {
    await this.page
      .getByRole("button", { name: /Ajouter une inspection-contrôle/ })
      .click();
    await this.page.locator(`input[name="controles.0.date"]`).fill(date);
    await this.page
      .locator(`select[name="controles.0.type"]`)
      .selectOption(type);
  }

  async toggleLgbt(): Promise<void> {
    await this.page.getByLabel("LGBT").click();
  }

  async submitAndWaitForSave(): Promise<void> {
    const savePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes(`/api/structures/${this.structureId}`) &&
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
