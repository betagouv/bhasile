import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { findAllCpoms } from "@/app/api/cpoms/cpom.repository";
import prisma from "@/lib/prisma";

describe("cpom.repository db integration", () => {
  const conventionStart = new Date("2023-01-01T00:00:00.000Z");
  const conventionEnd = new Date("2026-01-01T00:00:00.000Z");

  let cpomId: number | undefined;
  let operateurId: number | undefined;
  let regionId: number | undefined;
  let departementId: number | undefined;
  let structureId: number | undefined;

  beforeAll(async () => {
    const operateur = await prisma.operateur.create({
      data: { name: `CPOM-TEST-${randomUUID()}` },
    });
    operateurId = operateur.id;

    const region = await prisma.region.create({
      data: { name: `Région ${randomUUID()}`, code: randomUUID().slice(0, 4) },
    });
    regionId = region.id;

    const departement = await prisma.departement.create({
      data: { numero: `T${randomUUID().slice(0, 6)}`, name: "Test Dept" },
    });
    departementId = departement.id;

    const structure = await prisma.structure.create({
      data: { codeBhasile: `CPOM-TEST-${randomUUID()}` },
    });
    structureId = structure.id;

    const cpom = await prisma.cpom.create({
      data: {
        operateur: { connect: { id: operateur.id } },
        region: { connect: { id: region.id } },
        departements: {
          create: { departement: { connect: { id: departement.id } } },
        },
        structures: {
          create: { structure: { connect: { id: structure.id } } },
        },
        budgets: { create: { year: 2024 } },
        actesAdministratifs: {
          create: {
            category: "CONVENTION_CPOM",
            startDate: conventionStart,
            endDate: conventionEnd,
          },
        },
      },
    });
    cpomId = cpom.id;
  });

  afterAll(async () => {
    if (cpomId) {
      await prisma.cpom.deleteMany({ where: { id: cpomId } });
    }
    if (structureId) {
      await prisma.structure.deleteMany({ where: { id: structureId } });
    }
    if (departementId) {
      await prisma.departement.deleteMany({ where: { id: departementId } });
    }
    if (regionId) {
      await prisma.region.deleteMany({ where: { id: regionId } });
    }
    if (operateurId) {
      await prisma.operateur.deleteMany({ where: { id: operateurId } });
    }
  });

  it("hydrate toutes les relations de cpomListInclude dont dépend le calcul TS", async () => {
    const cpoms = await findAllCpoms();
    const cpom = cpoms.find((candidate) => candidate.id === cpomId);

    expect(cpom).toBeDefined();
    expect(cpom?.operateur.name).toContain("CPOM-TEST-");
    expect(cpom?.region?.id).toBe(regionId);
    expect(cpom?.departements[0]?.departement.id).toBe(departementId);
    expect(cpom?.structures[0]?.structureId).toBe(structureId);
    expect(cpom?.budgets[0]?.year).toBe(2024);
    expect(cpom?.actesAdministratifs[0]?.category).toBe("CONVENTION_CPOM");
  });
});
