import { expect, Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { FormHelper } from "../../form-helper";
import { SELECTORS } from "../../selectors";
import { TestStructureData } from "../../test-data/types";
import { BasePage } from "../BasePage";

export class FinalisationControlesPage extends BasePage {
  private formHelper: FormHelper;

  constructor(page: Page) {
    super(page);
    this.formHelper = new FormHelper(page);
  }
  async fillForm(data: TestStructureData) {
    await this.fillEvaluations(data);
    await this.page
      .waitForLoadState("networkidle", { timeout: TIMEOUTS.FILE_UPLOAD })
      .catch(() => {});
    await this.fillControles(data);
    await this.fillOuvertureFermeture(data);
  }

  async submit(structureId: number, expectValidationFailure = false) {
    if (expectValidationFailure) {
      await this.submitAndExpectNoNavigation();
    } else {
      await this.page
        .waitForLoadState("networkidle", {
          timeout: TIMEOUTS.FILE_UPLOAD,
        })
        .catch(() => {});
      const submitButton = this.page.locator(SELECTORS.SUBMIT_BUTTON);
      await submitButton.waitFor({
        state: "visible",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await submitButton.click({ force: true });
      await this.page.waitForURL(
        URLS.finalisationStep(structureId, "05-documents"),
        { timeout: 30000 }
      );
    }
  }

  private async setFileInput(
    keySelector: string,
    filePath: string,
    keyTimeout: number = TIMEOUTS.NAVIGATION
  ) {
    const keyInput = this.page.locator(keySelector);
    if ((await keyInput.count()) === 0) {
      return;
    }
    await keyInput.waitFor({ state: "attached", timeout: TIMEOUTS.NAVIGATION });
    let fileInput = keyInput
      .locator("..")
      .locator(SELECTORS.FILE_INPUT)
      .first();
    if ((await fileInput.count()) === 0) {
      const match = keySelector.match(/evaluations\.(\d+)\.fileUploads\.(\d+)/);
      if (match) {
        const evalIndex = match[1];
        const fileIndex = parseInt(match[2], 10);
        const row = this.page
          .locator(`input[name="evaluations.${evalIndex}.date"]`)
          .locator("../..");
        fileInput = row.locator(SELECTORS.FILE_INPUT).nth(fileIndex);
      }
    }
    await fileInput.waitFor({
      state: "attached",
      timeout: TIMEOUTS.FILE_UPLOAD,
    });
    const setFileAndWaitForKey = async () => {
      await fileInput.setInputFiles(filePath);
      await expect(keyInput).toHaveValue(/.+/, { timeout: keyTimeout });
    };
    try {
      await setFileAndWaitForKey();
    } catch {
      await setFileAndWaitForKey();
    }
  }

  private async fillEvaluations(data: TestStructureData) {
    const evaluations = data.evaluations ?? [];
    if (evaluations.length === 0) {
      const noEvaluationCheckbox = this.page.getByRole("checkbox", {
        name: /n.?a pas encore fait l.?objet d.?évaluation/i,
      });
      if ((await noEvaluationCheckbox.count()) > 0) {
        await noEvaluationCheckbox.check({ force: true });
      }
      const defaultDateInput = this.page.locator(
        'input[name="evaluations.0.date"]'
      );
      if ((await defaultDateInput.count()) > 0) {
        const fallbackFilePath =
          data.documentsFinanciers.fileUploads[0]?.filePath ||
          "tests/e2e/fixtures/sample.csv";
        await this.formHelper.fillInput(
          'input[name="evaluations.0.date"]',
          data.creationDate
        );
        await this.setFileInput(
          'input[name="evaluations.0.fileUploads.0.key"]',
          fallbackFilePath
        );
      }
      return;
    }
    const evaluationsFieldset = this.page.getByRole("group", {
      name: /Évaluations/i,
    });
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
    const lastIndex = evaluations.length - 1;
    await this.page
      .locator(`input[name="evaluations.${lastIndex}.date"]`)
      .waitFor({ state: "visible", timeout: TIMEOUTS.FILE_UPLOAD });
    for (let i = 0; i < evaluations.length; i++) {
      const evaluation = evaluations[i];
      const dateSelector = `input[name="evaluations.${i}.date"]`;
      const dateInput = this.page.locator(dateSelector);
      const ensureEvaluationSlotExists = async (): Promise<void> => {
        const count = await this.page
          .locator('input[name^="evaluations."][name$=".date"]')
          .count();
        if (count <= i) {
          const addBtn = this.page
            .getByRole("group", { name: /Évaluations/i })
            .getByRole("button", { name: /Ajouter une évaluation/i });
          for (let j = count; j <= i; j++) {
            await addBtn.click();
            await this.page
              .locator(`input[name="evaluations.${j}.date"]`)
              .waitFor({ state: "attached", timeout: TIMEOUTS.FILE_UPLOAD });
          }
        }
      };
      await ensureEvaluationSlotExists();
      await dateInput.waitFor({
        state: "attached",
        timeout: TIMEOUTS.NAVIGATION,
      });
      await dateInput
        .scrollIntoViewIfNeeded({ timeout: TIMEOUTS.NAVIGATION })
        .catch(() => {});
      await dateInput
        .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION })
        .catch(() => {});
      await this.formHelper.fillInput(dateSelector, evaluation.date);
      if (evaluation.notePersonne !== undefined) {
        await this.page
          .locator(`input[name="evaluations.${i}.notePersonne"]`)
          .waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION })
          .catch(() => {});
        await this.fillInputValue(
          `input[name="evaluations.${i}.notePersonne"]`,
          String(evaluation.notePersonne)
        );
      }
      if (evaluation.notePro !== undefined) {
        await this.fillInputValue(
          `input[name="evaluations.${i}.notePro"]`,
          String(evaluation.notePro)
        );
      }
      if (evaluation.noteStructure !== undefined) {
        await this.fillInputValue(
          `input[name="evaluations.${i}.noteStructure"]`,
          String(evaluation.noteStructure)
        );
      }
      if (evaluation.note !== undefined) {
        await this.fillInputValue(
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
      if (evaluation.planActionFilePath) {
        await this.setFileInput(
          `input[name="evaluations.${i}.fileUploads.1.key"]`,
          evaluation.planActionFilePath,
          TIMEOUTS.FILE_UPLOAD
        );
      }
    }
    await this.removeExtraEntries(
      evaluationsFieldset,
      'button[title="Supprimer"]',
      evaluations.length
    );
  }

  private async fillControles(data: TestStructureData) {
    const controles = data.controles ?? [];
    if (controles.length === 0) {
      const defaultDateInput = this.page.locator(
        'input[name="controles.0.date"]'
      );
      if ((await defaultDateInput.count()) > 0) {
        const fallbackFilePath =
          data.documentsFinanciers.fileUploads[0]?.filePath ||
          "tests/e2e/fixtures/sample.csv";
        await this.formHelper.fillInput(
          'input[name="controles.0.date"]',
          data.creationDate
        );
        await this.formHelper.selectOption('select[name="controles.0.type"]', {
          label: "Programmé",
        });
        await this.setFileInput(
          'input[name="controles.0.fileUploads.0.key"]',
          fallbackFilePath
        );
      }
      return;
    }
    const controlesFieldset = this.page.getByRole("group", {
      name: /Inspections-contrôles/i,
    });
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
        await this.setFileInput(
          `input[name="controles.${i}.fileUploads.0.key"]`,
          controle.filePath
        );
      }
    }
    await this.removeExtraEntries(
      controlesFieldset,
      SELECTORS.DELETE_BUTTON,
      controles.length
    );
  }

  private async fillOuvertureFermeture(data: TestStructureData) {
    const ouvertureFermeture = data.ouvertureFermeture;
    if (!ouvertureFermeture) {
      return;
    }
    const placesACreer = this.page.getByLabel("Nombre de places à créer");
    if (
      ouvertureFermeture.placesACreer !== undefined &&
      (await placesACreer.count()) > 0
    ) {
      await placesACreer.first().fill(String(ouvertureFermeture.placesACreer));
    }
    const echeancePlacesACreer = this.page.getByLabel("Echéance").first();
    if (
      ouvertureFermeture.echeancePlacesACreer &&
      (await echeancePlacesACreer.count()) > 0
    ) {
      await echeancePlacesACreer.fill(ouvertureFermeture.echeancePlacesACreer);
    }
    const placesAFermer = this.page.getByLabel("Nombre de places à fermer");
    if (
      ouvertureFermeture.placesAFermer !== undefined &&
      (await placesAFermer.count()) > 0
    ) {
      await placesAFermer
        .first()
        .fill(String(ouvertureFermeture.placesAFermer));
    }
    const echeancePlacesAFermer = this.page.getByLabel("Echéance").nth(1);
    if (
      ouvertureFermeture.echeancePlacesAFermer &&
      (await echeancePlacesAFermer.count()) > 0
    ) {
      await echeancePlacesAFermer.fill(
        ouvertureFermeture.echeancePlacesAFermer
      );
    }
  }

  private async fillInputValue(selector: string, value: string) {
    await this.formHelper.fillInputIfExists(selector, value);
  }

  private async removeExtraEntries(
    fieldset: ReturnType<Page["getByRole"]>,
    deleteSelector: string,
    expectedCount: number
  ) {
    let deleteButtons = fieldset.locator(deleteSelector);
    let currentCount = (await deleteButtons.count()) + 1;
    while (currentCount > expectedCount && (await deleteButtons.count()) > 0) {
      await deleteButtons.last().click();
      deleteButtons = fieldset.locator(deleteSelector);
      currentCount = (await deleteButtons.count()) + 1;
    }
  }
}
