import { expect, test } from "../fixtures/test";
import { ActualisationPage } from "../pages/actualisation.page";
import { ACTUALISATION_MISSING_DOCUMENT } from "../seed/actualisation.seed";
import { expectActualisationValidated } from "../seed/actualisation-assert";
import { prisma } from "../seed/prisma";

const YEAR = Number(process.env.ACTUALISATION_YEAR);
const NEW_PMR = 7;

test.describe("Actualisation", () => {
  // Parcours longs (4 étapes SSR + validation) : en série pour éviter la
  // contention serveur qui fait déborder les timeouts en parallèle.
  test.describe.configure({ mode: "serial" });

  test("un agent actualise une structure autorisée", async ({
    page,
    seededActualisationAutorisee,
  }) => {
    const actualisation = new ActualisationPage(
      page,
      seededActualisationAutorisee.id,
      YEAR
    );

    await actualisation.gotoStructure();
    await actualisation.expectBannerVisible();
    await actualisation.start();
    await actualisation.setPmr(NEW_PMR);
    await actualisation.validateAllSteps();
    await actualisation.validateActualisation();

    await actualisation.gotoStructure();
    await actualisation.expectBannerGone();

    await expectActualisationValidated(
      seededActualisationAutorisee.id,
      NEW_PMR,
      YEAR
    );
  });

  test("un agent actualise une structure subventionnée", async ({
    page,
    seededActualisationSubventionnee,
  }) => {
    const actualisation = new ActualisationPage(
      page,
      seededActualisationSubventionnee.id,
      YEAR
    );

    await actualisation.gotoStructure();
    await actualisation.expectBannerVisible();
    await actualisation.start();
    await actualisation.setPmr(NEW_PMR);
    await actualisation.validateAllSteps();
    await actualisation.validateActualisation();

    await actualisation.gotoStructure();
    await actualisation.expectBannerGone();

    await expectActualisationValidated(
      seededActualisationSubventionnee.id,
      NEW_PMR,
      YEAR
    );
  });

  test("un agent ne peut pas valider l'étape documents sans un document requis", async ({
    page,
    seededActualisationMissingDocument,
  }) => {
    const actualisation = new ActualisationPage(
      page,
      seededActualisationMissingDocument.id,
      YEAR
    );
    const { category, label, year } = ACTUALISATION_MISSING_DOCUMENT;

    await actualisation.gotoStep("02-documents-financiers");
    await actualisation.clickValider();

    const box = actualisation.documentFinancierBox(year, label);
    await expect(box).toContainText("Ce document est requis");
    await expect(page).toHaveURL(/02-documents-financiers/);

    await actualisation.uploadDocumentFinancier(year, label);
    await expect(box).not.toContainText("Ce document est requis");
    await actualisation.clickValider();
    await page.waitForURL(
      new RegExp(`/actualisation/${YEAR}/03-analyse-financiere`)
    );

    const persisted = await prisma.documentFinancier.findFirst({
      where: {
        structureId: seededActualisationMissingDocument.id,
        category,
        year,
      },
      include: { fileUploads: true },
    });
    expect(persisted?.fileUploads[0]?.key).toBeTruthy();
  });
});
