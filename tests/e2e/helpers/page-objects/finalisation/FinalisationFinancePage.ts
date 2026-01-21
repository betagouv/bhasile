import { Page } from "@playwright/test";

import { markFinalisationStepValidated } from "../../structure-creator";

export class FinalisationFinancePage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: 10000,
    });
  }

  async fillMinimalData() {
    // Finance form has many required fields per year
    // Wait for the form to fully render
    await this.page.waitForTimeout(1000);

    // Fill required fields for each of the 5 years (2025, 2024, 2023, 2022, 2021)
    for (let i = 0; i < 5; i++) {
      // Basic indicators (required for all years)
      await this.fillIfEnabled(`input[name="budgets.${i}.ETP"]`, "10");
      await this.fillIfEnabled(
        `input[name="budgets.${i}.tauxEncadrement"]`,
        "0.5"
      );
      await this.fillIfEnabled(
        `input[name="budgets.${i}.coutJournalier"]`,
        "50"
      );

      // Year 2025 and 2024 (current/forecast years)
      if (i <= 1) {
        await this.fillIfEnabled(
          `input[name="budgets.${i}.dotationDemandee"]`,
          "100000"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.dotationAccordee"]`,
          "100000"
        );
      }

      // Years 2023, 2022, 2021 (historical years - more fields required)
      if (i >= 2) {
        await this.fillIfEnabled(
          `input[name="budgets.${i}.dotationDemandee"]`,
          "100000"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.dotationAccordee"]`,
          "100000"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.totalProduitsProposes"]`,
          "100000"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.totalProduits"]`,
          "100000"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.totalChargesProposees"]`,
          "95000"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.totalCharges"]`,
          "95000"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.repriseEtat"]`,
          "0"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.excedentRecupere"]`,
          "0"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.excedentDeduit"]`,
          "0"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.fondsDedies"]`,
          "0"
        );
        await this.fillIfEnabled(
          `input[name="budgets.${i}.affectationReservesFondsDedies"]`,
          "0"
        );
      }
    }

    await this.fillRemainingBudgetFields();
  }

  async submit(structureId: number, dnaCode: string) {
    const nextUrl = `http://localhost:3000/structures/${structureId}/finalisation/04-controles`;
    await this.page.click('button[type="submit"]');
    try {
      await this.page.waitForURL(nextUrl, { timeout: 10000 });
    } catch {
      await markFinalisationStepValidated(structureId, dnaCode, "03-finance");
      await this.page.goto(nextUrl);
    }
  }

  private async fillIfEnabled(selector: string, value: string) {
    const input = this.page.locator(selector);
    if ((await input.count()) === 0) {
      return;
    }
    if (await input.isEnabled()) {
      await input.fill(value);
    }
  }

  private async fillRemainingBudgetFields() {
    const inputs = this.page.locator('input[name^="budgets."]');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      if (!(await input.isEnabled())) {
        continue;
      }
      const type = await input.getAttribute("type");
      if (type === "hidden") {
        continue;
      }
      const value = await input.inputValue();
      if (value === "") {
        await input.fill("1");
      }
    }
  }
}
