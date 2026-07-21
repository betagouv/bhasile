import type { Page } from "@playwright/test";

import { expect } from "../../fixtures/test";
import { clickAndWaitForPut } from "../shared/wait.helper";

const TRANSFO_API = "/api/transformations/";

const FINALIZE_BUTTON = "Je confirme et certifie les informations";

export const clickEtapeSuivante = async (page: Page): Promise<void> => {
  const urlBefore = page.url();
  const putPromise = page.waitForResponse(
    (response) =>
      response.url().includes(TRANSFO_API) &&
      response.request().method() === "PUT",
    { timeout: 20_000 }
  );
  await page
    .getByRole("button", { name: "Étape suivante", exact: true })
    .click();
  const response = await putPromise;
  if (!response.ok()) {
    const body = await response.text().catch(() => "");
    throw new Error(`PUT étape ${response.status()}: ${body.slice(0, 400)}`);
  }
  await page.waitForURL((url) => url.toString() !== urlBefore, {
    timeout: 15_000,
  });
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

export const finalizeTransformation = async (page: Page): Promise<void> => {
  await clickAndWaitForPut(page, TRANSFO_API, FINALIZE_BUTTON);
  await expect(
    page.getByText("Les données ont été prises en compte.").first()
  ).toBeVisible();
  await page
    .getByRole("button", { name: /j.ai compris/i })
    .first()
    .click();
};

export const tryFinalizeExpectingBlock = async (page: Page): Promise<void> => {
  await page.getByRole("button", { name: FINALIZE_BUTTON }).click();
  await expect(
    page.getByText(/certaines étapes ne sont pas encore complétées/i)
  ).toBeVisible();
};

export const saveProgress = async (page: Page): Promise<void> => {
  await clickAndWaitForPut(page, TRANSFO_API, "Enregistrer l’avancée");
  await expect(
    page.getByText("Votre avancée a été enregistrée.")
  ).toBeVisible();
};

export const annulerDemarche = async (page: Page): Promise<void> => {
  await expect(async () => {
    await page.getByRole("button", { name: "Annuler la démarche" }).click();
    await expect(
      page.getByRole("heading", { name: /vous êtes sur le point d.annuler/i })
    ).toBeVisible({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
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
