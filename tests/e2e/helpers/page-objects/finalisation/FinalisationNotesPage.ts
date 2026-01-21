import { Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { TestStructureData } from "../../test-data";

export class FinalisationNotesPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  async fillForm(data: TestStructureData) {
    const notes =
      data.finalisationNotes || "Notes de test pour la finalisation";
    const saveResponse = this.page.waitForResponse(
      (response) =>
        response.url().includes("/api/structures") &&
        response.request().method() === "PUT" &&
        response.status() < 400,
      { timeout: TIMEOUTS.NAVIGATION }
    );
    await this.page.fill('textarea[name="notes"]', notes);
    await saveResponse;
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(URLS.finalisationStep(structureId, "06-notes"), {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  async finalizeAndGoToStructure(structureId: number) {
    await this.page
      .getByRole("button", { name: "Finaliser la création" })
      .click();
    const confirmButton = this.page.getByRole("button", {
      name: "J'ai compris",
    });
    await confirmButton.click();
    await this.page.waitForURL(URLS.structure(structureId));
  }
}
