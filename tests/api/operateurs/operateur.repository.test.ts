import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  findAllOperateurs,
  findBySearchTerm,
  findOne,
  updateOne,
} from "@/app/api/operateurs/operateur.repository";
import prisma from "@/lib/prisma";

describe("operateur.repository db integration", () => {
  let operateurId: number | undefined;
  let logoId: number | undefined;
  let logoKey: string | undefined;
  let operateurWithStructureId: number | undefined;
  let structureId: number | undefined;

  beforeAll(async () => {
    logoKey = `op-test-${randomUUID()}`;
    const operateur = await prisma.operateur.create({
      data: {
        name: `OP-TEST-${randomUUID()}`,
        logo: {
          create: {
            key: logoKey,
            mimeType: "image/png",
            fileSize: 1,
            originalName: "logo.png",
          },
        },
      },
      select: { id: true, logo: { select: { id: true } } },
    });
    operateurId = operateur.id;
    logoId = operateur.logo?.id;

    const operateurWithStructure = await prisma.operateur.create({
      data: {
        name: `OP-TEST-AVEC-STRUCTURE-${randomUUID()}`,
        structures: {
          create: {
            codeBhasile: `ST-TEST-${randomUUID()}`,
            departementAdministratif: "50",
          },
        },
      },
      select: { id: true, structures: { select: { id: true } } },
    });
    operateurWithStructureId = operateurWithStructure.id;
    structureId = operateurWithStructure.structures[0]?.id;
  });

  afterAll(async () => {
    if (logoId) {
      await prisma.fileUpload.deleteMany({ where: { id: logoId } });
    }
    if (structureId) {
      await prisma.structure.deleteMany({ where: { id: structureId } });
    }
    if (operateurWithStructureId) {
      await prisma.operateur.deleteMany({
        where: { id: operateurWithStructureId },
      });
    }
    if (operateurId) {
      await prisma.operateur.deleteMany({ where: { id: operateurId } });
    }
  });

  it("findAllOperateurs renvoie les opérateurs avec parentId et la clé de leur logo", async () => {
    const operateurs = await findAllOperateurs();
    const operateur = operateurs.find(
      (candidate) => candidate.id === operateurId
    );

    expect(operateur).toBeDefined();
    expect(operateur?.name).toContain("OP-TEST-");
    expect(operateur?.parentId).toBeNull();
    expect(operateur?.logo?.key).toBe(logoKey);
  });

  it("refuse le logo d'un autre opérateur sans déplacer le fichier", async () => {
    const otherOperateur = await prisma.operateur.create({
      data: { name: `OP-TEST-AUTRE-${randomUUID()}` },
    });

    const error = await updateOne({
      id: otherOperateur.id,
      logo: { key: logoKey! },
    }).catch((caughtError: unknown) => caughtError);

    const logoAfter = await prisma.fileUpload.findUniqueOrThrow({
      where: { key: logoKey! },
    });
    await prisma.operateur.delete({ where: { id: otherOperateur.id } });
    expect(logoAfter.operateurId).toBe(operateurId);
    expect(error).toMatchObject({ name: "DomainError", status: 409 });
  });

  it("accepte de renvoyer le logo du même opérateur", async () => {
    await updateOne({ id: operateurId, logo: { key: logoKey! } });

    const logoAfter = await prisma.fileUpload.findUniqueOrThrow({
      where: { key: logoKey! },
    });
    expect(logoAfter.operateurId).toBe(operateurId);
  });

  it("findOne renvoie null quand l'opérateur n'existe pas", async () => {
    expect(await findOne(-1)).toBeNull();
  });

  it("findBySearchTerm écarte les opérateurs sans aucune structure", async () => {
    const operateurs = await findBySearchTerm(null);
    const ids = operateurs.map((operateur) => operateur.id);

    expect(ids).toContain(operateurWithStructureId);
    expect(ids).not.toContain(operateurId);
  });
});
