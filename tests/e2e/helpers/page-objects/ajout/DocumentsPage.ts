import { expect, Page } from "@playwright/test";

import { handleDocumentsFinanciers } from "../../documents-financiers-helper";
import { TestStructureData } from "../../test-data";

export class DocumentsPage {
  constructor(private page: Page) {}

  async fillForm(
    options?: UploadOptions | UploadOptions[] | TestStructureData
  ) {
    if (!options) {
      return;
    }

    if (!Array.isArray(options) && "documentsFinanciers" in options) {
      await handleDocumentsFinanciers(this.page, options, "ajout");
      return;
    }

    const uploads = Array.isArray(options) ? options : [options];
    const uploadsByYear = uploads.reduce(
      (acc, upload) => {
        const year = upload.year ?? 2025;
        acc[year] = acc[year] || [];
        acc[year].push({ ...upload, year });
        return acc;
      },
      {} as Record<number, UploadOptions[]>
    );

    const years = Object.keys(uploadsByYear)
      .map((year) => Number(year))
      .sort((a, b) => b - a);
    for (const year of years) {
      for (const upload of uploadsByYear[year]) {
        await this.addUpload(upload);
      }
    }
  }

  async submit(dnaCode: string) {
    await this.page.click('button[type="submit"]');
    await this.page.waitForURL(
      `http://localhost:3000/ajout-structure/${dnaCode}/05-verification`,
      { timeout: 10000 }
    );
  }

  private async addUpload({
    filePath,
    year = 2025,
    categoryLabel,
  }: UploadOptions) {
    const yearHeading = this.page.getByRole("heading", {
      name: String(year),
    });
    const yearFieldset = this.page.locator("fieldset", { has: yearHeading });
    const fileInput = yearFieldset.locator('input[type="file"]').last();
    await fileInput.setInputFiles(filePath);

    const categorySelect = yearFieldset.getByRole("combobox", {
      name: "Type de document",
    });
    await expect(categorySelect).toBeVisible();
    await categorySelect.selectOption({ label: categoryLabel });

    const addButton = yearFieldset.getByRole("button", {
      name: "Ajouter le document",
    });
    await expect(addButton).toBeEnabled();
    await addButton.click();
  }
}

type UploadOptions = {
  filePath: string;
  categoryLabel: string;
  year?: number;
};
