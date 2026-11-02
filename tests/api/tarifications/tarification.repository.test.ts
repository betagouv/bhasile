import { randomUUID } from "node:crypto";

import {
  deleteTarificationTestData,
  pickTestCampaignYear,
} from "tests/test-utils/tarification.repository.helpers";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createTarificationDocumentOpening,
  findMessageTarification,
  findStructureTarification,
  findStructureTarificationCampaigns,
  findStructureTarificationJournal,
  runInTarificationTransaction,
  upsertStructureTarification,
} from "@/app/api/tarifications/tarification.repository";
import {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationEventType,
  Visibility,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

describe("tarification.repository db integration", () => {
  const campaignYear = pickTestCampaignYear(9000);
  let structureId: number;
  let authorId: number;

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-TARIF-TEST-${randomUUID()}`,
        departementAdministratif: "50",
      },
    });
    structureId = structure.id;
    const author = await prisma.user.create({
      data: { email: `tarification-${randomUUID()}@test.fr` },
    });
    authorId = author.id;
  });

  afterAll(async () => {
    await deleteTarificationTestData({ structureId, campaignYear });
    await prisma.structure.delete({ where: { id: structureId } });
    await prisma.user.delete({ where: { id: authorId } });
    await prisma.$disconnect();
  });

  it("crée la campagne et la tarification une seule fois", async () => {
    const first = await upsertStructureTarification(structureId, campaignYear);
    const second = await upsertStructureTarification(structureId, campaignYear);

    expect(second.id).toBe(first.id);
    expect(
      await prisma.tarificationCampaign.count({ where: { year: campaignYear } })
    ).toBe(1);
  });

  it("retrouve la tarification par structure et année", async () => {
    const created = await upsertStructureTarification(
      structureId,
      campaignYear
    );

    const found = await findStructureTarification(structureId, campaignYear);

    expect(found?.id).toBe(created.id);
  });

  it("liste les campagnes où la structure a une tarification", async () => {
    await upsertStructureTarification(structureId, campaignYear);

    expect(await findStructureTarificationCampaigns(structureId)).toEqual([
      { campaign: { year: campaignYear } },
    ]);
  });

  it("lit le journal d'une tarification et garde la première ouverture d'un document", async () => {
    const tarification = await upsertStructureTarification(
      structureId,
      campaignYear
    );
    const fileUpload = await prisma.fileUpload.create({
      data: {
        key: `journal-${randomUUID()}.pdf`,
        mimeType: "application/pdf",
        originalName: "l48.pdf",
        fileSize: 10,
        sha256: "empreinte",
      },
    });
    const document = await prisma.tarificationDocument.create({
      data: {
        structureTarificationId: tarification.id,
        fileUploadId: fileUpload.id,
        types: ["L48"],
        status: TarificationDocumentStatus.FINAL,
      },
    });
    await prisma.tarificationEvent.create({
      data: {
        structureTarificationId: tarification.id,
        type: TarificationEventType.DOCUMENT_SHARED,
        authorId,
        authorLevel: AuthorLevel.DEPARTEMENT,
        documentId: document.id,
      },
    });
    await createTarificationDocumentOpening(document.id, authorId);
    const firstOpening =
      await prisma.tarificationDocumentOpening.findFirstOrThrow({
        where: { documentId: document.id },
      });
    await createTarificationDocumentOpening(document.id, authorId);

    const structure = await findStructureTarificationJournal(
      structureId,
      campaignYear
    );

    expect(structure?.structureTarifications).toMatchObject([
      {
        documents: [
          {
            id: document.id,
            types: ["L48"],
            fileUpload: { sha256: "empreinte" },
            openings: [{ userId: authorId, createdAt: firstOpening.createdAt }],
          },
        ],
        events: [
          {
            type: TarificationEventType.DOCUMENT_SHARED,
            documentId: document.id,
          },
        ],
      },
    ]);
    expect(
      (await findStructureTarificationJournal(structureId, campaignYear + 1))
        ?.structureTarifications
    ).toEqual([]);
  });

  describe("écritures", () => {
    const writeCampaignYear = pickTestCampaignYear(8000);
    let writeStructureId: number;

    beforeAll(async () => {
      const structure = await prisma.structure.create({
        data: {
          codeBhasile: `BHA-TARIF-WRITE-TEST-${randomUUID()}`,
          departementAdministratif: "50",
        },
      });
      writeStructureId = structure.id;
    });

    afterAll(async () => {
      await deleteTarificationTestData({
        structureId: writeStructureId,
        campaignYear: writeCampaignYear,
      });
      await prisma.structure.delete({ where: { id: writeStructureId } });
    });

    const createFile = () =>
      prisma.fileUpload.create({
        data: {
          key: `depot-${randomUUID()}.pdf`,
          mimeType: "application/pdf",
          originalName: "depot.pdf",
          fileSize: 10,
        },
      });

    const deposit = (fileKey: string) =>
      runInTarificationTransaction(
        writeStructureId,
        writeCampaignYear,
        (transaction) =>
          transaction.createDocument({
            fileKey,
            types: ["CA"],
            status: TarificationDocumentStatus.SHARED,
            author: { id: authorId, level: AuthorLevel.OPERATEUR },
          })
      );

    it("crée le document et son événement de dépôt ensemble", async () => {
      const file = await createFile();

      const document = await deposit(file.key);

      expect(
        await prisma.tarificationEvent.findMany({
          where: { documentId: document.id },
        })
      ).toMatchObject([
        {
          type: TarificationEventType.DOCUMENT_DEPOSITED,
          authorId,
          authorLevel: AuthorLevel.OPERATEUR,
        },
      ]);
    });

    it("refuse un fichier inconnu ou déjà rattaché à un document", async () => {
      const file = await createFile();
      await deposit(file.key);

      await expect(deposit(file.key)).rejects.toThrow("déjà rattaché");
      await expect(deposit("inconnu.pdf")).rejects.toThrow("introuvable");
    });

    it("ne crée pas de tarification quand la transaction échoue", async () => {
      await expect(
        runInTarificationTransaction(
          writeStructureId,
          writeCampaignYear + 1,
          () => {
            throw new Error("Garde refusée");
          }
        )
      ).rejects.toThrow("Garde refusée");

      expect(
        await findStructureTarification(writeStructureId, writeCampaignYear + 1)
      ).toBeNull();
      await prisma.tarificationCampaign.deleteMany({
        where: { year: writeCampaignYear + 1 },
      });
    });

    it("exécute l'un après l'autre deux faits simultanés sur une tarification", async () => {
      const recordOutOfBhasileOnce = () =>
        runInTarificationTransaction(
          writeStructureId,
          writeCampaignYear,
          async (transaction) => {
            const structure = await transaction.findJournal();
            const isAlreadyDeclared = structure?.structureTarifications
              .flatMap((tarification) => tarification.events)
              .some(
                (event) =>
                  event.type === TarificationEventType.OUT_OF_BHASILE_DECLARED
              );
            if (isAlreadyDeclared) {
              return;
            }
            await new Promise((resolve) => setTimeout(resolve, 100));
            await transaction.createEvent({
              type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
              authorId,
              authorLevel: AuthorLevel.DEPARTEMENT,
              documentId: null,
              stepCode: null,
              text: "Courrier",
            });
          }
        );

      await runInTarificationTransaction(
        writeStructureId,
        writeCampaignYear,
        async () => {}
      );

      await Promise.all([
        recordOutOfBhasileOnce(),
        recordOutOfBhasileOnce(),
        recordOutOfBhasileOnce(),
      ]);

      expect(
        await prisma.tarificationEvent.count({
          where: {
            structureTarification: { structureId: writeStructureId },
            type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
          },
        })
      ).toBe(1);
    });
  });

  it("ne trouve rien pour une campagne sans échange", async () => {
    expect(
      await findStructureTarification(structureId, campaignYear + 1)
    ).toBeNull();
  });

  it("remonte d'un message à sa structure et à l'année de sa campagne", async () => {
    const tarification = await upsertStructureTarification(
      structureId,
      campaignYear
    );
    const message = await prisma.message.create({
      data: {
        conversation: {
          connectOrCreate: {
            where: {
              structureTarificationId_visibility: {
                structureTarificationId: tarification.id,
                visibility: Visibility.SHARED,
              },
            },
            create: {
              structureTarificationId: tarification.id,
              visibility: Visibility.SHARED,
            },
          },
        },
        author: { connect: { id: authorId } },
        authorLevel: AuthorLevel.DEPARTEMENT,
        text: "message",
      },
    });

    const found = await findMessageTarification(message.id);

    expect(found?.conversation.structureTarification).toEqual({
      structure: {
        id: structureId,
        departementAdministratif: "50",
        operateurId: null,
        type: null,
      },
      campaign: { year: campaignYear },
    });
  });
});
