import { test } from "../fixtures/test";
import { ActualisationPage } from "../pages/actualisation.page";
import { expectActualisationValidated } from "../seed/actualisation-assert";

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
      seededActualisationAutorisee.campaignId,
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
      seededActualisationSubventionnee.campaignId,
      NEW_PMR,
      YEAR
    );
  });
});
