import type { Page } from "@playwright/test";

import { expect } from "../fixtures/test";

const STEP_SLUGS = [
  "01-places",
  "02-documents-financiers",
  "03-analyse-financiere",
  "04-actes-administratifs",
] as const;

export class ActualisationPage {
  constructor(
    private readonly page: Page,
    private readonly structureId: number,
    private readonly year: number
  ) {}

  async gotoStructure(): Promise<void> {
    await this.page.goto(`/structures/${this.structureId}`, {
      waitUntil: "domcontentloaded",
    });
  }

  async expectBannerVisible(): Promise<void> {
    await expect(
      this.page.getByText(
        new RegExp(`campagne d.actualisation ${this.year} est ouverte`, "i")
      )
    ).toBeVisible();
  }

  async expectBannerGone(): Promise<void> {
    await expect(
      this.page.getByText(
        new RegExp(`campagne d.actualisation ${this.year} est ouverte`, "i")
      )
    ).toHaveCount(0);
  }

  async start(): Promise<void> {
    await this.page
      .getByRole("link", { name: /actualise cette structure/i })
      .click();
    await this.page.waitForURL(
      new RegExp(`/actualisation/${this.year}/01-places`)
    );
  }

  async setPmr(value: number): Promise<void> {
    await this.page.getByLabel(/Nombre de places PMR/).fill(String(value));
  }

  async validateAllSteps(): Promise<void> {
    for (let index = 0; index < STEP_SLUGS.length; index++) {
      const slug = STEP_SLUGS[index];
      const nextSlug = STEP_SLUGS[index + 1];

      await this.page.waitForURL(
        new RegExp(`/actualisation/${this.year}/${slug}`)
      );
      // Laisse partir l'autosave débouncé (500ms) de l'étape AVANT de valider :
      // sinon un autosave tardif écrase le statut VALIDE en NON_COMMENCE une
      // fois l'étape quittée. Le validate doit être la dernière écriture.
      await this.page.waitForTimeout(800);
      await this.page.waitForLoadState("networkidle").catch(() => {});
      await this.page
        .getByRole("button", { name: "Valider", exact: true })
        .click();

      if (nextSlug) {
        await this.page.waitForURL(
          new RegExp(`/actualisation/${this.year}/${nextSlug}`)
        );
      } else {
        await this.page.waitForLoadState("networkidle").catch(() => {});
      }
    }
  }

  async validateActualisation(): Promise<void> {
    const button = this.page.getByRole("button", {
      name: /Valider l.actualisation/i,
    });
    // Le bouton ne s'active qu'après le refresh du contexte de la dernière
    // étape. On attend l'activation + la stabilisation du réseau pour éviter un
    // clic perdu sur re-render du header.
    await expect(button).toBeEnabled({ timeout: 20000 });
    await this.page.waitForLoadState("networkidle").catch(() => {});
    // On confirme que le PUT de validation de l'étape part bien.
    await Promise.all([
      this.page.waitForResponse(
        (response) =>
          response.url().includes("/actualisation") &&
          response.request().method() === "PUT"
      ),
      button.click(),
    ]);
    await this.page.waitForLoadState("networkidle").catch(() => {});
  }
}
