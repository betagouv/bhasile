import { expect, test } from "../fixtures/test";
import { StructureModificationPage } from "../pages/structure-modification.page";
import { prisma } from "../seed/prisma";

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

  // The sections below have dynamic tables, file uploads or complex composite
  // forms. They need dedicated page-object methods and, in some cases, server-side
  // stubs for S3 uploads. They are explicitly skipped here as a TODO list — flesh
  // them out incrementally once the foundation has shaken out.

  test.skip("type-places: updating place counts for a year persists", async () => {
    // TODO: model the dynamic typologies table (one row per typologie x year).
    // Reuse pages/structure-modification.page.ts and add a fillTypePlaces() method.
  });

  test.skip("finances: updating a budget cell persists", async () => {
    // TODO: target a single budget cell (dotationAccordee for the current year)
    // using a row-scoped locator. The BudgetTables component renders one
    // <input> per (year, field) — pick a stable accessor (aria-label) and fill.
  });

  test.skip("controle-qualite: adding a controle row persists", async () => {
    // TODO: Controles component lets you add a row with date + score.
    // Decide whether to test creation or update first, then implement.
  });

  test.skip("actes-administratifs: uploading a new acte persists", async () => {
    // TODO: requires actual S3 stub or real Minio. Tag @slow once implemented.
    // Use fixtures/files/sample.pdf via page.setInputFiles().
  });

  test.skip("cascade: editing several sections in sequence stays consistent", async () => {
    // TODO: run notes → description → notes again, verify each transition
    // doesn't clobber the previous one.
  });
});
