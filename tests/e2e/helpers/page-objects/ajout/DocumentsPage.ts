import { expect, Page } from "@playwright/test";

export class DocumentsPage {
  constructor(private page: Page) {}

  async fillForm(options?: UploadOptions | UploadOptions[]) {
    if (!options) {
      return;
    }

    const uploads = Array.isArray(options) ? options : [options];
    for (const upload of uploads) {
      await this.addUpload(upload);
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
