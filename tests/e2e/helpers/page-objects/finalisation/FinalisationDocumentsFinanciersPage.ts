import { Page } from "@playwright/test";

export class FinalisationDocumentsFinanciersPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillMinimalData() {
    const dateToggle = this.page.getByRole("checkbox", {
      name: /date de rattachement au programme 303/i,
    });
    if ((await dateToggle.count()) > 0) {
      await dateToggle.check({ force: true });
      await this.page.fill('input[name="date303"]', "2026-01-01");
    }
  }

  async submit(structureId: number) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/structures/${structureId}/finalisation/03-finance`,
      { timeout: 10000 }
    );
  }
}
