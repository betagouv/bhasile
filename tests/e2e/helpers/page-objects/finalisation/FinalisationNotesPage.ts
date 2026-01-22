import { TIMEOUTS, URLS } from "../../constants";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class FinalisationNotesPage extends BasePage {
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
    await this.submitAndWaitForUrl(
      URLS.finalisationStep(structureId, "06-notes")
    );
  }

  async finalizeAndGoToStructure(structureId: number) {
    await this.page
      .getByRole("button", { name: "Finaliser la création" })
      .click();
    const confirmButton = this.page.getByRole("button", {
      name: /J.?ai compris/i,
    });
    await confirmButton.click();
    await this.page.waitForURL(URLS.structure(structureId));
  }
}
