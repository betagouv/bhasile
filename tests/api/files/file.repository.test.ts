import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { assertFilesCanBeAttachedToEntity } from "@/app/api/files/file.repository";
import prisma from "@/lib/prisma";
import { EntityId } from "@/types/Entity.type";

describe("file.repository db integration (rattachement)", () => {
  const createdStructureIds: number[] = [];
  const createdFileKeys: string[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `FILE-TEST-${randomUUID()}`,
        departementAdministratif: "50",
      },
    });
    createdStructureIds.push(structure.id);
    return structure;
  };

  const buildFile = (key: string) => ({
    key,
    mimeType: "application/pdf",
    fileSize: 1,
    originalName: `${key}.pdf`,
  });

  const createOrphanFile = async () => {
    const key = `file-orphelin-${randomUUID()}`;
    createdFileKeys.push(key);
    await prisma.fileUpload.create({ data: buildFile(key) });
    return key;
  };

  const createControleFile = async (structureId: number) => {
    const key = `file-controle-${randomUUID()}`;
    await prisma.controle.create({
      data: {
        structureId,
        date: new Date("2024-01-01T00:00:00.000Z"),
        type: "PROGRAMME",
        fileUploads: { create: buildFile(key) },
      },
    });
    return key;
  };

  const assertCanAttach = (keys: string[], entityId: EntityId) =>
    prisma.$transaction((tx) =>
      assertFilesCanBeAttachedToEntity(
        tx,
        keys.map((key) => ({ key })),
        entityId
      )
    );

  afterAll(async () => {
    await prisma.structure.deleteMany({
      where: { id: { in: createdStructureIds } },
    });
    await prisma.fileUpload.deleteMany({
      where: { key: { in: createdFileKeys } },
    });
  });

  it("accepte un fichier orphelin, même envoyé deux fois", async () => {
    const structure = await createStructure();
    const key = await createOrphanFile();

    await expect(
      assertCanAttach([key, key], { structureId: structure.id })
    ).resolves.toBeUndefined();
  });

  it("refuse une clé absente de la base avec une erreur 404", async () => {
    const structure = await createStructure();

    await expect(
      assertCanAttach([`file-inconnu-${randomUUID()}`], {
        structureId: structure.id,
      })
    ).rejects.toMatchObject({ name: "DomainError", status: 404 });
  });

  it("refuse un fichier rattaché quand l'entité cible est vide", async () => {
    const structure = await createStructure();
    const key = await createControleFile(structure.id);

    await expect(assertCanAttach([key], {})).rejects.toMatchObject({
      name: "DomainError",
      status: 409,
    });
  });

  it("refuse un fichier rattaché quand l'identifiant de l'entité cible est indéfini", async () => {
    const structure = await createStructure();
    const key = await createControleFile(structure.id);

    await expect(
      assertCanAttach([key], { cpomId: undefined })
    ).rejects.toMatchObject({ name: "DomainError", status: 409 });
  });
});
