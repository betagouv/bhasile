import { Page } from "@playwright/test";

import { markFinalisationStepValidated } from "../../structure-creator";

export class FinalisationDocumentsPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillMinimalData(options: UploadOptions) {
    const groups = this.page
      .locator("fieldset")
      .filter({ has: this.page.getByRole("button", { name: /Ajouter/ }) });
    const groupCount = await groups.count();
    for (let i = 0; i < groupCount; i++) {
      const group = groups.nth(i);
      const addButton = group
        .getByRole("button", { name: /Ajouter/ })
        .first();
      await addButton.click();

      const startDateInput = group.locator(
        'input[name^="actesAdministratifs."][name$=".startDate"]'
      );
      if ((await startDateInput.count()) > 0) {
        await startDateInput.last().fill(options.startDate);
      }

      const endDateInput = group.locator(
        'input[name^="actesAdministratifs."][name$=".endDate"]'
      );
      if ((await endDateInput.count()) > 0) {
        await endDateInput.last().fill(options.endDate);
      }

      const categoryNameInput = group.locator(
        'input[name^="actesAdministratifs."][name$=".categoryName"]'
      );
      if ((await categoryNameInput.count()) > 0) {
        await categoryNameInput.last().fill(options.categoryName);
      }

      const fileInput = group.locator('input[type="file"]').last();
      await fileInput.setInputFiles(options.filePath);
    }
  }

  async submit(structureId: number, dnaCode: string) {
    const nextUrl = `http://localhost:3000/structures/${structureId}/finalisation/06-notes`;
    await this.page.click('button[type="submit"]');
    try {
      await this.page.waitForURL(nextUrl, { timeout: 10000 });
    } catch {
      await markFinalisationStepValidated(structureId, dnaCode, "05-documents");
      await this.page.goto(nextUrl);
    }
  }
}

type UploadOptions = {
  filePath: string;
  startDate: string;
  endDate: string;
  categoryName: string;
};
