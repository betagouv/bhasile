import { getTypePlacesYearRange, getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";

import { expect, test } from "../fixtures/test";
import { StructureModificationPage } from "../pages/structure-modification.page";
import { prisma } from "../seed/prisma";
import {
  seedValidIndicateursFinanciers,
  seedValidStructureBudgets,
  seedValidStructureTypologies,
} from "../seed/structure.seed";

const TYPE_PLACES_CURRENT_YEAR_ROW_INDEX =
  getTypePlacesYearRange().years.indexOf(CURRENT_YEAR);
const FINANCE_CURRENT_YEAR_ROW_INDEX =
  getYearRange().years.indexOf(CURRENT_YEAR);

test.describe("Structure modification", () => {
  test("notes: updates persist after reload", async ({
    page,
    seededStructure,
  }) => {
    const modification = new StructureModificationPage(
      page,
      seededStructure.id
    );
    const noteText = `Note e2e ${Date.now()}`;

    await modification.goto("notes");
    await modification.fillNotes(noteText);
    await modification.submitAndWaitForSave();

    const persisted = await prisma.structure.findUniqueOrThrow({
      where: { id: seededStructure.id },
      select: { notes: true },
    });
    expect(persisted.notes).toBe(noteText);

    await modification.goto("notes");

    await expect(page.locator("textarea#notes").last()).toHaveValue(noteText);
  });

  test("description: changing 'Public' persists", async ({
    page,
    seededStructure,
  }) => {
    const modification = new StructureModificationPage(
      page,
      seededStructure.id
    );

    await modification.goto("description");
    await modification.selectPublic("Famille");
    await modification.submitAndWaitForSave();

    const persisted = await prisma.structure.findUniqueOrThrow({
      where: { id: seededStructure.id },
      select: { public: true },
    });
    expect(persisted.public).toBe("FAMILLE");
  });

  test("type-places: updating place counts for a year persists", async ({
    page,
    seededStructure,
  }) => {
    await seedValidStructureTypologies(seededStructure.id);
    const modification = new StructureModificationPage(
      page,
      seededStructure.id
    );
    const newPlacesAutorisees = 42;

    await modification.goto("type-places");
    await modification.fillPlacesAutorisees(
      TYPE_PLACES_CURRENT_YEAR_ROW_INDEX,
      newPlacesAutorisees
    );
    await modification.submitAndWaitForSave();

    const persisted = await prisma.structureTypologie.findFirstOrThrow({
      where: { structureId: seededStructure.id, year: CURRENT_YEAR },
      select: { placesAutorisees: true },
    });
    expect(persisted.placesAutorisees).toBe(newPlacesAutorisees);
  });

  test("finances: updating a budget cell persists", async ({
    page,
    seededStructure,
  }) => {
    await seedValidStructureBudgets(seededStructure.id);
    await seedValidIndicateursFinanciers(seededStructure.id);
    const modification = new StructureModificationPage(
      page,
      seededStructure.id
    );
    const newDotationDemandee = 424242;

    await modification.goto("finances");
    await modification.fillDotationDemandee(
      FINANCE_CURRENT_YEAR_ROW_INDEX,
      newDotationDemandee
    );
    await modification.submitAndWaitForSave();

    const persisted = await prisma.budget.findFirstOrThrow({
      where: { structureId: seededStructure.id, year: CURRENT_YEAR },
      select: { dotationDemandee: true },
    });
    expect(persisted.dotationDemandee).toBe(newDotationDemandee);
  });

  // Dépendant d'un upload S3 : un contrôle ne persiste QUE s'il porte un fichier.
  // transformFormControlesToApiControles (src/app/utils/controle.util.ts) filtre
  // tout contrôle sans `fileUploads[0].key`. À traiter avec les autres tests
  // d'upload. La page-object expose déjà addControle() et
  // markStructureHasNoEvaluation() (structure autorisée).
  test.skip("controle-qualite: adding a controle row persists", async () => {
    // TODO: uploader fixtures/files/sample.pdf via le champ "Rapport", attendre
    // le key, markStructureHasNoEvaluation(), puis addControle(date, type) + submit.
  });

  test("cascade: editing several sections in sequence stays consistent", async ({
    page,
    seededStructure,
  }) => {
    const modification = new StructureModificationPage(
      page,
      seededStructure.id
    );
    const firstNote = `Note cascade A ${Date.now()}`;
    const secondNote = `Note cascade B ${Date.now()}`;

    await modification.goto("notes");
    await modification.fillNotes(firstNote);
    await modification.submitAndWaitForSave();

    await modification.goto("description");
    await modification.selectPublic("Famille");
    await modification.submitAndWaitForSave();

    const afterDescription = await prisma.structure.findUniqueOrThrow({
      where: { id: seededStructure.id },
      select: { notes: true, public: true },
    });
    expect(afterDescription.public).toBe("FAMILLE");
    expect(afterDescription.notes).toBe(firstNote);

    await modification.goto("notes");
    await modification.fillNotes(secondNote);
    await modification.submitAndWaitForSave();

    const afterSecondNote = await prisma.structure.findUniqueOrThrow({
      where: { id: seededStructure.id },
      select: { notes: true, public: true },
    });
    expect(afterSecondNote.notes).toBe(secondNote);
    expect(afterSecondNote.public).toBe("FAMILLE");
  });

  // Upload S3 (vrai bucket dev) : laissé en skip, traité dans un second temps.
  test.skip("actes-administratifs: uploading a new acte persists", async () => {
    // TODO: requires actual S3 stub or real Minio. Tag @slow once implemented.
    // Use fixtures/files/sample.pdf via page.setInputFiles().
  });
});
