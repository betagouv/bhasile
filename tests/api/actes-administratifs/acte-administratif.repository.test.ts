import { randomUUID } from "node:crypto";

import { afterAll, describe, expect, it } from "vitest";

import { createOrUpdateActesAdministratifs } from "@/app/api/actes-administratifs/acte-administratif.repository";
import prisma from "@/lib/prisma";
import { ActeAdministratifApiType } from "@/schemas/api/acteAdministratif.schema";
import { EntityId } from "@/types/Entity.type";

describe("acte-administratif.repository db integration (clé déjà rattachée)", () => {
  const createdStructureIds: number[] = [];
  const createdCpomIds: number[] = [];
  const createdOperateurIds: number[] = [];
  const createdTransformationIds: number[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `ACTE-TEST-${randomUUID()}`,
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

  const createActeWithFile = async (structureId: number) => {
    const key = `acte-${randomUUID()}`;
    const acte = await prisma.acteAdministratif.create({
      data: {
        structureId,
        category: "CONVENTION",
        name: "Acte d'origine",
        fileUploads: { create: buildFile(key) },
      },
    });
    return { acte, key };
  };

  const saveActe = (acte: ActeAdministratifApiType, entityId: EntityId) =>
    prisma.$transaction((tx) =>
      createOrUpdateActesAdministratifs(tx, [acte], entityId)
    );

  const buildActePayload = (key: string, name = "Acte envoyé") => ({
    category: "CONVENTION" as const,
    name,
    fileUploads: [{ key }],
  });

  const createTransformationBlock = async () => {
    const transformation = await prisma.transformation.create({
      data: {
        type: "OUVERTURE_EX_NIHILO",
        structureVersionTransformations: {
          create: { type: "CREATION" },
        },
      },
      include: { structureVersionTransformations: true },
    });
    createdTransformationIds.push(transformation.id);
    return transformation.structureVersionTransformations[0];
  };

  afterAll(async () => {
    await prisma.transformation.deleteMany({
      where: { id: { in: createdTransformationIds } },
    });
    await prisma.structure.deleteMany({
      where: { id: { in: createdStructureIds } },
    });
    await prisma.cpom.deleteMany({ where: { id: { in: createdCpomIds } } });
    await prisma.operateur.deleteMany({
      where: { id: { in: createdOperateurIds } },
    });
  });

  it("refuse la clé de l'acte d'une autre structure sans déplacer la ligne", async () => {
    const otherStructure = await createStructure();
    const structure = await createStructure();
    const { acte, key } = await createActeWithFile(otherStructure.id);

    const error = await saveActe(buildActePayload(key), {
      structureId: structure.id,
    }).catch((caughtError: unknown) => caughtError);

    const acteAfter = await prisma.acteAdministratif.findUniqueOrThrow({
      where: { id: acte.id },
    });
    expect(acteAfter.structureId).toBe(otherStructure.id);
    expect(acteAfter.name).toBe("Acte d'origine");
    expect(error).toMatchObject({ name: "DomainError", status: 409 });
  });

  it("refuse la clé de l'acte d'une structure sur un CPOM sans déplacer la ligne", async () => {
    const otherStructure = await createStructure();
    const { acte, key } = await createActeWithFile(otherStructure.id);
    const operateur = await prisma.operateur.create({
      data: { name: `ACTE-TEST-${randomUUID()}` },
    });
    createdOperateurIds.push(operateur.id);
    const cpom = await prisma.cpom.create({
      data: { operateurId: operateur.id },
    });
    createdCpomIds.push(cpom.id);

    const error = await saveActe(buildActePayload(key), {
      cpomId: cpom.id,
    }).catch((caughtError: unknown) => caughtError);

    const acteAfter = await prisma.acteAdministratif.findUniqueOrThrow({
      where: { id: acte.id },
    });
    expect(acteAfter.cpomId).toBeNull();
    expect(acteAfter.structureId).toBe(otherStructure.id);
    expect(error).toMatchObject({ name: "DomainError", status: 409 });
  });

  it("refuse la clé d'une autre structure sur un acte existant sans prendre le fichier", async () => {
    const otherStructure = await createStructure();
    const structure = await createStructure();
    const { acte: foreignActe, key: foreignKey } = await createActeWithFile(
      otherStructure.id
    );
    const { acte: ownActe } = await createActeWithFile(structure.id);

    const error = await saveActe(
      { ...buildActePayload(foreignKey), id: ownActe.id },
      { structureId: structure.id }
    ).catch((caughtError: unknown) => caughtError);

    const fileAfter = await prisma.fileUpload.findUniqueOrThrow({
      where: { key: foreignKey },
    });
    expect(fileAfter.acteAdministratifId).toBe(foreignActe.id);
    expect(error).toMatchObject({ name: "DomainError", status: 409 });
  });

  it("refuse la clé du document financier d'une autre structure sans rattacher le fichier", async () => {
    const otherStructure = await createStructure();
    const structure = await createStructure();
    const key = `acte-docfin-${randomUUID()}`;
    await prisma.documentFinancier.create({
      data: {
        structureId: otherStructure.id,
        year: 2025,
        category: "RAPPORT_BUDGETAIRE",
        fileUploads: { create: buildFile(key) },
      },
    });

    const error = await saveActe(buildActePayload(key), {
      structureId: structure.id,
    }).catch((caughtError: unknown) => caughtError);

    const fileAfter = await prisma.fileUpload.findUniqueOrThrow({
      where: { key },
    });
    expect(fileAfter.acteAdministratifId).toBeNull();
    expect(error).toMatchObject({ name: "DomainError", status: 409 });
  });

  it("refuse la clé de l'acte d'un autre bloc de transformation sans déplacer la ligne", async () => {
    const otherBlock = await createTransformationBlock();
    const block = await createTransformationBlock();
    const key = `acte-bloc-${randomUUID()}`;
    const acte = await prisma.acteAdministratif.create({
      data: {
        structureVersionTransformationId: otherBlock.id,
        category: "CONVENTION",
        fileUploads: { create: buildFile(key) },
      },
    });

    const error = await saveActe(buildActePayload(key), {
      structureVersionTransformationId: block.id,
    }).catch((caughtError: unknown) => caughtError);

    const acteAfter = await prisma.acteAdministratif.findUniqueOrThrow({
      where: { id: acte.id },
    });
    expect(acteAfter.structureVersionTransformationId).toBe(otherBlock.id);
    expect(error).toMatchObject({ name: "DomainError", status: 409 });
  });

  it("met à jour la ligne quand la clé appartient déjà à la même structure", async () => {
    const structure = await createStructure();
    const { acte, key } = await createActeWithFile(structure.id);

    await saveActe(buildActePayload(key, "Nouveau nom"), {
      structureId: structure.id,
    });

    const actes = await prisma.acteAdministratif.findMany({
      where: { structureId: structure.id },
    });
    expect(actes).toHaveLength(1);
    expect(actes[0]?.id).toBe(acte.id);
    expect(actes[0]?.name).toBe("Nouveau nom");
  });
});
