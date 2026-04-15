import { expect, Page } from "@playwright/test";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { CheckboxHelper } from "../../checkbox-helper";
import { TIMEOUTS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestCpomAjoutData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";
import { BasePage } from "../BasePage";

export class CpomModificationIdentificationPage extends BasePage {
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

  override async waitForLoad(): Promise<void> {
    await this.page
      .locator(SELECTORS.SUBMIT_BUTTON)
      .first()
      .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
  }

  async verifyForm(data: TestCpomAjoutData): Promise<void> {
    await this.waitForLoad();

    const granularityRadio = this.page.locator(
      SELECTORS.CPOM_GRANULARITY_RADIO(data.granularity)
    );
    await expect(granularityRadio).toBeChecked();

    const regionSelect = this.page.locator(SELECTORS.CPOM_REGION_SELECT);
    await expect(regionSelect).toHaveValue(data.region);

    if (data.granularity === "DEPARTEMENTALE") {
      const departements =
        typeof data.departements === "string"
          ? data.departements
          : data.departements[0];
      const departementsSelect = this.page.locator(
        SELECTORS.CPOM_DEPARTEMENTS_SELECT
      );
      const value = await departementsSelect.inputValue().catch(() => "");
      if (value !== "") {
        await expect(departementsSelect).toHaveValue(departements);
      }
    }

    const operateurInput = this.page.locator(SELECTORS.CPOM_OPERATEUR_INPUT);
    await expect(operateurInput).toHaveValue(data.operateur.name);

    const mainActe = data.actesAdministratifs[0];
    if (mainActe) {
      const startInput = this.page
        .locator('input[name^="actesAdministratifs."][name$=".startDate"]')
        .first();
      await startInput.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await expect(startInput).toHaveValue(mainActe.startDate ?? "");
      const endInput = this.page
        .locator('input[name^="actesAdministratifs."][name$=".endDate"]')
        .first();
      const possibleEndDates = [
        mainActe.endDate,
        data.actesAdministratifs[1]?.endDate,
        data.avenants?.[0]?.endDate,
      ].filter(Boolean) as string[];
      const actualEnd = await endInput.inputValue();
      expect(possibleEndDates).toContain(actualEnd);
    }

    if (data.structureIds === "all" || (data.structureIds?.length ?? 0) > 0) {
      const compositionLegend = this.page.locator(
        'legend:has-text("Composition")'
      );
      await compositionLegend
        .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION })
        .catch(() => {});
      await this.waitHelper.waitForUIUpdate(2);
    }
  }

  async fillDescriptionForm(data: TestCpomAjoutData): Promise<void> {
    const granularityRadio = this.page.locator(
      SELECTORS.CPOM_GRANULARITY_RADIO(data.granularity)
    );
    if (
      (await granularityRadio.count()) > 0 &&
      !(await granularityRadio.isChecked()) &&
      (await granularityRadio.isEnabled().catch(() => false))
    ) {
      const granularityLabels: Record<
        TestCpomAjoutData["granularity"],
        string
      > = {
        DEPARTEMENTALE: "Départementale",
        INTERDEPARTEMENTALE: "Interdépartementale",
        REGIONALE: "Régionale",
      };
      await this.page
        .locator(`label:has-text("${granularityLabels[data.granularity]}")`)
        .first()
        .click();
    }

    const operateurInput = this.page.locator(SELECTORS.CPOM_OPERATEUR_INPUT);
    const currentOperateur = await operateurInput.inputValue().catch(() => "");
    if (currentOperateur !== data.operateur.name) {
      await this.autocompleteHelper.fillAndSelectFirst(
        SELECTORS.CPOM_OPERATEUR_INPUT,
        data.operateur.searchTerm
      );
    }
    await this.formHelper.selectOption(
      SELECTORS.CPOM_REGION_SELECT,
      data.region
    );

    if (data.granularity === "DEPARTEMENTALE") {
      const departementValue =
        typeof data.departements === "string"
          ? data.departements
          : data.departements[0];
      await this.formHelper.selectOption(
        SELECTORS.CPOM_DEPARTEMENTS_SELECT,
        departementValue
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
          if (
            (desired.has(value) && !isChecked) ||
            (!desired.has(value) && isChecked)
          ) {
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

    await this.waitHelper.waitForUIUpdate(1);
  }

  async fillActesAdministratifsForm(data: TestCpomAjoutData): Promise<void> {
    const mainActe = data.actesAdministratifs[0];
    if (!mainActe) {
      return;
    }
    await this.formHelper.fillInput(
      SELECTORS.CPOM_ACTE_START_DATE(0),
      mainActe.startDate
    );
    await this.formHelper.fillInput(
      SELECTORS.CPOM_ACTE_END_DATE(0),
      mainActe.endDate
    );
    if (mainActe.filePath) {
      await this.waitHelper.waitForUIUpdate(1);
    }

    const avenant = data.avenants[0];
    if (avenant) {
      const addButton = this.page.getByRole("button", {
        name: "+ Ajouter un avenant",
      });
      const avenantDateInput = this.page.locator(
        'input[name="actesAdministratifs.1.date"]'
      );
      if (
        (await addButton.count()) > 0 &&
        (await avenantDateInput.count()) === 0
      ) {
        await addButton.click();
        await this.waitHelper.waitForUIUpdate(2);
      }

      if ((await avenantDateInput.count()) > 0 && avenant.date) {
        await avenantDateInput.fill(avenant.date);
      }

      const extendLabel = this.page
        .locator('label:has-text("Cet avenant modifie la date de fin du CPOM")')
        .first();
      if ((await extendLabel.count()) > 0 && avenant.endDate) {
        const isChecked = await this.page
          .locator('input[name="actesAdministratifs.1.hasEndDate"]')
          .isChecked()
          .catch(() => false);
        if (!isChecked) {
          await extendLabel.click();
          await this.waitHelper.waitForUIUpdate(1);
        }
        const avenantEndInput = this.page.locator(
          'input[name="actesAdministratifs.1.endDate"]'
        );
        await avenantEndInput.fill(avenant.endDate);
      }

      if (avenant.filePath) {
        await this.waitHelper.waitForUIUpdate(1);
      }
    }

    await this.waitHelper.waitForUIUpdate(1);
  }

  async fillCompositionForm(data: TestCpomAjoutData): Promise<void> {
    await this.waitHelper.waitForUIUpdate(1);
    if (data.structureIds === "all") {
      await this.checkboxHelper.clickByValue("isAllStructuresSelected");
    } else if (data.structureIds?.length) {
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
    await this.waitHelper.waitForUIUpdate(1);
  }

  async submit(): Promise<void> {
    const openDepartementsPanel = this.page.locator(
      'button[aria-expanded="true"]'
    );
    if ((await openDepartementsPanel.count()) > 0) {
      await openDepartementsPanel.first().click();
      await this.waitHelper.waitForUIUpdate(1);
    }
    await this.page.click(SELECTORS.SUBMIT_BUTTON, { force: true });
    await this.waitHelper.waitForUIUpdate(2);
  }
}
