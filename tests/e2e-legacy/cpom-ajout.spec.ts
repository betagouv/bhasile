import { test } from "@playwright/test";

import { deleteCpom } from "@/app/api/cpoms/cpom.repository";
import { deleteStructure } from "@/app/api/structures/structure.repository";

import { beforeFlow } from "./helpers/before-flow";
import { URLS } from "./helpers/constants";
import { CpomAjoutFinancePage } from "./helpers/page-objects/cpom/CpomAjoutFinancePage";
import { CpomAjoutIdentificationPage } from "./helpers/page-objects/cpom/CpomAjoutIdentificationPage";
import { CpomDetailPage } from "./helpers/page-objects/cpom/CpomDetailPage";
import { CpomModificationIdentificationPage } from "./helpers/page-objects/cpom/CpomModificationIdentificationPage";
import { cada1 } from "./helpers/test-data/cada-1";
import { cpomDepartementale } from "./helpers/test-data/cpom-departementale";
import { cpomInterdepartementale } from "./helpers/test-data/cpom-interdepartementale";
import { cpomRegionale } from "./helpers/test-data/cpom-regionale";

type CpomTestCase = {
  name: string;
  formData: Parameters<CpomAjoutIdentificationPage["fillForm"]>[0];
  financeData: Parameters<CpomAjoutFinancePage["fillForm"]>[0];
  modificationFormData: Parameters<
    CpomModificationIdentificationPage["fillDescriptionForm"]
  >[0];
  modificationFinanceData: Parameters<CpomAjoutFinancePage["fillForm"]>[0];
};

async function runCpomAjoutTest(
  page: import("@playwright/test").Page,
  testCase: CpomTestCase
) {
  const id = await beforeFlow(
    cada1.formData as Parameters<typeof beforeFlow>[0],
    page
  );

  const formData =
    testCase.formData.structureIds === "seeded" && cada1.formData.codeBhasile
      ? {
          ...testCase.formData,
          structureIds: [id] as number[],
        }
      : testCase.formData;
  const modificationFormData =
    testCase.modificationFormData.structureIds === "seeded" &&
    cada1.formData.codeBhasile
      ? {
          ...testCase.modificationFormData,
          structureIds: [id] as number[],
        }
      : testCase.modificationFormData;

  let cpomId: number | null = null;

  try {
    await page.goto(URLS.CPOMS_AJOUT_IDENTIFICATION, {
      waitUntil: "domcontentloaded",
    });
    const ajoutPage = new CpomAjoutIdentificationPage(page);
    await ajoutPage.waitForLoad();
    await ajoutPage.fillForm(formData);
    cpomId = await ajoutPage.submit();

    if (cpomId === null) {
      throw new Error("Expected cpomId after submit");
    }

    const financePage = new CpomAjoutFinancePage(page);
    await financePage.fillForm(testCase.financeData);
    await financePage.submitAndConfirmRedirectToStructures();

    await page.goto(URLS.cpomPage(cpomId), {
      waitUntil: "load",
    });
    await page.waitForLoadState("networkidle").catch(() => {});

    const cpomDetailPage = new CpomDetailPage(page);
    await cpomDetailPage.verifyDescription(formData);
    await cpomDetailPage.verifyFinances(testCase.financeData, formData);

    await page.goto(URLS.cpomModificationDescription(cpomId), {
      waitUntil: "domcontentloaded",
    });
    const modificationPage = new CpomModificationIdentificationPage(page);
    await modificationPage.waitForLoad();
    await modificationPage.fillDescriptionForm(modificationFormData);
    await modificationPage.submit();

    await page.goto(URLS.cpomModificationActesAdministratifs(cpomId), {
      waitUntil: "domcontentloaded",
    });
    await modificationPage.waitForLoad();
    await modificationPage.fillActesAdministratifsForm(modificationFormData);
    await modificationPage.submit();

    await page.goto(URLS.cpomModificationComposition(cpomId), {
      waitUntil: "domcontentloaded",
    });
    await modificationPage.waitForLoad();
    await modificationPage.fillCompositionForm(modificationFormData);
    await modificationPage.submit();

    await page.goto(URLS.cpomModificationFinance(cpomId), {
      waitUntil: "domcontentloaded",
    });
    await financePage.waitForLoad();
    await financePage.fillForm(testCase.modificationFinanceData);
    await financePage.submitAndConfirmRedirect(URLS.cpomPage(cpomId));

    await page.goto(URLS.cpomPage(cpomId), {
      waitUntil: "load",
    });
    await page.waitForLoadState("networkidle").catch(() => {});
    await cpomDetailPage.verifyDescription(modificationFormData);
    await cpomDetailPage.verifyFinances(
      testCase.modificationFinanceData,
      modificationFormData
    );
  } finally {
    if (cpomId !== null) {
      await deleteCpom(cpomId).catch(() => {});
    }
    if (cada1.formData.codeBhasile) {
      await deleteStructure(cada1.formData.codeBhasile).catch(() => {});
    }
  }
}

test.describe("CPOM ajout", () => {
  test(`${cpomDepartementale.name}`, async ({ page }) => {
    test.setTimeout(300000);
    await runCpomAjoutTest(page, cpomDepartementale);
  });

  test(`${cpomRegionale.name}`, async ({ page }) => {
    test.setTimeout(300000);
    await runCpomAjoutTest(page, cpomRegionale);
  });

  test(`${cpomInterdepartementale.name}`, async ({ page }) => {
    test.setTimeout(300000);
    await runCpomAjoutTest(page, cpomInterdepartementale);
  });
});
