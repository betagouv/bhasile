import { expect, test } from "../fixtures/test";
import { CpomCreationPage } from "../pages/cpom-creation.page";
import { deleteCpomById } from "../seed/cleanup";
import { prisma } from "../seed/prisma";

test.describe("CPOM creation", () => {
  test.describe.configure({ timeout: 60000 });

  let createdCpomId: number | null = null;
  const captureCpomId = (id: number): void => {
    createdCpomId = id;
  };

  test.afterEach(async () => {
    if (createdCpomId !== null) {
      await deleteCpomById(createdCpomId).catch(() => {});
      createdCpomId = null;
    }
  });

  test("départementale (Île-de-France 75)", async ({
    page,
    structuresPool,
  }) => {
    const creation = new CpomCreationPage(page);
    await creation.gotoIdentification();
    await creation.fillIdentification({
      granularity: "DEPARTEMENTALE",
      operateurSearch: "Opér",
      region: "Île-de-France",
      departementNumeros: ["75"],
      acteStartDate: "2024-01-01",
      acteEndDate: "2025-12-31",
      structureIds: [structuresPool[0].id],
    });
    const cpomId = await creation.submitIdentification(captureCpomId);
    await creation.submitFinancesEmpty(cpomId);

    const persisted = await prisma.cpom.findUniqueOrThrow({
      where: { id: cpomId },
      include: {
        structures: { select: { structureId: true } },
        departements: {
          include: { departement: { select: { numero: true } } },
        },
      },
    });
    expect(persisted.granularity).toBe("DEPARTEMENTALE");
    expect(persisted.structures.map((s) => s.structureId)).toEqual([
      structuresPool[0].id,
    ]);
    expect(persisted.departements.map((d) => d.departement.numero)).toEqual([
      "75",
    ]);
  });

  test("interdépartementale (Île-de-France 75 + 92)", async ({
    page,
    structuresPool,
  }) => {
    const creation = new CpomCreationPage(page);
    await creation.gotoIdentification();
    await creation.fillIdentification({
      granularity: "INTERDEPARTEMENTALE",
      operateurSearch: "Opér",
      region: "Île-de-France",
      departementNumeros: ["75", "92"],
      acteStartDate: "2024-01-01",
      acteEndDate: "2025-12-31",
      structureIds: [structuresPool[0].id, structuresPool[1].id],
    });
    const cpomId = await creation.submitIdentification(captureCpomId);
    await creation.submitFinancesEmpty(cpomId);

    const persisted = await prisma.cpom.findUniqueOrThrow({
      where: { id: cpomId },
      include: {
        structures: { select: { structureId: true } },
        departements: {
          include: { departement: { select: { numero: true } } },
        },
      },
    });
    expect(persisted.granularity).toBe("INTERDEPARTEMENTALE");
    expect(
      persisted.departements.map((d) => d.departement.numero).sort()
    ).toEqual(["75", "92"]);
    expect(persisted.structures.map((s) => s.structureId).sort()).toEqual(
      [structuresPool[0].id, structuresPool[1].id].sort()
    );
  });

  test("régionale (Île-de-France, tous les départements)", async ({
    page,
    structuresPool,
  }) => {
    const ILE_DE_FRANCE_NUMEROS = [
      "75",
      "77",
      "78",
      "91",
      "92",
      "93",
      "94",
      "95",
    ];

    const creation = new CpomCreationPage(page);
    await creation.gotoIdentification();
    await creation.fillIdentification({
      granularity: "REGIONALE",
      operateurSearch: "Opér",
      region: "Île-de-France",
      departementNumeros: [],
      acteStartDate: "2024-01-01",
      acteEndDate: "2025-12-31",
      structureIds: [structuresPool[0].id],
    });
    const cpomId = await creation.submitIdentification(captureCpomId);
    await creation.submitFinancesEmpty(cpomId);

    const persisted = await prisma.cpom.findUniqueOrThrow({
      where: { id: cpomId },
      include: {
        departements: {
          include: { departement: { select: { numero: true } } },
        },
      },
    });
    expect(persisted.granularity).toBe("REGIONALE");
    expect(
      persisted.departements.map((d) => d.departement.numero).sort()
    ).toEqual(ILE_DE_FRANCE_NUMEROS);
  });
});
