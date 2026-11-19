import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createOrUpdateDocumentsFinanciers } from "@/app/api/documents-financiers/documentFinancier.repository";
import prisma from "@/lib/prisma";
import { DocumentFinancierApiType } from "@/schemas/api/documentFinancier.schema";
import { StructureType } from "@/types/structure.type";

describe("documentFinancier.repository db integration (CPOM)", () => {
  let cpomId: number;
  let operateurId: number;
  const keyA = `cpom-fin-a-${randomUUID()}`;
  const keyB = `cpom-fin-b-${randomUUID()}`;

  const makeDoc = (key: string): DocumentFinancierApiType => ({
    year: 2025,
    category: "RAPPORT_BUDGETAIRE",
    structureType: StructureType.CADA,
    fileUploads: [{ key }],
  });

  const createOrphanFile = (key: string) =>
    prisma.fileUpload.create({
      data: {
        key,
        mimeType: "application/pdf",
        fileSize: 1,
        originalName: `${key}.pdf`,
      },
    });

  beforeAll(async () => {
    const operateur = await prisma.operateur.create({
      data: { name: `DOCFIN-TEST-${randomUUID()}` },
    });
    operateurId = operateur.id;

    const cpom = await prisma.cpom.create({
      data: { operateur: { connect: { id: operateur.id } } },
    });
    cpomId = cpom.id;

    await createOrphanFile(keyA);
    await createOrphanFile(keyB);
  });

  afterAll(async () => {
    await prisma.cpom.deleteMany({ where: { id: cpomId } });
    await prisma.operateur.deleteMany({ where: { id: operateurId } });
    await prisma.fileUpload.deleteMany({ where: { key: { in: [keyA, keyB] } } });
  });

  it("rattache les documents financiers au CPOM avec le type de structure ciblé", async () => {
    await prisma.$transaction((tx) =>
      createOrUpdateDocumentsFinanciers(
        tx,
        [makeDoc(keyA), makeDoc(keyB)],
        { cpomId }
      )
    );

    const docs = await prisma.documentFinancier.findMany({
      where: { cpomId },
      orderBy: { id: "asc" },
    });

    expect(docs).toHaveLength(2);
    expect(docs.every((doc) => doc.cpomId === cpomId)).toBe(true);
    expect(docs.every((doc) => doc.structureType === "CADA")).toBe(true);
    expect(docs.every((doc) => doc.structureId === null)).toBe(true);
  });

  it("réconcilie et supprime les documents du CPOM absents du nouveau payload", async () => {
    await prisma.$transaction((tx) =>
      createOrUpdateDocumentsFinanciers(tx, [makeDoc(keyA)], { cpomId })
    );

    const docs = await prisma.documentFinancier.findMany({
      where: { cpomId },
      include: { fileUploads: true },
    });

    expect(docs).toHaveLength(1);
    expect(docs[0]?.fileUploads[0]?.key).toBe(keyA);
  });
});

describe("documentFinancier.repository db integration (clé déjà rattachée)", () => {
  const createdStructureIds: number[] = [];

  const createStructure = async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `DOCFIN-TEST-${randomUUID()}`,
        departementAdministratif: "50",
      },
    });
    createdStructureIds.push(structure.id);
    return structure;
  };

  const createDocumentWithFile = async (structureId: number) => {
    const key = `docfin-${randomUUID()}`;
    const document = await prisma.documentFinancier.create({
      data: {
        structureId,
        year: 2025,
        category: "RAPPORT_BUDGETAIRE",
        name: "Document d'origine",
        fileUploads: {
          create: {
            key,
            mimeType: "application/pdf",
            fileSize: 1,
            originalName: `${key}.pdf`,
          },
        },
      },
    });
    return { document, key };
  };

  const saveDocument = (
    key: string,
    entityId: { structureId?: number; cpomId?: number },
    name = "Document envoyé"
  ) =>
    prisma.$transaction((tx) =>
      createOrUpdateDocumentsFinanciers(
        tx,
        [
          {
            year: 2025,
            category: "RAPPORT_BUDGETAIRE",
            name,
            fileUploads: [{ key }],
          },
        ],
        entityId
      )
    );

  afterAll(async () => {
    await prisma.structure.deleteMany({
      where: { id: { in: createdStructureIds } },
    });
  });

  it("refuse la clé du document d'une autre structure sans déplacer la ligne", async () => {
    const otherStructure = await createStructure();
    const structure = await createStructure();
    const { document, key } = await createDocumentWithFile(otherStructure.id);

    const error = await saveDocument(key, { structureId: structure.id }).catch(
      (caughtError: unknown) => caughtError
    );

    const documentAfter = await prisma.documentFinancier.findUniqueOrThrow({
      where: { id: document.id },
    });
    expect(documentAfter.structureId).toBe(otherStructure.id);
    expect(documentAfter.name).toBe("Document d'origine");
    expect(error).toMatchObject({ name: "DomainError", status: 409 });
  });

  it("met à jour la ligne quand la clé appartient déjà à la même structure", async () => {
    const structure = await createStructure();
    const { document, key } = await createDocumentWithFile(structure.id);

    await saveDocument(key, { structureId: structure.id }, "Nouveau nom");

    const documents = await prisma.documentFinancier.findMany({
      where: { structureId: structure.id },
    });
    expect(documents).toHaveLength(1);
    expect(documents[0]?.id).toBe(document.id);
    expect(documents[0]?.name).toBe("Nouveau nom");
  });
});
