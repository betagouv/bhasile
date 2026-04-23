import { Page } from "@playwright/test";

import { AutocompleteHelper } from "../../autocomplete-helper";
import { CheckboxHelper } from "../../checkbox-helper";
import { TIMEOUTS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestCpomAjoutData } from "../../test-data/cpom-types";
import { WaitHelper } from "../../wait-helper";

type FillGeneralOptions = {
  skipOperatorIfAlreadyMatching?: boolean;
};

type FillActesOptions = {
  uploadFiles?: boolean;
  addAvenantOnlyIfMissing?: boolean;
};

type FillCompositionOptions = {
  waitForCompositionLegend?: boolean;
};

export class CpomIdentificationFormHelper {
  constructor(
    private readonly page: Page,
    private readonly formHelper: FormHelper,
    private readonly waitHelper: WaitHelper,
    private readonly autocompleteHelper: AutocompleteHelper,
    private readonly checkboxHelper: CheckboxHelper
  ) {}

  async fillGeneralFields(
    data: TestCpomAjoutData,
    options: FillGeneralOptions = {}
  ): Promise<void> {
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

    if (options.skipOperatorIfAlreadyMatching) {
      const operateurInput = this.page.locator(SELECTORS.CPOM_OPERATEUR_INPUT);
      const currentOperateur = await operateurInput
        .inputValue()
        .catch(() => "");
      if (currentOperateur !== data.operateur.name) {
        await this.autocompleteHelper.fillAndSelectFirst(
          SELECTORS.CPOM_OPERATEUR_INPUT,
          data.operateur.searchTerm
        );
      }
    } else {
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
  }

  async fillActesFields(
    data: TestCpomAjoutData,
    options: FillActesOptions = {}
  ): Promise<void> {
    const { uploadFiles = true, addAvenantOnlyIfMissing = false } = options;
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
        if (uploadFiles) {
          const fileInput = this.page.locator('input[type="file"]').first();
          await fileInput.setInputFiles(mainActe.filePath);
          await this.page
            .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
            .then(async () => await this.waitHelper.waitForUIUpdate(2))
            .catch(() => {});
        } else {
          await this.waitHelper.waitForUIUpdate(1);
        }
      }
    }

    const avenant = data.avenants[0];
    if (!avenant) {
      return;
    }

    const addButton = this.page.getByRole("button", {
      name: "+ Ajouter un avenant",
    });
    if (addAvenantOnlyIfMissing) {
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
    } else {
      await addButton.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await addButton.click();
      await this.waitHelper.waitForUIUpdate(2);
    }

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
      if (addAvenantOnlyIfMissing) {
        const isChecked = await this.page
          .locator('input[name="actesAdministratifs.1.hasEndDate"]')
          .isChecked()
          .catch(() => false);
        if (!isChecked) {
          await extendLabel.click();
          await this.waitHelper.waitForUIUpdate(1);
        }
      } else {
        await extendLabel.click();
        await this.waitHelper.waitForUIUpdate(1);
      }
      const avenantEndInput = this.page.locator(
        'input[name="actesAdministratifs.1.endDate"]'
      );
      await avenantEndInput.fill(avenant.endDate);
    }

    if (!avenant.filePath) {
      return;
    }

    if (uploadFiles) {
      const fileInputs = this.page.locator('input[type="file"]');
      const fileInputsCount = await fileInputs.count();
      if (fileInputsCount >= 2) {
        await fileInputs.nth(1).setInputFiles(avenant.filePath);
      } else if (fileInputsCount === 1) {
        await fileInputs.first().setInputFiles(avenant.filePath);
      }
      await this.page
        .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
        .catch(() => {});
    } else {
      await this.waitHelper.waitForUIUpdate(1);
    }
  }

  async fillCompositionFields(
    data: TestCpomAjoutData,
    options: FillCompositionOptions = {}
  ): Promise<void> {
    if (options.waitForCompositionLegend) {
      const compositionLegend = this.page.locator(
        'legend:has-text("Composition")'
      );
      await compositionLegend.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
    }
    await this.waitHelper.waitForUIUpdate(1);

    if (data.structureIds === "all") {
      await this.checkboxHelper.clickByValue("isAllStructuresSelected");
      return;
    }
    if (!data.structureIds?.length) {
      return;
    }
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
