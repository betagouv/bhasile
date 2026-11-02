import { randomUUID } from "node:crypto";

import {
  deleteTarificationTestData,
  pickTestCampaignYear,
} from "tests/test-utils/tarification.repository.helpers";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { createOrUpdateActesAdministratifs } from "@/app/api/actes-administratifs/acte-administratif.repository";
import { createOrUpdateControles } from "@/app/api/controles/controle.repository";
import { createOrUpdateDocumentsFinanciers } from "@/app/api/documents-financiers/documentFinancier.repository";
import { createOrUpdateEvaluations } from "@/app/api/evaluations/evaluation.repository";
import { updateOne as updateOperateur } from "@/app/api/operateurs/operateur.repository";
import {
  depositTarificationDocument,
  recordTarificationEvent,
  syncFicheCopies,
} from "@/app/api/tarifications/tarification.service";
import {
  AuthorLevel,
  StructureType,
  TarificationDocumentStatus,
  TarificationEventType,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import { ControleType } from "@/types/controle.type";

import {
  backfillTarificationFromFiche,
  selectBackfillRows,
} from "../../../scripts/utils/tarification-backfill";

const mockCopyObject = vi.fn();

vi.mock("@/lib/minio", () => ({
  checkBucket: vi.fn(),
  getMinioClient: () => ({
    copyObject: (...args: unknown[]) => mockCopyObject(...args),
  }),
}));

describe("copie vers la fiche db integration", () => {
  const campaignYear = pickTestCampaignYear(7000);
  let structureId: number;
  let authorId: number;

  const createFile = async (name = "piece.pdf") =>
    prisma.fileUpload.create({
      data: {
        key: `fiche-${randomUUID()}-${name}`,
        mimeType: "application/pdf",
        originalName: name,
        fileSize: 10,
        sha256: "empreinte",
      },
    });

  const depositAsOperateur = async (types: ("CA" | "RAPPORT_ACTIVITE")[]) => {
    const file = await createFile();
    return depositTarificationDocument({
      structureId,
      year: campaignYear,
      author: { id: authorId, level: AuthorLevel.OPERATEUR },
      fileKey: file.key,
      types,
      status: TarificationDocumentStatus.SHARED,
    });
  };

  const withdraw = (documentId: number) =>
    recordTarificationEvent({
      structureId,
      year: campaignYear,
      author: { id: authorId, level: AuthorLevel.DEPARTEMENT },
      type: TarificationEventType.DOCUMENT_WITHDRAWN,
      documentId,
      stepCode: null,
      text: "Erreur de structure",
    });

  const findCopies = () =>
    prisma.documentFinancier.findMany({
      where: { structureId, sourceTarificationDocumentId: { not: null } },
      include: { fileUploads: true },
      orderBy: { id: "asc" },
    });

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-FICHE-TEST-${randomUUID()}`,
        departementAdministratif: "50",
        type: StructureType.CADA,
      },
    });
    structureId = structure.id;
    const author = await prisma.user.create({
      data: { email: `fiche-${randomUUID()}@test.fr` },
    });
    authorId = author.id;
  });

  beforeEach(async () => {
    vi.stubEnv(
      "NEXT_PUBLIC_EMULATED_NOW",
      `${campaignYear}-06-01T12:00:00.000Z`
    );
    vi.stubEnv("S3_BUCKET_NAME", "bucket-test");
    mockCopyObject.mockReset();
    mockCopyObject.mockResolvedValue({});
    await deleteTarificationTestData({ structureId, campaignYear });
    await prisma.documentFinancier.deleteMany({ where: { structureId } });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await deleteTarificationTestData({ structureId, campaignYear });
    await prisma.documentFinancier.deleteMany({ where: { structureId } });
    await prisma.structure.delete({ where: { id: structureId } });
    await prisma.user.delete({ where: { id: authorId } });
    await prisma.$disconnect();
  });

  it("copie un dépôt sur la fiche, dans un nouvel objet S3", async () => {
    const document = await depositAsOperateur(["CA"]);

    const [copy] = await findCopies();
    const tarificationDocument =
      await prisma.tarificationDocument.findUniqueOrThrow({
        where: { id: document.id },
        include: { fileUpload: true },
      });

    expect(copy).toMatchObject({
      category: "COMPTE_ADMINISTRATIF_SOUMIS",
      year: campaignYear - 2,
      structureType: StructureType.CADA,
      sourceTarificationDocumentId: document.id,
    });
    expect(copy.fileUploads[0].key).not.toBe(
      tarificationDocument.fileUpload.key
    );
    expect(copy.fileUploads[0]).toMatchObject({
      originalName: "piece.pdf",
      sha256: "empreinte",
    });
    expect(mockCopyObject).toHaveBeenCalledWith(
      "bucket-test",
      copy.fileUploads[0].key,
      `/bucket-test/${tarificationDocument.fileUpload.key}`
    );
  });

  it("ne refait rien quand on la rejoue", async () => {
    await depositAsOperateur(["CA"]);
    mockCopyObject.mockClear();

    await syncFicheCopies(structureId, campaignYear);

    expect(await findCopies()).toHaveLength(1);
    expect(mockCopyObject).not.toHaveBeenCalled();
  });

  it("remplace la copie par celle du dernier document, et y revient après un retrait", async () => {
    const firstDocument = await depositAsOperateur(["CA"]);
    const lastDocument = await depositAsOperateur(["CA"]);

    expect(await findCopies()).toMatchObject([
      { sourceTarificationDocumentId: lastDocument.id },
    ]);

    await withdraw(lastDocument.id);

    expect(await findCopies()).toMatchObject([
      { sourceTarificationDocumentId: firstDocument.id },
    ]);
  });

  it("garde le dépôt quand la copie échoue, et rattrape la fiche au fait suivant", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    mockCopyObject.mockRejectedValueOnce(new Error("S3 indisponible"));

    const document = await depositAsOperateur(["CA"]);

    expect(document.id).toEqual(expect.any(Number));
    expect(await findCopies()).toEqual([]);

    await syncFicheCopies(structureId, campaignYear);

    expect(await findCopies()).toHaveLength(1);
  });

  it("retire de la fiche un document retiré, même si S3 est en panne, et rattrape ensuite la copie précédente", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const firstDocument = await depositAsOperateur(["CA"]);
    const lastDocument = await depositAsOperateur(["CA"]);
    mockCopyObject.mockRejectedValueOnce(new Error("S3 indisponible"));

    await withdraw(lastDocument.id);

    expect(await findCopies()).toEqual([]);

    await syncFicheCopies(structureId, campaignYear);

    expect(await findCopies()).toMatchObject([
      { sourceTarificationDocumentId: firstDocument.id },
    ]);
  });

  it("copie un arrêté partagé en acte sur l'année de la campagne", async () => {
    const file = await createFile();
    const agent = { id: authorId, level: AuthorLevel.DEPARTEMENT };
    const document = await depositTarificationDocument({
      structureId,
      year: campaignYear,
      author: agent,
      fileKey: file.key,
      types: ["ARRETE"],
      status: TarificationDocumentStatus.FINAL,
    });

    await recordTarificationEvent({
      structureId,
      year: campaignYear,
      author: { ...agent, id: authorId },
      type: TarificationEventType.DOCUMENT_SHARED,
      documentId: document.id,
      stepCode: null,
      text: null,
    });

    expect(
      await prisma.acteAdministratif.findMany({ where: { structureId } })
    ).toMatchObject([
      {
        category: "ARRETE_TARIFICATION",
        startDate: new Date(Date.UTC(campaignYear, 0, 1)),
        endDate: new Date(Date.UTC(campaignYear, 11, 31)),
        sourceTarificationDocumentId: document.id,
      },
    ]);
  });

  describe("verrouillage sur la fiche", () => {
    it("garde une copie absente du formulaire, et ne la modifie pas", async () => {
      await depositAsOperateur(["CA"]);
      const [copy] = await findCopies();
      const manualFile = await createFile();

      await prisma.$transaction((tx) =>
        createOrUpdateDocumentsFinanciers(
          tx,
          [
            {
              year: 2020,
              category: "RAPPORT_BUDGETAIRE",
              fileUploads: [{ key: manualFile.key }],
            },
          ],
          { structureId }
        )
      );
      expect(await findCopies()).toMatchObject([{ id: copy.id }]);

      await prisma.$transaction((tx) =>
        createOrUpdateDocumentsFinanciers(
          tx,
          [
            {
              year: 2020,
              category: "RAPPORT_BUDGETAIRE",
              fileUploads: [{ key: copy.fileUploads[0].key }],
            },
          ],
          { structureId }
        )
      );
      expect(await findCopies()).toMatchObject([
        {
          id: copy.id,
          year: copy.year,
          category: "COMPTE_ADMINISTRATIF_SOUMIS",
        },
      ]);
    });

    it("garde un acte copié absent du formulaire, et ne le modifie pas", async () => {
      const file = await createFile();
      const agent = { id: authorId, level: AuthorLevel.DEPARTEMENT };
      const document = await depositTarificationDocument({
        structureId,
        year: campaignYear,
        author: agent,
        fileKey: file.key,
        types: ["ARRETE"],
        status: TarificationDocumentStatus.FINAL,
      });
      await recordTarificationEvent({
        structureId,
        year: campaignYear,
        author: agent,
        type: TarificationEventType.DOCUMENT_SHARED,
        documentId: document.id,
        stepCode: null,
        text: null,
      });
      const copy = await prisma.acteAdministratif.findFirstOrThrow({
        where: { structureId, sourceTarificationDocumentId: document.id },
      });

      await prisma.$transaction((tx) =>
        createOrUpdateActesAdministratifs(
          tx,
          [{ id: copy.id, category: "AUTRE", fileUploads: [] }],
          { structureId }
        )
      );
      await prisma.$transaction((tx) =>
        createOrUpdateActesAdministratifs(
          tx,
          [{ category: "AUTRE", fileUploads: [] }],
          { structureId }
        )
      );

      expect(
        await prisma.acteAdministratif.findUniqueOrThrow({
          where: { id: copy.id },
        })
      ).toMatchObject({ category: "ARRETE_TARIFICATION" });
      await prisma.acteAdministratif.deleteMany({
        where: { structureId, sourceTarificationDocumentId: null },
      });
    });

    it("ne modifie pas un acte copié repéré par la clé de son fichier", async () => {
      const file = await createFile();
      const agent = { id: authorId, level: AuthorLevel.DEPARTEMENT };
      const document = await depositTarificationDocument({
        structureId,
        year: campaignYear,
        author: agent,
        fileKey: file.key,
        types: ["ARRETE"],
        status: TarificationDocumentStatus.FINAL,
      });
      await recordTarificationEvent({
        structureId,
        year: campaignYear,
        author: agent,
        type: TarificationEventType.DOCUMENT_SHARED,
        documentId: document.id,
        stepCode: null,
        text: null,
      });
      const copy = await prisma.acteAdministratif.findFirstOrThrow({
        where: { structureId, sourceTarificationDocumentId: document.id },
        include: { fileUploads: true },
      });

      await prisma.$transaction((tx) =>
        createOrUpdateActesAdministratifs(
          tx,
          [
            {
              category: "AUTRE",
              fileUploads: [{ key: copy.fileUploads[0].key }],
            },
          ],
          { structureId }
        )
      );

      expect(
        await prisma.acteAdministratif.findUniqueOrThrow({
          where: { id: copy.id },
        })
      ).toMatchObject({ category: "ARRETE_TARIFICATION" });
    });

    describe("fichiers qui font preuve", () => {
      const findProofKeys = async () => {
        const document = await depositAsOperateur(["CA"]);
        const { fileUpload } =
          await prisma.tarificationDocument.findUniqueOrThrow({
            where: { id: document.id },
            include: { fileUpload: true },
          });
        const [copy] = await findCopies();
        return [fileUpload.key, copy.fileUploads[0].key];
      };

      it("refuse de les rattacher à une évaluation", async () => {
        for (const key of await findProofKeys()) {
          await expect(
            prisma.$transaction((tx) =>
              createOrUpdateEvaluations(
                tx,
                [{ date: "2020-01-01", fileUploads: [{ key }] }],
                structureId
              )
            )
          ).rejects.toThrow("ne peut pas être rattaché");
        }
      });

      it("refuse de les rattacher à un contrôle", async () => {
        for (const key of await findProofKeys()) {
          await expect(
            prisma.$transaction((tx) =>
              createOrUpdateControles(
                tx,
                [
                  {
                    date: "2020-01-01",
                    type: ControleType.INOPINE,
                    fileUploads: [{ id: 0, key }],
                  },
                ],
                structureId
              )
            )
          ).rejects.toThrow("ne peut pas être rattaché");
        }
      });

      it("refuse de les prendre pour logo d'un opérateur", async () => {
        const operateur = await prisma.operateur.create({
          data: { name: `FICHE-TEST-${randomUUID()}` },
        });
        const [key] = await findProofKeys();

        await expect(
          updateOperateur({
            id: operateur.id,
            name: operateur.name,
            logo: { key },
          } as Parameters<typeof updateOperateur>[0])
        ).rejects.toThrow("ne peut pas être rattaché");

        await prisma.operateur.delete({ where: { id: operateur.id } });
      });
    });

    it("refuse de rattacher à la fiche le fichier d'un document de tarification", async () => {
      const document = await depositAsOperateur(["CA"]);
      const { fileUpload } =
        await prisma.tarificationDocument.findUniqueOrThrow({
          where: { id: document.id },
          include: { fileUpload: true },
        });

      await expect(
        prisma.$transaction((tx) =>
          createOrUpdateDocumentsFinanciers(
            tx,
            [
              {
                year: 2020,
                category: "RAPPORT_BUDGETAIRE",
                fileUploads: [{ key: fileUpload.key }],
              },
            ],
            { structureId }
          )
        )
      ).rejects.toThrow("ne peut pas être rattaché");
    });
  });

  describe("script de reprise", () => {
    const createFicheRow = async (createdAt: Date, name: string) => {
      const file = await createFile(name);
      return prisma.documentFinancier.create({
        data: {
          structureId,
          category: "COMPTE_ADMINISTRATIF_SOUMIS",
          year: campaignYear - 2,
          createdAt,
          fileUploads: { connect: { id: file.id } },
        },
      });
    };

    it("relie la ligne la plus récente de la fiche, comme un dépôt système déjà notifié", async () => {
      await createFicheRow(new Date("2020-01-01T10:00:00Z"), "ancien.pdf");
      const latestRow = await createFicheRow(
        new Date("2021-01-01T10:00:00Z"),
        "recent.pdf"
      );

      const { linkedCount } = await backfillTarificationFromFiche(
        prisma,
        campaignYear
      );

      expect(linkedCount).toBe(1);
      const [copy] = await findCopies();
      expect(copy.id).toBe(latestRow.id);
      const document = await prisma.tarificationDocument.findUniqueOrThrow({
        where: { id: copy.sourceTarificationDocumentId! },
        include: {
          fileUpload: true,
          events: { include: { notification: true } },
        },
      });
      expect(document).toMatchObject({
        types: ["CA"],
        status: TarificationDocumentStatus.SHARED,
        fileUpload: { originalName: "recent.pdf" },
        events: [
          {
            type: TarificationEventType.DOCUMENT_DEPOSITED,
            authorId: null,
            authorLevel: null,
            createdAt: latestRow.createdAt,
            notification: { eventId: expect.any(Number) },
          },
        ],
      });
      expect(document.fileUpload.key).not.toBe(copy.fileUploads[0].key);
    });

    it("ne reprend qu'une fois une ligne quand deux reprises tournent en même temps", async () => {
      await createFicheRow(new Date("2021-01-01T10:00:00Z"), "piece.pdf");

      await Promise.all([
        backfillTarificationFromFiche(prisma, campaignYear),
        backfillTarificationFromFiche(prisma, campaignYear),
      ]);

      expect(
        await prisma.tarificationDocument.count({
          where: { structureTarification: { structureId } },
        })
      ).toBe(1);
    });

    it("continue après une ligne en échec, la signale, et la retente au tour suivant", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      const otherStructure = await prisma.structure.create({
        data: {
          codeBhasile: `BHA-FICHE-TEST-${randomUUID()}`,
          departementAdministratif: "50",
          type: StructureType.CPH,
        },
      });
      const otherFile = await createFile();
      await prisma.documentFinancier.create({
        data: {
          structureId: otherStructure.id,
          category: "COMPTE_ADMINISTRATIF_SOUMIS",
          year: campaignYear - 2,
          fileUploads: { connect: { id: otherFile.id } },
        },
      });
      await createFicheRow(new Date("2021-01-01T10:00:00Z"), "piece.pdf");
      mockCopyObject.mockRejectedValueOnce(new Error("Objet introuvable"));

      const firstRun = await backfillTarificationFromFiche(
        prisma,
        campaignYear
      );

      expect(firstRun.linkedCount).toBe(1);
      expect(firstRun.failedRowIds).toHaveLength(1);

      const secondRun = await backfillTarificationFromFiche(
        prisma,
        campaignYear
      );

      expect(secondRun).toEqual({ linkedCount: 1, failedRowIds: [] });

      await deleteTarificationTestData({
        structureId: otherStructure.id,
        campaignYear,
      });
      await prisma.documentFinancier.deleteMany({
        where: { structureId: otherStructure.id },
      });
      await prisma.structure.delete({ where: { id: otherStructure.id } });
    });

    it("ne recrée rien quand on le rejoue, et une synchronisation ne touche pas la ligne reliée", async () => {
      const row = await createFicheRow(
        new Date("2021-01-01T10:00:00Z"),
        "piece.pdf"
      );
      await backfillTarificationFromFiche(prisma, campaignYear);
      const documentCount = () =>
        prisma.tarificationDocument.count({
          where: { structureTarification: { structureId } },
        });
      const countAfterFirstRun = await documentCount();

      await backfillTarificationFromFiche(prisma, campaignYear);
      await syncFicheCopies(structureId, campaignYear);

      expect(await documentCount()).toBe(countAfterFirstRun);
      expect(await findCopies()).toMatchObject([{ id: row.id }]);
    });
  });
});

describe("selectBackfillRows", () => {
  const buildRow = (
    id: number,
    structureId: number | null,
    createdAt: string,
    sourceTarificationDocumentId: number | null = null
  ) => ({
    id,
    structureId,
    createdAt: new Date(createdAt),
    sourceTarificationDocumentId,
  });

  it("garde la ligne la plus récente de chaque structure", () => {
    const selected = selectBackfillRows([
      buildRow(1, 10, "2025-01-01"),
      buildRow(2, 10, "2025-03-01"),
      buildRow(3, 10, "2025-02-01"),
      buildRow(4, 20, "2025-01-01"),
    ]);

    expect(selected.map((row) => row.id)).toEqual([2, 4]);
  });

  it("ignore une structure déjà reliée, et une ligne sans structure", () => {
    const selected = selectBackfillRows([
      buildRow(1, 10, "2025-01-01"),
      buildRow(2, 10, "2025-03-01", 99),
      buildRow(3, null, "2025-01-01"),
    ]);

    expect(selected).toEqual([]);
  });
});
