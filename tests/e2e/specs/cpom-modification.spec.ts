import { getYearRange } from "@/app/utils/date.util";
import { CURRENT_YEAR } from "@/constants";
import { minioClient } from "@/lib/minio";

import { expect, test } from "../fixtures/test";
import { CpomModificationPage } from "../pages/cpom-modification.page";
import { attachStructureToCpom } from "../seed/cpom.seed";
import { prisma } from "../seed/prisma";

const FINANCE_CURRENT_YEAR_ROW_INDEX =
  getYearRange().years.indexOf(CURRENT_YEAR);

const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME!;

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

  test(
    "actes-administratifs: uploading convention, avenant and autre persists",
    { tag: "@slow" },
    async ({ page, seededCpom }) => {
      test.slow();
      const modification = new CpomModificationPage(page, seededCpom.id);
      const autreName = `Doc e2e ${Date.now()}`;

      await modification.goto("actes-administratifs");

      await modification.fillConventionDates("2024-01-01", "2026-12-31");
      await modification.uploadConventionDocument();

      await modification.addConventionAvenant();
      await modification.fillAvenantDate("2025-06-01");
      await modification.uploadAvenantDocument();

      await modification.addAutreDocument();
      await modification.fillAutreName(autreName);
      await modification.uploadAutreDocument();

      await modification.submitAndWaitForSave();

      const actes = await prisma.acteAdministratif.findMany({
        where: { cpomId: seededCpom.id },
        include: { fileUploads: true },
      });

      const convention = actes.find(
        (acte) => acte.category === "CONVENTION_CPOM" && acte.parentId === null
      );
      expect(convention).toBeDefined();
      expect(convention!.fileUploads[0]?.key).toBeTruthy();

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
