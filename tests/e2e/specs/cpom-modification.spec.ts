import { expect, test } from "../fixtures/test";
import { CpomModificationPage } from "../pages/cpom-modification.page";
import { prisma } from "../seed/prisma";

test.describe("CPOM modification", () => {
  test("description: changing departement persists", async ({
    page,
    seededCpom,
  }) => {
    const modification = new CpomModificationPage(page, seededCpom.id);
    await modification.goto("description");
    await modification.selectDepartement("92");
    await modification.submitAndWaitForSave();

    const persisted = await prisma.cpomDepartement.findMany({
      where: { cpomId: seededCpom.id },
      include: { departement: { select: { numero: true } } },
    });
    const numeros = persisted.map((d) => d.departement.numero);
    expect(numeros).toEqual(["92"]);
  });

  test("composition: attaching a structure persists", async ({
    page,
    seededCpomWithDates,
    seededStructure,
  }) => {
    const modification = new CpomModificationPage(page, seededCpomWithDates.id);
    await modification.goto("composition");
    await modification.attachStructure(seededStructure.id);
    await modification.submitAndWaitForSave();

    const persisted = await prisma.cpomStructure.findMany({
      where: { cpomId: seededCpomWithDates.id },
      select: { structureId: true },
    });
    expect(persisted.map((p) => p.structureId)).toContain(seededStructure.id);
  });

  // The sections below require richer UI interactions (dynamic budget tables,
  // file uploads). They are stubs for now — implement once the foundation has
  // shaken out.

  test.skip("finances: updating a budget cell persists", async () => {
    // TODO: target a single CpomTables cell by year/StructureType and fill it,
    // then verify the Budget row in DB (cpomId + year + cpomStructureType).
  });

  test.skip("actes-administratifs: uploading a new acte persists", async () => {
    // TODO: requires S3 stub or real Minio. Reuse fixtures/files/sample.pdf
    // via setInputFiles and tag @slow.
  });
});
