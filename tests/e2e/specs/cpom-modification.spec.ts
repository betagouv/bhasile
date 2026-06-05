import { getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";

import { expect, test } from "../fixtures/test";
import { CpomModificationPage } from "../pages/cpom-modification.page";
import { attachStructureToCpom } from "../seed/cpom.seed";
import { prisma } from "../seed/prisma";

const FINANCE_CURRENT_YEAR_ROW_INDEX =
  getYearRange().years.indexOf(CURRENT_YEAR);

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

  test("finances: updating a budget cell persists", async ({
    page,
    seededCpomWithDates,
    seededStructure,
  }) => {
    await attachStructureToCpom(seededCpomWithDates.id, seededStructure.id);
    const modification = new CpomModificationPage(page, seededCpomWithDates.id);
    const newDotationDemandee = 424242;

    await modification.goto("finances");
    await modification.fillDotationDemandee(
      FINANCE_CURRENT_YEAR_ROW_INDEX,
      newDotationDemandee
    );
    await modification.submitAndWaitForSave();

    const persisted = await prisma.budget.findFirstOrThrow({
      where: {
        cpomId: seededCpomWithDates.id,
        year: CURRENT_YEAR,
        cpomStructureType: seededStructure.type,
      },
      select: { dotationDemandee: true },
    });
    expect(persisted.dotationDemandee).toBe(newDotationDemandee);
  });

  // Upload S3 (vrai bucket dev) : laissé en skip, traité dans un second temps.
  test.skip("actes-administratifs: uploading a new acte persists", async () => {
    // TODO: requires S3 stub or real Minio. Reuse fixtures/files/sample.pdf
    // via setInputFiles and tag @slow.
  });
});
