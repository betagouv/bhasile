import { getTypePlacesYearRange, getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR, PLACES_VERSIONED_FROM_YEAR } from "@/constants";
import { minioClient } from "@/lib/minio";
import { ControleType } from "@/types/controle.type";

import { expect, test } from "../fixtures/test";
import { StructureModificationPage } from "../pages/structure-modification.page";
import { prisma } from "../seed/prisma";
import {
  seedValidIndicateursFinanciers,
  seedValidStructureBudgets,
  seedValidStructureTypologies,
} from "../seed/structure.seed";

// Les places ≥ PLACES_VERSIONED_FROM_YEAR sont désormais gérées via
// contraction/extension : leur cellule est désactivée dans le tableau. Seules
// les années légères (< seuil) restent éditables ici.
const TYPE_PLACES_CURRENT_YEAR_ROW_INDEX =
  getTypePlacesYearRange().years.indexOf(CURRENT_YEAR);
const TYPE_PLACES_EDITABLE_YEAR = PLACES_VERSIONED_FROM_YEAR - 1;
const TYPE_PLACES_EDITABLE_YEAR_ROW_INDEX =
  getTypePlacesYearRange().years.indexOf(TYPE_PLACES_EDITABLE_YEAR);
const FINANCE_CURRENT_YEAR_ROW_INDEX =
  getYearRange().years.indexOf(CURRENT_YEAR);

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

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

    const persisted = await prisma.structureVersion.findUniqueOrThrow({
      where: { id: seededStructure.structureVersionId },
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

    const persisted = await prisma.structureVersion.findUniqueOrThrow({
      where: { id: seededStructure.structureVersionId },
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
    // L'année courante (≥ seuil) est verrouillée : elle ne se modifie que par
    // contraction/extension.
    await expect(
      modification.placesAutoriseesInput(TYPE_PLACES_CURRENT_YEAR_ROW_INDEX)
    ).toBeDisabled();
    await modification.fillPlacesAutorisees(
      TYPE_PLACES_EDITABLE_YEAR_ROW_INDEX,
      newPlacesAutorisees
    );
    await modification.submitAndWaitForSave();

    const persisted = await prisma.structureTypologie.findFirstOrThrow({
      where: {
        structureId: seededStructure.id,
        year: TYPE_PLACES_EDITABLE_YEAR,
      },
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

  test(
    "controle-qualite: adding a controle row persists",
    { tag: "@slow" },
    async ({ page, seededStructure }) => {
      test.slow();
      const modification = new StructureModificationPage(
        page,
        seededStructure.id
      );
      const controleDate = "2024-03-15";

      await modification.goto("controle-qualite");
      await modification.markStructureHasNoEvaluation();
      await modification.uploadControleRapport();
      await modification.addControle(controleDate, ControleType.PROGRAMME);
      await modification.submitAndWaitForSave();

      const controles = await prisma.controle.findMany({
        where: { structureId: seededStructure.id },
        include: { fileUploads: true },
      });
      const controle = controles.find(
        (persistedControle) => persistedControle.fileUploads.length > 0
      );
      expect(controle).toBeDefined();
      expect(controle!.type).toBe("PROGRAMME");
      expect(controle!.fileUploads[0].key).toBeTruthy();
      expect(controle!.date.toISOString()).toContain("2024-03-15");

      const stat = await minioClient.statObject(
        S3_BUCKET_NAME,
        controle!.fileUploads[0].key
      );
      expect(stat.size).toBeGreaterThan(0);
    }
  );

  test("cascade: editing several sections in sequence stays consistent", async ({
    page,
    seededStructure,
  }) => {
    test.slow();
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

    const afterDescription = await prisma.structureVersion.findUniqueOrThrow({
      where: { id: seededStructure.structureVersionId },
      select: { notes: true, public: true },
    });
    expect(afterDescription.public).toBe("FAMILLE");
    expect(afterDescription.notes).toBe(firstNote);

    await modification.goto("notes");
    await modification.fillNotes(secondNote);
    await modification.submitAndWaitForSave();

    const afterSecondNote = await prisma.structureVersion.findUniqueOrThrow({
      where: { id: seededStructure.structureVersionId },
      select: { notes: true, public: true },
    });
    expect(afterSecondNote.notes).toBe(secondNote);
    expect(afterSecondNote.public).toBe("FAMILLE");
  });

  test(
    "actes-administratifs: uploading convention, avenant and autre persists",
    { tag: "@slow" },
    async ({ page, seededSubventionneeStructure }) => {
      test.slow();
      const modification = new StructureModificationPage(
        page,
        seededSubventionneeStructure.id
      );
      const autreName = `Doc e2e ${Date.now()}`;

      await modification.goto("actes-administratifs");

      await modification.fillConventionDates("2024-01-01", "2026-12-31");
      await modification.uploadConventionDocument();

      await modification.addConventionAvenant();
      await modification.fillAvenantDate("2025-06-01");
      await modification.uploadAvenantDocument();

      await modification.fillAutreName(autreName);
      await modification.uploadAutreDocument();

      await modification.submitAndWaitForSave();

      const actes = await prisma.acteAdministratif.findMany({
        where: { structureId: seededSubventionneeStructure.id },
        include: { fileUploads: true },
      });

      const convention = actes.find(
        (acte) => acte.category === "CONVENTION" && acte.parentId === null
      );
      expect(convention).toBeDefined();
      expect(convention!.fileUploads[0]?.key).toBeTruthy();
      expect(convention!.startDate).not.toBeNull();
      expect(convention!.endDate).not.toBeNull();

      const avenant = actes.find((acte) => acte.parentId === convention!.id);
      expect(avenant).toBeDefined();
      expect(avenant!.fileUploads[0]?.key).toBeTruthy();
      expect(avenant!.date).not.toBeNull();

      const autre = actes.find((acte) => acte.category === "AUTRE");
      expect(autre).toBeDefined();
      expect(autre!.fileUploads[0]?.key).toBeTruthy();
      expect(autre!.name).toBe(autreName);

      const stat = await minioClient.statObject(
        S3_BUCKET_NAME,
        convention!.fileUploads[0].key
      );
      expect(stat.size).toBeGreaterThan(0);
    }
  );
});
