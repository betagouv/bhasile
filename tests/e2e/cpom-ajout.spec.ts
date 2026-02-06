import { test } from "@playwright/test";

import { deleteCpom } from "@/app/api/cpoms/cpom.repository";
import { deleteStructure } from "@/app/api/structures/structure.repository";

import { beforeFlow } from "./helpers/before-flow";
import { URLS } from "./helpers/constants";
import { CpomAjoutIdentificationPage } from "./helpers/page-objects/cpom/CpomAjoutIdentificationPage";
import { CpomModificationFinancePage } from "./helpers/page-objects/cpom/CpomModificationFinancePage";
import { CpomModificationIdentificationPage } from "./helpers/page-objects/cpom/CpomModificationIdentificationPage";
import { cada1 } from "./helpers/test-data/cada-1";
import { cpomDepartementale } from "./helpers/test-data/cpom-departementale";

test.describe("CPOM ajout", () => {
  test(`${cpomDepartementale.name}`, async ({ page }) => {
    test.setTimeout(120000);

    // Seed a structure so the CPOM structures list is non-empty (operateur 1, departement 75)
    await beforeFlow(cada1.formData as Parameters<typeof beforeFlow>[0], page);

    let cpomId: number | null = null;

    try {
      await page.goto(URLS.CPOMS_AJOUT_IDENTIFICATION, {
        waitUntil: "domcontentloaded",
      });
      const ajoutPage = new CpomAjoutIdentificationPage(page);
      await ajoutPage.waitForLoad();
      await ajoutPage.fillForm(cpomDepartementale.formData);
      cpomId = await ajoutPage.submit();

      if (cpomId === null) {
        throw new Error("Expected cpomId after submit");
      }

      const financePage = new CpomModificationFinancePage(page);
      await financePage.fillFinanceTable(cpomDepartementale.financeData);
      await financePage.submitAndConfirmRedirectToStructures();

      await page.goto(URLS.cpomModificationIdentification(cpomId), {
        waitUntil: "domcontentloaded",
      });

      const modificationPage = new CpomModificationIdentificationPage(page);
      await modificationPage.verifyForm(cpomDepartementale.formData);

      await page.goto(URLS.cpomModificationFinance(cpomId), {
        waitUntil: "domcontentloaded",
      });
      const financePageForVerification = new CpomModificationFinancePage(page);
      await financePageForVerification.verifyFinanceTable(
        cpomDepartementale.financeData
      );
    } finally {
      if (cpomId !== null) {
        await deleteCpom(cpomId);
      }
      if (cada1.formData.dnaCode) {
        await deleteStructure(cada1.formData.dnaCode as string);
      }
    }
  });
});
