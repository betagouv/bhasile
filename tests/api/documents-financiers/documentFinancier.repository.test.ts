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
