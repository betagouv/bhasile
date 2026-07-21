import type { Page } from "@playwright/test";

import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { expect, test } from "../fixtures/test";
import { mockBanApi } from "../pages/shared/ban-mock.helper";
import { enterViaCreationCta } from "../pages/transformation/entry.helper";
import { fillCurrentStep } from "../pages/transformation/fillers/step-fillers";
import {
  captureTransformationId,
  creationContext,
} from "../pages/transformation/flows/transformation-flows";
import {
  selectTransformationType,
  submitSelection,
} from "../pages/transformation/selection.helper";
import {
  annulerDemarche,
  clickEtapeSuivante,
  gotoVerification,
  saveProgress,
  tryFinalizeExpectingBlock,
} from "../pages/transformation/transformation-nav.helper";
import { prisma } from "../seed/prisma";
import { fetchTransformationGraph } from "../seed/transformation-assert";

const startCreationDraft = async (page: Page): Promise<number> => {
  await enterViaCreationCta(page);
  await selectTransformationType(page, TransformationType.OUVERTURE_EX_NIHILO);
  await submitSelection(page);
  return captureTransformationId(page);
};

const createFermetureDraftViaApi = async (
  page: Page,
  structureId: number
): Promise<number> => {
  const response = await page.request.post("/api/transformations", {
    data: {
      type: TransformationType.FERMETURE_SANS_TRANSFERT,
      structureVersionTransformations: [
        {
          type: StructureVersionTransformationType.FERMETURE,
          structureVersion: { structureId },
        },
      ],
    },
  });
  expect(response.ok()).toBeTruthy();
  const body = (await response.json()) as {
    transformationId?: number;
    id?: number;
  };
  const transformationId = body.transformationId ?? body.id;
  if (transformationId === undefined) {
    throw new Error(
      `POST /api/transformations sans id exploitable: ${JSON.stringify(body)}`
    );
  }
  return transformationId;
};

test.describe("Transformations — comportements transverses", () => {
  test.beforeEach(async ({ page }) => {
    await mockBanApi(page);
  });

  test("la finalisation est bloquée si des étapes sont incomplètes", async ({
    page,
    closingStructure,
    registerTransformation,
  }) => {
    const transformationId = await createFermetureDraftViaApi(
      page,
      closingStructure.id
    );
    registerTransformation(transformationId);

    await gotoVerification(page, transformationId);
    await tryFinalizeExpectingBlock(page);

    const draft = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
      include: { form: true },
    });
    expect(draft.form?.status).toBe(false);
  });

  test("le tableau de bord liste les transformations en cours avec un lien vers la démarche", async ({
    page,
    closingStructure,
    registerTransformation,
  }) => {
    const transformationId = await createFermetureDraftViaApi(
      page,
      closingStructure.id
    );
    registerTransformation(transformationId);

    await page.goto("/", { waitUntil: "domcontentloaded" });
    await expect(
      page.getByRole("heading", {
        name: /créations, transformations et fermetures de structures/i,
      })
    ).toBeVisible();
    await expect(
      page.locator(`a[href="/structures/transformation/${transformationId}"]`)
    ).toBeAttached();
  });

  test("annuler la démarche supprime le brouillon", async ({
    page,
    closingStructure,
  }) => {
    const transformationId = await createFermetureDraftViaApi(
      page,
      closingStructure.id
    );

    await gotoVerification(page, transformationId);
    await annulerDemarche(page);

    const deleted = await prisma.transformation.findUnique({
      where: { id: transformationId },
    });
    expect(deleted).toBeNull();
  });

  test("enregistrer l'avancée via le header sauvegarde un brouillon", async ({
    page,
    knownDnaCodes,
    registerTransformation,
  }) => {
    const transformationId = await startCreationDraft(page);
    registerTransformation(transformationId);

    await fillCurrentStep(
      page,
      creationContext(knownDnaCodes, "E2E-DRAFT-NOM"),
      {}
    );
    await saveProgress(page);

    const draft = await fetchTransformationGraph(transformationId);
    expect(draft.form?.status).toBe(false);
    expect(
      draft.structureVersionTransformations[0]?.structureVersion?.nom
    ).toBe("E2E-DRAFT-NOM");
  });

  test("quitter en cours de saisie ouvre la pop-in de confirmation", async ({
    page,
    knownDnaCodes,
    registerTransformation,
  }) => {
    const transformationId = await startCreationDraft(page);
    registerTransformation(transformationId);

    await fillCurrentStep(page, creationContext(knownDnaCodes, "E2E-QUIT"), {});
    await clickEtapeSuivante(page);

    await page.getByRole("button", { name: "Quitter" }).click();
    await expect(
      page.getByText(/vous êtes sur le point de quitter/i)
    ).toBeVisible();
  });
});
