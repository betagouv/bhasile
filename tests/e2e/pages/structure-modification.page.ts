import type { Page } from "@playwright/test";

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
