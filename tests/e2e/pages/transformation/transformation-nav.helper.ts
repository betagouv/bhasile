import type { Page } from "@playwright/test";

import { expect } from "../../fixtures/test";
import { clickAndWaitForPut } from "../shared/wait.helper";

const TRANSFO_API = "/api/transformations/";

const FINALIZE_BUTTON = "Je confirme et certifie les informations";

/** Valide l'étape courante (PUT) et avance. */
export const clickEtapeSuivante = async (page: Page): Promise<void> => {
  await clickAndWaitForPut(page, TRANSFO_API, "Étape suivante");
};

export const gotoVerification = async (
  page: Page,
  transformationId: number
): Promise<void> => {
  await page.goto(
    `/structures/transformation/${transformationId}/verification`,
    { waitUntil: "domcontentloaded" }
  );
  await expect(
    page.getByRole("button", { name: FINALIZE_BUTTON })
  ).toBeVisible();
};

/** Finalise (PUT status=true) et ferme la pop-in de confirmation. */
export const finalizeTransformation = async (page: Page): Promise<void> => {
  await clickAndWaitForPut(page, TRANSFO_API, FINALIZE_BUTTON);
  await expect(
    page.getByText("Les données ont été prises en compte.")
  ).toBeVisible();
  await page.getByRole("button", { name: /j.ai compris/i }).click();
};

/** Tente de finaliser alors que des étapes sont incomplètes (doit échouer). */
export const tryFinalizeExpectingBlock = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: FINALIZE_BUTTON }).click();
  await expect(
    page.getByText(/certaines étapes ne sont pas encore complétées/i)
  ).toBeVisible();
};

/** Header "Enregistrer l'avancée" → PUT + pop-in de confirmation. */
export const saveProgress = async (page: Page): Promise<void> => {
  await clickAndWaitForPut(page, TRANSFO_API, "Enregistrer l'avancée");
  await expect(
    page.getByText("Votre avancée a été enregistrée.")
  ).toBeVisible();
};

/** Header "Annuler la démarche" → confirmation → DELETE. */
export const annulerDemarche = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: "Annuler la démarche" }).click();
  await expect(
    page.getByText(/vous êtes sur le point d.annuler/i)
  ).toBeVisible();
  const deletePromise = page.waitForResponse(
    (response) =>
      response.url().includes(TRANSFO_API) &&
      response.request().method() === "DELETE" &&
      response.ok(),
    { timeout: 20_000 }
  );
  await page.getByRole("button", { name: /annuler et quitter/i }).click();
  await deletePromise;
};
