import { Page } from "@playwright/test";

import { TestStructureData } from "../../test-data";

export class FinalisationNotesPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillNotes(data: TestStructureData) {
    const notes =
      data.finalisationNotes || "Notes de test pour la finalisation";
    const saveResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/structures") &&
        response.request().method() === "PUT" &&
        response.status() < 400,
      { timeout: 10000 }
    );
    await this.page.fill('textarea[name="notes"]', notes);
    await saveResponse;
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/structures/${structureId}/finalisation/06-notes`,
      { timeout: 10000 }
    );
  }

  async finalizeAndGoToStructure(structureId: number) {
    await this.page
      .getByRole("button", { name: "Finaliser la création" })
      .click();
    const confirmButton = this.page.getByRole("button", {
      name: "J’ai compris",
    });
    await confirmButton.click();
    await this.page.waitForURL(
      `http://localhost:3000/structures/${structureId}`
    );
  }
}
