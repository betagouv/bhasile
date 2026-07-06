import type { Page } from "@playwright/test";

/**
 * Points d'entrée RÉELS des parcours de transformation : on passe par les CTA
 * de la liste / le menu 3-points de la fiche structure (navigation client-side
 * dans une app déjà hydratée), plutôt que par un `goto` direct sur l'URL du
 * formulaire (qui atterrit avant hydratation → interactions perdues).
 *
 * Nécessite `NEXT_PUBLIC_SHOW_TRANSFORMATION=true` (déjà dans `.env`).
 */

const waitHydrated = async (page: Page): Promise<void> => {
  await page.waitForLoadState("networkidle", { timeout: 1_500 }).catch(() => {});
};

/** Onglet Structure → CTA « Créer une structure ». */
export const enterViaCreationCta = async (page: Page): Promise<void> => {
  await page.goto("/structures", { waitUntil: "domcontentloaded" });
  await waitHydrated(page);
  await page.getByRole("link", { name: "Créer une structure" }).click();
};

/** Onglet Structure → CTA « Transformer HUDA en CADA ». */
export const enterViaHudaCta = async (page: Page): Promise<void> => {
  await page.goto("/structures", { waitUntil: "domcontentloaded" });
  await waitHydrated(page);
  await page.getByRole("link", { name: "Transformer HUDA en CADA" }).click();
};

/** Fiche structure → menu 3-points → « Extension, contraction ou fermeture ». */
export const enterViaStructureMenu = async (
  page: Page,
  structureId: number
): Promise<void> => {
  await page.goto(`/structures/${structureId}`, {
    waitUntil: "domcontentloaded",
  });
  await waitHydrated(page);
  await page.getByRole("button", { name: "Menu structure" }).click();
  await page
    .getByRole("link", { name: "Extension, contraction ou fermeture" })
    .click();
};
