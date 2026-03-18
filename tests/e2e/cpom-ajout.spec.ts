import { test } from "@playwright/test";

import { deleteCpom } from "@/app/api/cpoms/cpom.repository";
import { deleteStructure } from "@/app/api/structures/structure.repository";

import { beforeFlow } from "./helpers/before-flow";
import { URLS } from "./helpers/constants";
import { CpomAjoutFinancePage } from "./helpers/page-objects/cpom/CpomAjoutFinancePage";
import { CpomAjoutIdentificationPage } from "./helpers/page-objects/cpom/CpomAjoutIdentificationPage";
import { CpomDetailPage } from "./helpers/page-objects/cpom/CpomDetailPage";
import { cada1 } from "./helpers/test-data/cada-1";
import { cpomDepartementale } from "./helpers/test-data/cpom-departementale";
import { cpomInterdepartementale } from "./helpers/test-data/cpom-interdepartementale";
import { cpomRegionale } from "./helpers/test-data/cpom-regionale";

type CpomTestCase = {
  name: string;
  formData: Parameters<CpomAjoutIdentificationPage["fillForm"]>[0];
  financeData: Parameters<CpomAjoutFinancePage["fillForm"]>[0];
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
  } finally {
    if (cpomId !== null) {
      await deleteCpom(cpomId);
    }
    if (cada1.formData.codeBhasile) {
      await deleteStructure(cada1.formData.codeBhasile);
    }
  }
}

test.describe("CPOM ajout", () => {
  test(`${cpomDepartementale.name}`, async ({ page }) => {
    test.setTimeout(120000);
    await runCpomAjoutTest(page, cpomDepartementale);
  });

  test(`${cpomRegionale.name}`, async ({ page }) => {
    test.setTimeout(120000);
    await runCpomAjoutTest(page, cpomRegionale);
  });

  test(`${cpomInterdepartementale.name}`, async ({ page }) => {
    test.setTimeout(120000);
    await runCpomAjoutTest(page, cpomInterdepartementale);
  });
});
