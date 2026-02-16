import { Page } from "@playwright/test";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { CheckboxHelper } from "../../checkbox-helper";
import { TIMEOUTS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestCpomAjoutData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class CpomAjoutIdentificationPage extends BasePage {
  private formHelper: FormHelper;
  private waitHelper: WaitHelper;
  private autocompleteHelper: AutocompleteHelper;
  private checkboxHelper: CheckboxHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
    this.waitHelper = new WaitHelper(page);
    this.autocompleteHelper = new AutocompleteHelper(page);
    this.checkboxHelper = new CheckboxHelper(page);
  }

  async fillForm(data: TestCpomAjoutData): Promise<void> {
    const granularityLabels: Record<TestCpomAjoutData["granularity"], string> =
      {
        DEPARTEMENTALE: "Départementale",
        INTERDEPARTEMENTALE: "Interdépartementale",
        REGIONALE: "Régionale",
      };
    const radio = this.page.getByRole("radio", {
      name: granularityLabels[data.granularity],
      exact: true,
    });
    if (!(await radio.isChecked())) {
      await this.page
        .locator(`label:has-text("${granularityLabels[data.granularity]}")`)
        .first()
        .click();
    }

    await this.autocompleteHelper.fillAndSelectFirst(
      SELECTORS.CPOM_OPERATEUR_INPUT,
      data.operateur.searchTerm
    );

    await this.formHelper.selectOption(
      SELECTORS.CPOM_REGION_SELECT,
      data.region
    );

    if (data.granularity === "DEPARTEMENTALE") {
      const departements =
        typeof data.departements === "string"
          ? data.departements
          : data.departements[0];
      await this.formHelper.selectOption(
        SELECTORS.CPOM_DEPARTEMENTS_SELECT,
        departements
      );
    } else if (data.granularity === "INTERDEPARTEMENTALE") {
      const desired = new Set(
        (Array.isArray(data.departements) ? data.departements : []).map(String)
      );
      if (desired.size > 0) {
        const panelButton = this.page
          .locator('label:has-text("Départements")')
          .first()
          .locator("..")
          .getByRole("button");
        await panelButton.waitFor({
          state: "visible",
          timeout: TIMEOUTS.NAVIGATION,
        });
        await panelButton.click();
        await this.waitHelper.waitForUIUpdate(1);

        const checkboxes = this.page.locator(
          'input[name="structure-departement"]'
        );
        const count = await checkboxes.count();
        for (let i = 0; i < count; i++) {
          const cb = checkboxes.nth(i);
          const value = await cb.getAttribute("value");
          if (!value) {
            continue;
          }
          const isChecked = await cb.isChecked();
          if (desired.has(value) && !isChecked) {
            const id = await cb.getAttribute("id");
            const label = id
              ? this.page.locator(`label[for="${id}"]`)
              : cb.locator("..").locator("label").first();
            await label.click();
            await this.waitHelper.waitForUIUpdate(1);
          } else if (!desired.has(value) && isChecked) {
            const id = await cb.getAttribute("id");
            const label = id
              ? this.page.locator(`label[for="${id}"]`)
              : cb.locator("..").locator("label").first();
            await label.click();
            await this.waitHelper.waitForUIUpdate(1);
          }
        }

        await panelButton.click();
        await this.waitHelper.waitForUIUpdate(1);
      }
    }

    await this.waitHelper.waitForUIUpdate(2);

    const mainActe = data.actesAdministratifs[0];
    if (mainActe) {
      await this.formHelper.fillInput(
        SELECTORS.CPOM_ACTE_START_DATE(0),
        mainActe.startDate
      );
      await this.formHelper.fillInput(
        SELECTORS.CPOM_ACTE_END_DATE(0),
        mainActe.endDate
      );

      if (mainActe.filePath) {
        const fileInput = this.page.locator('input[type="file"]').first();
        await fileInput.setInputFiles(mainActe.filePath);

        await this.page
          .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
          .catch(() => {});
      }
    }

    const avenant = data.avenants[0];
    if (avenant) {
      await this.page
        .getByRole("link", { name: "+ Ajouter un avenant" })
        .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
      await this.page
        .getByRole("link", { name: "+ Ajouter un avenant" })
        .click();

      await this.waitHelper.waitForUIUpdate(2);

      const avenantDateInput = this.page.locator(
        'input[name="actesAdministratifs.1.date"]'
      );
      if ((await avenantDateInput.count()) > 0 && avenant.date) {
        await avenantDateInput.fill(avenant.date);
      }

      const extendLabel = this.page
        .locator('label:has-text("Cet avenant modifie la date de fin du CPOM")')
        .first();
      if ((await extendLabel.count()) > 0 && avenant.endDate) {
        await extendLabel.click();
        await this.waitHelper.waitForUIUpdate(1);
        const avenantEndInput = this.page.locator(
          'input[name="actesAdministratifs.1.endDate"]'
        );
        await avenantEndInput.fill(avenant.endDate);
      }

      if (avenant.filePath) {
        const fileInputs = this.page.locator('input[type="file"]');
        await fileInputs.nth(1).setInputFiles(avenant.filePath);
        await this.page
          .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
          .catch(() => {});
      }
    }

    await this.waitHelper.waitForUIUpdate(2);
    if (data.structureIds === "all") {
      const compositionLegend = this.page.locator(
        'legend:has-text("Composition")'
      );
      await compositionLegend.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await this.waitHelper.waitForUIUpdate(1);
      await this.checkboxHelper.clickByValue("isAllStructuresSelected");
    } else if (data.structureIds?.length) {
      const compositionLegend = this.page.locator(
        'legend:has-text("Composition")'
      );
      await compositionLegend.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await this.waitHelper.waitForUIUpdate(1);
      for (const structureId of data.structureIds) {
        const cb = this.page.locator(
          `input[name="structures"][value="${structureId}"]`
        );
        if ((await cb.count()) > 0 && !(await cb.isChecked())) {
          const id = await cb.getAttribute("id");
          const label = id
            ? this.page.locator(`label[for="${id}"]`)
            : cb.locator("..").locator("label").first();
          await label.click();
        }
      }
    }
  }

  async submit(expectValidationFailure = false): Promise<number | null> {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
      return null;
    }
    await this.page.click(SELECTORS.SUBMIT_BUTTON);
    await this.page.waitForURL(/\/cpoms\/\d+\/modification\/02-finance/, {
      timeout: TIMEOUTS.SUBMIT,
    });
    const url = this.page.url();
    const match = url.match(/\/cpoms\/(\d+)\/modification\/02-finance/);
    return match ? parseInt(match[1], 10) : null;
  }
}
