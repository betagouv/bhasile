import { Page } from "@playwright/test";

export class FinalisationNotesPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillNotes(notes: string = "Notes de test pour la finalisation") {
    await this.page.fill('textarea[name="notes"]', notes);
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/structures/${structureId}/finalisation/06-notes`,
      { timeout: 10000 }
    );
  }

  async verifySuccess() {
    await this.page.waitForTimeout(1000);
  }
}
