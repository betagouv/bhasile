import { expect, Page } from "@playwright/test";

import { TIMEOUTS } from "./constants";
import { FormHelper } from "./form-helper";
import { SELECTORS } from "./selectors";
import {
  ControleData,
  EvaluationData,
  OuvertureFermetureData,
} from "./test-data/types";

/**
 * Sets a file input for evaluation or controle file uploads.
 * Handles the nested structure of the form (evaluations.X.fileUploads.Y).
 */
export async function setControlesFileInput(
  page: Page,
  keySelector: string,
  filePath: string,
  keyTimeout: number = TIMEOUTS.NAVIGATION
): Promise<void> {
  const keyInput = page.locator(keySelector);
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
      const fileIndex = parseInt(match[2], 10);
      const row = page
        .locator(`input[name="evaluations.${evalIndex}.date"]`)
        .locator("../..");
      fileInput = row.locator(SELECTORS.FILE_INPUT).nth(fileIndex);
    } else {
      const controleMatch = keySelector.match(/controles\.(\d+)\.fileUploads/);
      if (controleMatch) {
        const row = page
          .locator(`input[name="controles.${controleMatch[1]}.date"]`)
          .locator("../..");
        fileInput = row.locator(SELECTORS.FILE_INPUT).first();
      }
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

export type FillEvaluationsOptions = {
  /** When evaluations are empty, fill default with creationDate and fallback file (finalisation) */
  fillDefaultWhenEmpty?: {
    creationDate: string;
    fallbackFilePath: string;
  };
  /** Support planActionFilePath (fileUploads.1) - finalisation only */
  supportPlanAction?: boolean;
  /** Remove extra entries to match expected count - finalisation only */
  removeExtraEntries?: boolean;
};

/**
 * Fills the evaluations section of the controles form.
 */
export async function fillEvaluationsForm(
  page: Page,
  formHelper: FormHelper,
  evaluations: EvaluationData[],
  options: FillEvaluationsOptions = {}
): Promise<void> {
  const {
    fillDefaultWhenEmpty,
    supportPlanAction = false,
    removeExtraEntries = false,
  } = options;

  if (evaluations.length === 0) {
    const noEvaluationCheckbox = page.getByRole("checkbox", {
      name: /n.?a pas encore fait l.?objet d.?évaluation/i,
    });
    if ((await noEvaluationCheckbox.count()) > 0) {
      await noEvaluationCheckbox.check({ force: true });
    }
    if (fillDefaultWhenEmpty) {
      const defaultDateInput = page.locator('input[name="evaluations.0.date"]');
      if ((await defaultDateInput.count()) > 0) {
        await formHelper.fillInput(
          'input[name="evaluations.0.date"]',
          fillDefaultWhenEmpty.creationDate
        );
        await setControlesFileInput(
          page,
          'input[name="evaluations.0.fileUploads.0.key"]',
          fillDefaultWhenEmpty.fallbackFilePath
        );
      }
    }
    return;
  }

  const evaluationsFieldset = page.getByRole("group", { name: /Évaluations/i });
  if ((await evaluationsFieldset.count()) === 0) return;

  const addButton = evaluationsFieldset.getByRole("button", {
    name: /Ajouter une évaluation/i,
  });
  const existingCount = await page
    .locator('input[name^="evaluations."][name$=".date"]')
    .count();

  for (let i = existingCount; i < evaluations.length; i++) {
    await addButton.click();
    await page
      .locator(`input[name="evaluations.${i}.date"]`)
      .waitFor({ state: "attached", timeout: TIMEOUTS.FILE_UPLOAD });
  }

  for (let i = 0; i < evaluations.length; i++) {
    const evaluation = evaluations[i];
    const dateSelector = `input[name="evaluations.${i}.date"]`;

    const dateInput = page.locator(dateSelector);
    await dateInput.waitFor({ state: "attached", timeout: TIMEOUTS.NAVIGATION });
    await dateInput.scrollIntoViewIfNeeded({ timeout: TIMEOUTS.NAVIGATION }).catch(() => {});
    await dateInput.waitFor({ state: "visible", timeout: TIMEOUTS.NAVIGATION }).catch(() => {});

    await formHelper.fillInput(dateSelector, evaluation.date);
    if (evaluation.notePersonne !== undefined) {
      await formHelper.fillInputIfExists(
        `input[name="evaluations.${i}.notePersonne"]`,
        String(evaluation.notePersonne)
      );
    }
    if (evaluation.notePro !== undefined) {
      await formHelper.fillInputIfExists(
        `input[name="evaluations.${i}.notePro"]`,
        String(evaluation.notePro)
      );
    }
    if (evaluation.noteStructure !== undefined) {
      await formHelper.fillInputIfExists(
        `input[name="evaluations.${i}.noteStructure"]`,
        String(evaluation.noteStructure)
      );
    }
    if (evaluation.note !== undefined) {
      await formHelper.fillInputIfExists(
        `input[name="evaluations.${i}.note"]`,
        String(evaluation.note)
      );
    }
    if (evaluation.filePath) {
      await setControlesFileInput(
        page,
        `input[name="evaluations.${i}.fileUploads.0.key"]`,
        evaluation.filePath,
        TIMEOUTS.FILE_UPLOAD
      );
    }
    if (supportPlanAction && evaluation.planActionFilePath) {
      await setControlesFileInput(
        page,
        `input[name="evaluations.${i}.fileUploads.1.key"]`,
        evaluation.planActionFilePath,
        TIMEOUTS.FILE_UPLOAD
      );
    }
  }

  if (removeExtraEntries) {
    await removeExtraFormEntries(
      evaluationsFieldset,
      'button[title="Supprimer"]',
      evaluations.length
    );
  }
}

export type FillControlesOptions = {
  /** When controles are empty, fill default (finalisation) */
  fillDefaultWhenEmpty?: {
    creationDate: string;
    fallbackFilePath: string;
  };
  /** Remove extra entries to match expected count - finalisation only */
  removeExtraEntries?: boolean;
};

/**
 * Fills the controles (inspections) section of the form.
 */
export async function fillControlesForm(
  page: Page,
  formHelper: FormHelper,
  controles: ControleData[],
  options: FillControlesOptions = {}
): Promise<void> {
  const { fillDefaultWhenEmpty, removeExtraEntries = false } = options;

  if (controles.length === 0) {
    if (fillDefaultWhenEmpty) {
      const defaultDateInput = page.locator('input[name="controles.0.date"]');
      if ((await defaultDateInput.count()) > 0) {
        await formHelper.fillInput(
          'input[name="controles.0.date"]',
          fillDefaultWhenEmpty.creationDate
        );
        await formHelper.selectOption('select[name="controles.0.type"]', {
          label: "Programmé",
        });
        await setControlesFileInput(
          page,
          'input[name="controles.0.fileUploads.0.key"]',
          fillDefaultWhenEmpty.fallbackFilePath
        );
      }
    }
    return;
  }

  const controlesFieldset = page.getByRole("group", {
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
    await formHelper.fillInput(
      `input[name="controles.${i}.date"]`,
      controle.date
    );
    await formHelper.selectOption(`select[name="controles.${i}.type"]`, {
      label: controle.type,
    });
    if (controle.filePath) {
      await setControlesFileInput(
        page,
        `input[name="controles.${i}.fileUploads.0.key"]`,
        controle.filePath
      );
    }
  }

  if (removeExtraEntries) {
    await removeExtraFormEntries(
      controlesFieldset,
      SELECTORS.DELETE_BUTTON,
      controles.length
    );
  }
}

/**
 * Fills the ouverture/fermeture section (finalisation only).
 */
export async function fillOuvertureFermetureForm(
  page: Page,
  ouvertureFermeture: OuvertureFermetureData | undefined
): Promise<void> {
  if (!ouvertureFermeture) return;

  const placesACreer = page.getByLabel("Nombre de places à créer");
  if (
    ouvertureFermeture.placesACreer !== undefined &&
    (await placesACreer.count()) > 0
  ) {
    await placesACreer.first().fill(String(ouvertureFermeture.placesACreer));
  }
  const echeancePlacesACreer = page.getByLabel("Echéance").first();
  if (
    ouvertureFermeture.echeancePlacesACreer &&
    (await echeancePlacesACreer.count()) > 0
  ) {
    await echeancePlacesACreer.fill(ouvertureFermeture.echeancePlacesACreer);
  }
  const placesAFermer = page.getByLabel("Nombre de places à fermer");
  if (
    ouvertureFermeture.placesAFermer !== undefined &&
    (await placesAFermer.count()) > 0
  ) {
    await placesAFermer.first().fill(String(ouvertureFermeture.placesAFermer));
  }
  const echeancePlacesAFermer = page.getByLabel("Echéance").nth(1);
  if (
    ouvertureFermeture.echeancePlacesAFermer &&
    (await echeancePlacesAFermer.count()) > 0
  ) {
    await echeancePlacesAFermer.fill(
      ouvertureFermeture.echeancePlacesAFermer
    );
  }
}

async function removeExtraFormEntries(
  fieldset: ReturnType<Page["getByRole"]>,
  deleteSelector: string,
  expectedCount: number
): Promise<void> {
  let deleteButtons = fieldset.locator(deleteSelector);
  let currentCount = (await deleteButtons.count()) + 1;
  while (currentCount > expectedCount && (await deleteButtons.count()) > 0) {
    await deleteButtons.last().click();
    deleteButtons = fieldset.locator(deleteSelector);
    currentCount = (await deleteButtons.count()) + 1;
  }
}
