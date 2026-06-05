import type { Page } from "@playwright/test";

import { ControleType } from "@/types/controle.type";

import { expect } from "../fixtures/test";
import { SAMPLE_PDF, uploadToField } from "./upload.helper";

export type Section =
  | "description"
  | "type-places"
  | "finances"
  | "controle-qualite"
  | "notes"
  | "actes-administratifs";

const CONVENTION_INDEX = 0;
const AUTRE_INDEX = 1;
const AVENANT_INDEX = 2;

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
    await this.page.locator(`input[name="controles.0.date"]`).fill(date);
    await this.page
      .locator(`select[name="controles.0.type"]`)
      .selectOption(type);
  }

  async uploadControleRapport(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadToField(this.page, "controles.0.fileUploads.0.key", filePath);
  }

  async fillConventionDates(startDate: string, endDate: string): Promise<void> {
    await this.page
      .locator(
        `input[name="actesAdministratifs.${CONVENTION_INDEX}.startDate"]`
      )
      .fill(startDate);
    await this.page
      .locator(`input[name="actesAdministratifs.${CONVENTION_INDEX}.endDate"]`)
      .fill(endDate);
  }

  async uploadConventionDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadToField(
      this.page,
      `actesAdministratifs.${CONVENTION_INDEX}.fileUploads.0.key`,
      filePath
    );
  }

  async addConventionAvenant(): Promise<void> {
    await this.page.getByRole("button", { name: /Ajouter un avenant/ }).click();
  }

  async fillAvenantDate(date: string): Promise<void> {
    await this.page
      .locator(`input[name="actesAdministratifs.${AVENANT_INDEX}.date"]`)
      .fill(date);
  }

  async uploadAvenantDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadToField(
      this.page,
      `actesAdministratifs.${AVENANT_INDEX}.fileUploads.0.key`,
      filePath
    );
  }

  async fillAutreName(name: string): Promise<void> {
    await this.page
      .locator(`input[name="actesAdministratifs.${AUTRE_INDEX}.name"]`)
      .fill(name);
  }

  async uploadAutreDocument(filePath: string = SAMPLE_PDF): Promise<void> {
    await uploadToField(
      this.page,
      `actesAdministratifs.${AUTRE_INDEX}.fileUploads.0.key`,
      filePath
    );
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
