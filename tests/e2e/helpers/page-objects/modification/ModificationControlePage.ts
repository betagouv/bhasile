import { expect, Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { ModificationData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class ModificationControlePage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }

  override async waitForLoad() {
    await this.waitForHeading(/Modification/i);
    await super.waitForLoad();
  }

  async fillForm(data: ModificationData) {
    await this.fillEvaluations(data);
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    await this.fillControles(data);
  }

  async submit(structureId: number) {
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
    await submitButton.waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION });
    await submitButton.click({ force: true });
    await this.page.waitForURL(URLS.structure(structureId), { timeout: 30000 });
  }

  private async setFileInput(
    keySelector: string,
    filePath: string,
    keyTimeout = TIMEOUTS.NAVIGATION
  ) {
    const keyInput = this.page.locator(keySelector);
    if ((await keyInput.count()) === 0) return;
    await keyInput.waitFor({ state: "attached", timeout: TIMEOUTS.NAVIGATION });
    let fileInput = keyInput
      .locator("..")
      .locator(SELECTORS.FILE_INPUT)
      .first();
    if ((await fileInput.count()) === 0) {
      const match = keySelector.match(/evaluations\.(\d+)\.fileUploads\.(\d+)/);
      if (match) {
        const evalIndex = match[1];
        const row = this.page
          .locator(`input[name="evaluations.${evalIndex}.date"]`)
          .locator("../..");
        fileInput = row.locator(SELECTORS.FILE_INPUT).first();
      }
    }
    await fileInput.waitFor({
      state: "attached",
      timeout: TIMEOUTS.FILE_UPLOAD,
    });
    await fileInput.setInputFiles(filePath);
    await expect(keyInput).toHaveValue(/.+/, { timeout: keyTimeout });
  }

  private async fillEvaluations(data: ModificationData) {
    const evaluations = data.evaluations ?? [];
    if (evaluations.length === 0) return;

    const evaluationsFieldset = this.page.getByRole("group", {
      name: /Évaluations/i,
    });
    if ((await evaluationsFieldset.count()) === 0) return;

    const addButton = evaluationsFieldset.getByRole("button", {
      name: /Ajouter une évaluation/i,
    });
    const existingCount = await this.page
      .locator('input[name^="evaluations."][name$=".date"]')
      .count();
    for (let i = existingCount; i < evaluations.length; i++) {
      await addButton.click();
      await this.page
        .locator(`input[name="evaluations.${i}.date"]`)
        .waitFor({ state: "attached", timeout: TIMEOUTS.FILE_UPLOAD });
    }

    for (let i = 0; i < evaluations.length; i++) {
      const evaluation = evaluations[i];
      const dateSelector = `input[name="evaluations.${i}.date"]`;
      await this.formHelper.fillInput(dateSelector, evaluation.date);
      if (evaluation.notePersonne !== undefined) {
        await this.formHelper.fillInputIfExists(
          `input[name="evaluations.${i}.notePersonne"]`,
          String(evaluation.notePersonne)
        );
      }
      if (evaluation.notePro !== undefined) {
        await this.formHelper.fillInputIfExists(
          `input[name="evaluations.${i}.notePro"]`,
          String(evaluation.notePro)
        );
      }
      if (evaluation.noteStructure !== undefined) {
        await this.formHelper.fillInputIfExists(
          `input[name="evaluations.${i}.noteStructure"]`,
          String(evaluation.noteStructure)
        );
      }
      if (evaluation.note !== undefined) {
        await this.formHelper.fillInputIfExists(
          `input[name="evaluations.${i}.note"]`,
          String(evaluation.note)
        );
      }
      if (evaluation.filePath) {
        await this.setFileInput(
          `input[name="evaluations.${i}.fileUploads.0.key"]`,
          evaluation.filePath,
          TIMEOUTS.FILE_UPLOAD
        );
      }
    }
  }

  private async fillControles(data: ModificationData) {
    const controles = data.controles ?? [];
    if (controles.length === 0) return;

    const controlesFieldset = this.page.getByRole("group", {
      name: /Inspections-contrôles/i,
    });
    if ((await controlesFieldset.count()) === 0) return;

    const addButton = controlesFieldset.getByRole("button", {
      name: /Ajouter une inspection-contrôle/i,
    });
    const existingCount = await controlesFieldset
      .locator('input[name^="controles."][name$=".date"]')
      .count();
    for (let i = existingCount; i < controles.length; i++) {
      await addButton.click();
    }

    for (let i = 0; i < controles.length; i++) {
      const controle = controles[i];
      await this.formHelper.fillInput(
        `input[name="controles.${i}.date"]`,
        controle.date
      );
      await this.formHelper.selectOption(`select[name="controles.${i}.type"]`, {
        label: controle.type,
      });
      if (controle.filePath) {
        const keyInput = this.page.locator(
          `input[name="controles.${i}.fileUploads.0.key"]`
        );
        if ((await keyInput.count()) > 0) {
          const fileInput = keyInput
            .locator("..")
            .locator(SELECTORS.FILE_INPUT)
            .first();
          await fileInput.setInputFiles(controle.filePath);
          await expect(keyInput).toHaveValue(/.+/, {
            timeout: TIMEOUTS.FILE_UPLOAD,
          });
        }
      }
    }
  }
}
