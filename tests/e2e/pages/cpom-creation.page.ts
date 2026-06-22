import path from "node:path";
import { fileURLToPath } from "node:url";

import type { Page } from "@playwright/test";

import { expect } from "../fixtures/test";
import { uploadContainer, uploadToContainer } from "./upload.helper";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const fixturePath = (file: string): string =>
  path.resolve(__dirname, "..", "fixtures", "files", file);

export type Granularity =
  | "DEPARTEMENTALE"
  | "INTERDEPARTEMENTALE"
  | "REGIONALE";

export type CpomCreationInput = {
  granularity: Granularity;
  operateurSearch: string;
  region: string;
  departementNumeros: string[];
  acteStartDate: string;
  acteEndDate: string;
  acteFile?: string;
  structureIds: number[];
};

export class CpomCreationPage {
  constructor(private readonly page: Page) {}

  async gotoIdentification(): Promise<void> {
    await this.page.goto("/cpoms/ajout/01-identification", {
      waitUntil: "domcontentloaded",
    });
    await expect(
      this.page.getByRole("heading", { name: /identification du cpom/i })
    ).toBeVisible();
    await this.page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});
  }

  async selectGranularity(granularity: Granularity): Promise<void> {
    const labels: Record<Granularity, string> = {
      DEPARTEMENTALE: "Départementale",
      INTERDEPARTEMENTALE: "Interdépartementale",
      REGIONALE: "Régionale",
    };
    await this.page
      .locator(`label.fr-label:has-text("${labels[granularity]}")`)
      .first()
      .click();
  }

  async fillOperateurAutocomplete(searchTerm: string): Promise<void> {
    const input = this.page.locator("#operateur");
    await input.click();
    await input.fill("");
    await input.pressSequentially(searchTerm, { delay: 80 });
    const firstOption = this.page
      .locator('#autocomplete-suggestions li[role="option"]')
      .first();
    await firstOption.waitFor({ state: "visible", timeout: 25_000 });
    await firstOption.click();
  }

  async selectRegion(region: string): Promise<void> {
    await this.page.locator("select#region").selectOption({ label: region });
  }

  async selectDepartementForDepartementale(numero: string): Promise<void> {
    await this.page.locator("select#departements").selectOption(numero);
  }

  async toggleDepartementsForInterdepartementale(
    numeros: string[]
  ): Promise<void> {
    const panelButton = this.page
      .locator('label:has-text("Départements")')
      .first()
      .locator("..")
      .getByRole("button");
    await panelButton.click();
    for (const numero of numeros) {
      const checkbox = this.page.locator(
        `input[name="structure-departement"][value="${numero}"]`
      );
      const id = await checkbox.getAttribute("id");
      const label = id
        ? this.page.locator(`label[for="${id}"]`)
        : checkbox.locator("..").locator("label").first();
      if (!(await checkbox.isChecked())) {
        await label.click();
      }
    }
    await panelButton.click().catch(() => {});
    await this.page.keyboard.press("Escape").catch(() => {});
  }

  async fillActeDates(startDate: string, endDate: string): Promise<void> {
    await this.page
      .locator('input[name="actesAdministratifs.0.startDate"]')
      .fill(startDate);
    await this.page
      .locator('input[name="actesAdministratifs.0.endDate"]')
      .fill(endDate);
  }

  async uploadActeFile(file = "sample.pdf"): Promise<void> {
    await uploadToContainer(
      uploadContainer(this.page).first(),
      fixturePath(file)
    );
  }

  async attachStructures(structureIds: number[]): Promise<void> {
    if (structureIds.length === 0) {
      return;
    }
    const firstStructureId = structureIds[0];
    await this.page
      .locator(`input[name="structures"][value="${firstStructureId}"]`)
      .waitFor({ state: "attached", timeout: 20000 });

    for (const id of structureIds) {
      const checkbox = this.page.locator(
        `input[name="structures"][value="${id}"]`
      );
      if (!(await checkbox.isChecked())) {
        const cbId = await checkbox.getAttribute("id");
        const label = cbId
          ? this.page.locator(`label[for="${cbId}"]`)
          : checkbox.locator("..").locator("label").first();
        await label.click();
      }
    }
  }

  async submitIdentification(
    onCpomCreated?: (id: number) => void
  ): Promise<number> {
    await this.page
      .waitForLoadState("networkidle", { timeout: 15000 })
      .catch(() => {});

    const postPromise = this.page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/cpoms") &&
        response.request().method() === "POST",
      { timeout: 30000 }
    );
    await this.page
      .getByRole("button", { name: "Étape suivante", exact: true })
      .click();
    const response = await postPromise;
    if (!response.ok()) {
      const errorBody = await response.text().catch(() => "<no body>");
      throw new Error(
        `POST /api/cpoms a retourné ${response.status()}: ${errorBody}`
      );
    }
    const body = (await response.json()) as { cpomId?: number; id?: number };
    const cpomId = body.cpomId ?? body.id;
    if (typeof cpomId !== "number") {
      throw new Error(
        `L'id du CPOM n'a pas été retourné par POST /api/cpoms (got: ${JSON.stringify(body)})`
      );
    }

    onCpomCreated?.(cpomId);

    await this.page.waitForURL(
      new RegExp(`/cpoms/${cpomId}/ajout/02-finances`),
      { timeout: 15000 }
    );
    return cpomId;
  }

  async fillIdentification(input: CpomCreationInput): Promise<void> {
    await this.selectGranularity(input.granularity);
    await this.fillOperateurAutocomplete(input.operateurSearch);
    await this.selectRegion(input.region);

    if (input.granularity === "DEPARTEMENTALE") {
      await this.selectDepartementForDepartementale(
        input.departementNumeros[0]
      );
    } else if (input.granularity === "INTERDEPARTEMENTALE") {
      await this.toggleDepartementsForInterdepartementale(
        input.departementNumeros
      );
    }

    await this.fillActeDates(input.acteStartDate, input.acteEndDate);
    await this.uploadActeFile(input.acteFile);
    await this.attachStructures(input.structureIds);
  }

  async submitFinancesEmpty(cpomId: number): Promise<void> {
    await expect(this.page).toHaveURL(
      new RegExp(`/cpoms/${cpomId}/ajout/02-finances`)
    );
    const putPromise = this.page.waitForResponse(
      (response) =>
        response.url().includes(`/api/cpoms/${cpomId}`) &&
        response.request().method() === "PUT",
      { timeout: 30_000 }
    );
    await this.page
      .getByRole("button", { name: "Terminer", exact: true })
      .click();
    const putResponse = await putPromise;
    if (!putResponse.ok()) {
      const errorBody = await putResponse.text().catch(() => "<no body>");
      throw new Error(
        `PUT /api/cpoms/${cpomId} returned ${putResponse.status()}: ${errorBody}`
      );
    }

    const understood = this.page.getByRole("button", {
      name: /j.ai compris/i,
    });
    await understood.waitFor({ state: "visible", timeout: 30000 });
    await understood.click();

    await this.page.waitForURL(
      (url) => !url.pathname.includes(`/cpoms/${cpomId}/ajout/02-finances`),
      { timeout: 30000 }
    );
  }
}
