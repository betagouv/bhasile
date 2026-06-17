import type { Page } from "@playwright/test";

import { StructureType } from "@/types/structure.type";
import {
  StructureVersionTransformationType,
  TransformationType,
} from "@/types/transformation.type";

import { expect, test } from "../fixtures/test";
import { mockBanApi } from "../pages/shared/ban-mock.helper";
import { fillCurrentStep } from "../pages/transformation/fillers/step-fillers";
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

const parseTransformationId = (page: Page): number => {
  const match = page.url().match(/\/structures\/transformation\/(\d+)/);
  return Number(match?.[1]);
};

const startCreationDraft = async (page: Page): Promise<number> => {
  await page.goto("/structures/transformation/type?type=creation", {
    waitUntil: "domcontentloaded",
  });
  await selectTransformationType(page, TransformationType.OUVERTURE_EX_NIHILO);
  await submitSelection(page);
  await page.waitForURL(/\/structures\/transformation\/\d+(\/|$)/, {
    timeout: 30_000,
  });
  return parseTransformationId(page);
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
  return body.transformationId ?? body.id ?? 0;
};

// WIP — tests transverses à finaliser (cf. blocages documentés dans
// transformation.spec.ts). Les drafts seedés via API + deep-link vers
// vérification/bandeau ne se comportent pas encore comme attendu, et le test 5
// dépend du blocage operateur.id en création.
test.describe("Transformations — comportements transverses", () => {
  test.beforeEach(async ({ page }) => {
    await mockBanApi(page);
  });

  test.fixme("1 — la finalisation est bloquée si des étapes sont incomplètes", async ({
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

  test.fixme("3 — le bandeau des transformations en cours s'affiche au-dessus de la liste", async ({
    page,
    closingStructure,
    registerTransformation,
  }) => {
    const transformationId = await createFermetureDraftViaApi(
      page,
      closingStructure.id
    );
    registerTransformation(transformationId);

    await page.goto("/structures", { waitUntil: "domcontentloaded" });
    const banner = page.getByText(
      /créations, transformations et fermetures en cours/i
    );
    await expect(banner).toBeVisible();
    // Identité : le bandeau contient le lien vers NOTRE transformation.
    await expect(
      page.locator(`a[href="/structures/transformation/${transformationId}"]`)
    ).toBeAttached();
  });

  test.fixme("4 — annuler la démarche supprime le brouillon", async ({
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

  test.fixme("2 — enregistrer l'avancée via le header sauvegarde un brouillon", async ({
    page,
    registerTransformation,
  }) => {
    const transformationId = await startCreationDraft(page);
    registerTransformation(transformationId);

    await page.locator('input[name="nom"]').fill("E2E-DRAFT-NOM");
    await saveProgress(page);

    const draft = await prisma.transformation.findUniqueOrThrow({
      where: { id: transformationId },
      include: { form: true },
    });
    expect(draft.form?.status).toBe(false);
  });

  test.fixme("5 — quitter en cours de saisie ouvre la pop-in de confirmation", async ({
    page,
    knownDnaCode,
    registerTransformation,
  }) => {
    const transformationId = await startCreationDraft(page);
    registerTransformation(transformationId);

    await fillCurrentStep(
      page,
      {
        creationNom: "E2E-QUIT",
        dnaCode: knownDnaCode,
        operateurSearch: "Opér",
        structureType: StructureType.CADA,
      },
      {}
    );
    await clickEtapeSuivante(page);

    await page.getByRole("button", { name: "Quitter" }).click();
    await expect(
      page.getByText(/vous êtes sur le point de quitter/i)
    ).toBeVisible();
  });
});
