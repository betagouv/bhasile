import type { Page } from "@playwright/test";

/**
 * Clique un bouton et attend la réponse PUT correspondante (persistance d'une
 * étape de formulaire). Généralise `submitAndWaitForSave` (structures) à
 * n'importe quel endpoint (`/api/transformations/[id]`, `/api/structures/[id]`…).
 */
export const clickAndWaitForPut = async (
  page: Page,
  urlFragment: string,
  buttonName: string
): Promise<void> => {
  const putPromise = page.waitForResponse(
    (response) =>
      response.url().includes(urlFragment) &&
      response.request().method() === "PUT" &&
      response.ok(),
    { timeout: 20_000 }
  );
  await page.getByRole("button", { name: buttonName, exact: true }).click();
  await putPromise;
};
