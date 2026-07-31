import type { Locator, Page } from "@playwright/test";

import { ControleType } from "@/types/controle.type";

import { expect } from "../fixtures/test";
import {
  fillActeDate,
  fillActeName,
  fillActeStartEndDates,
  uploadActeDocument,
} from "./shared/actes.helper";
import { SAMPLE_PDF } from "./upload.helper";

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

  placesAutoriseesInput(yearRowIndex: number): Locator {
    return this.page.locator(
      `input[id="structureTypologies.${yearRowIndex}.placesAutorisees"]`
    );
  }

  async fillPlacesAutorisees(
    yearRowIndex: number,
    value: number
  ): Promise<void> {
    await this.placesAutoriseesInput(yearRowIndex).fill(String(value));
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

  private controlesFieldset(): Locator {
    return this.page.locator(
      'fieldset:has(> legend:has-text("Inspections-contrôles"))'
    );
  }

  private conventionFieldset(): Locator {
    return this.page.locator('fieldset:has(> legend:has-text("Conventions"))');
  }

  private autreFieldset(): Locator {
    return this.page.locator(
      'fieldset:has(> legend:has-text("Autres documents"))'
    );
  }

  async addControle(date: string, type: ControleType): Promise<void> {
    const fieldset = this.controlesFieldset();
    await fieldset.locator('input[name$=".date"]').first().fill(date);
    await fieldset.locator('select[name$=".type"]').first().selectOption(type);
  }

  async uploadControleRapport(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadActeDocument(this.controlesFieldset(), filePath);
  }

  async fillConventionDates(startDate: string, endDate: string): Promise<void> {
    await fillActeStartEndDates(this.conventionFieldset(), startDate, endDate);
  }

  async uploadConventionDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadActeDocument(this.conventionFieldset(), filePath);
  }

  async addConventionAvenant(): Promise<void> {
    await this.conventionFieldset()
      .getByRole("button", { name: /Ajouter un avenant/ })
      .click();
  }

  async fillAvenantDate(date: string): Promise<void> {
    await fillActeDate(this.conventionFieldset().locator("div.border-l-2"), date);
  }

  async uploadAvenantDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadActeDocument(
      this.conventionFieldset().locator("div.border-l-2"),
      filePath
    );
  }

  async fillAutreName(name: string): Promise<void> {
    await fillActeName(this.autreFieldset(), name);
  }

  async uploadAutreDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadActeDocument(this.autreFieldset(), filePath);
  }

  async submitAndWaitForSave(): Promise<void> {
    const savePromise = this.page.waitForResponse(
      (response) =>
        response.url().includes(`/api/structures/${this.structureId}`) &&
        response.request().method() === "PUT" &&
        response.ok(),
      { timeout: 30000 }
    );
    await this.page
      .getByRole("button", { name: "Valider", exact: true })
      .click();
    await savePromise;
  }
}
