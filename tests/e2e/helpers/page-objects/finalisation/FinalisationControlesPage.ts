import { expect, Page } from "@playwright/test";

import { TIMEOUTS, URLS } from "../../constants";
import { TestStructureData } from "../../test-data";

export class FinalisationControlesPage {
  constructor(private page: Page) {}

  async waitForLoad() {
    await this.page.waitForSelector('button[type="submit"]', {
      timeout: TIMEOUTS.NAVIGATION,
    });
  }

  async fillForm(data: TestStructureData) {
    await this.fillEvaluations(data);
    await this.fillControles(data);
    await this.fillOuvertureFermeture(data);
  }

  async submit(structureId: number) {
    const submitButton = this.page.getByRole("button", { name: /Valider/i });
    await submitButton.click();
    await this.page.waitForURL(
      URLS.finalisationStep(structureId, "05-documents"),
      { timeout: TIMEOUTS.NAVIGATION }
    );
  }

  private async setFileInput(keySelector: string, filePath: string) {
    const keyInput = this.page.locator(keySelector);
    if ((await keyInput.count()) === 0) {
      return;
    }
    const uploadRoot = keyInput.locator("..");
    const fileInput = uploadRoot.locator('input[type="file"]');
    await fileInput.setInputFiles(filePath);
    await expect(keyInput).toHaveValue(/.+/, { timeout: TIMEOUTS.NAVIGATION });
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
          data.documentsFinanciers.files[0]?.filePath ||
          "tests/e2e/fixtures/sample.csv";
        await defaultDateInput.fill(data.creationDate);
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
    const existingCount = await evaluationsFieldset
      .getByRole("heading", { level: 3 })
      .count();
    for (let i = existingCount; i < evaluations.length; i++) {
      await addButton.click();
    }
    for (let i = 0; i < evaluations.length; i++) {
      const evaluation = evaluations[i];
      await this.page.fill(
        `input[name="evaluations.${i}.date"]`,
        evaluation.date
      );
      if (evaluation.notePersonne !== undefined) {
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
          evaluation.filePath
        );
      }
      if (evaluation.planActionFilePath) {
        await this.setFileInput(
          `input[name="evaluations.${i}.fileUploads.1.key"]`,
          evaluation.planActionFilePath
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
          data.documentsFinanciers.files[0]?.filePath ||
          "tests/e2e/fixtures/sample.csv";
        await defaultDateInput.fill(data.creationDate);
        await this.page.selectOption('select[name="controles.0.type"]', {
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
      await this.page.fill(`input[name="controles.${i}.date"]`, controle.date);
      await this.page.selectOption(`select[name="controles.${i}.type"]`, {
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
      'button[title="Supprimer"]',
      controles.length
    );
  }

  private async fillOuvertureFermeture(data: TestStructureData) {
    const ouvertureFermeture = data.ouvertureFermeture;
    if (!ouvertureFermeture) {
      return;
    }
    const placesACreerInput = this.page.locator(
      'input[name^="structureTypologies"][name$="placesACreer"]'
    );
    if (
      ouvertureFermeture.placesACreer !== undefined &&
      (await placesACreerInput.count()) > 0
    ) {
      await placesACreerInput
        .first()
        .fill(String(ouvertureFermeture.placesACreer));
    }
    const echeancePlacesACreerInput = this.page.locator(
      'input[name^="structureTypologies"][name$="echeancePlacesACreer"]'
    );
    if (
      ouvertureFermeture.echeancePlacesACreer &&
      (await echeancePlacesACreerInput.count()) > 0
    ) {
      await echeancePlacesACreerInput
        .first()
        .fill(ouvertureFermeture.echeancePlacesACreer);
    }

    const placesAFermerInput = this.page.locator(
      'input[name^="structureTypologies"][name$="placesAFermer"]'
    );
    if (
      ouvertureFermeture.placesAFermer !== undefined &&
      (await placesAFermerInput.count()) > 0
    ) {
      await placesAFermerInput
        .first()
        .fill(String(ouvertureFermeture.placesAFermer));
    }
    const echeancePlacesAFermerInput = this.page.locator(
      'input[name^="structureTypologies"][name$="echeancePlacesAFermer"]'
    );
    if (
      ouvertureFermeture.echeancePlacesAFermer &&
      (await echeancePlacesAFermerInput.count()) > 0
    ) {
      await echeancePlacesAFermerInput
        .first()
        .fill(ouvertureFermeture.echeancePlacesAFermer);
    }
  }

  private async fillInputValue(selector: string, value: string) {
    const input = this.page.locator(selector);
    if ((await input.count()) === 0) {
      return;
    }
    await input.fill(value);
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
