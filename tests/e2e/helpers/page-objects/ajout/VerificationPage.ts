import { expect, Page } from "@playwright/test";

import { TestStructureData } from "../../test-data";

export class VerificationPage {
  constructor(private page: Page) {}

  async verifyData(data: TestStructureData) {
    // Wait for the verification page to load
    await this.page.waitForTimeout(1000);

    // Verify we're on the verification page by checking for the main heading
    await expect(
      this.page.getByRole("heading", { name: /Vérification des données/i })
    ).toBeVisible({ timeout: 10000 });

    // Basic verification - just check that some key data is present
    // The email should be visible somewhere on the page
    await expect(
      this.page.locator(`text=${data.contactPrincipal.email}`)
    ).toBeVisible({ timeout: 5000 });
  }

  async submit(dnaCode: string) {
    await this.page.click('button:has-text("Valider")');
    await this.page.waitForURL(
      `http://localhost:3000/ajout-structure/${dnaCode}/06-confirmation`,
      { timeout: 15000 }
    );
  }
}
