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

import {
  depositTarificationDocument,
  recordTarificationEvent,
} from "@/app/api/tarifications/tarification.service";
import {
  AuthorLevel,
  StructureType,
  TarificationDocumentStatus,
  TarificationEventType,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

vi.mock("@/lib/minio", () => ({
  checkBucket: vi.fn(),
  getMinioClient: () => ({ copyObject: vi.fn().mockResolvedValue({}) }),
}));

describe("réponse à la L48 db integration", () => {
  const campaignYear = pickTestCampaignYear(6000);
  let structureId: number;
  let agentId: number;
  let operateurId: number;

  const createFile = () =>
    prisma.fileUpload.create({
      data: {
        key: `reponse-${randomUUID()}.pdf`,
        mimeType: "application/pdf",
        originalName: "reponse.pdf",
        fileSize: 10,
        sha256: "empreinte",
      },
    });

  const respond = (
    fileKey: string,
    overrides: { stepCode?: "RCA" | null } = {}
  ) =>
    recordTarificationEvent({
      structureId,
      year: campaignYear,
      author: { id: operateurId, level: AuthorLevel.OPERATEUR },
      type: TarificationEventType.L48_CONTESTED,
      documentId: null,
      fileKey,
      stepCode: overrides.stepCode ?? null,
      text: "Montant erroné",
    });

  const findResponseDocuments = () =>
    prisma.tarificationDocument.findMany({
      where: {
        structureTarification: { structureId },
        types: { has: "REPONSE_CONTRADICTOIRE" },
      },
    });

  beforeAll(async () => {
    const structure = await prisma.structure.create({
      data: {
        codeBhasile: `BHA-L48-TEST-${randomUUID()}`,
        departementAdministratif: "50",
        type: StructureType.CADA,
      },
    });
    structureId = structure.id;
    const agent = await prisma.user.create({
      data: { email: `agent-${randomUUID()}@test.fr` },
    });
    agentId = agent.id;
    const operateur = await prisma.user.create({
      data: { email: `operateur-${randomUUID()}@test.fr` },
    });
    operateurId = operateur.id;
  });

  beforeEach(async () => {
    const emulatedNow = `${campaignYear}-06-01T12:00:00.000Z`;
    vi.stubEnv("NEXT_PUBLIC_EMULATED_NOW", emulatedNow);
    vi.stubEnv("S3_BUCKET_NAME", "bucket-test");
    await deleteTarificationTestData({ structureId, campaignYear });
    await prisma.documentFinancier.deleteMany({ where: { structureId } });

    const budgetFile = await createFile();
    await depositTarificationDocument({
      structureId,
      year: campaignYear,
      author: { id: operateurId, level: AuthorLevel.OPERATEUR },
      fileKey: budgetFile.key,
      types: ["BP"],
      status: TarificationDocumentStatus.FINAL,
    });
    const l48File = await createFile();
    const l48 = await depositTarificationDocument({
      structureId,
      year: campaignYear,
      author: { id: agentId, level: AuthorLevel.DEPARTEMENT },
      fileKey: l48File.key,
      types: ["L48"],
      status: TarificationDocumentStatus.FINAL,
    });
    await recordTarificationEvent({
      structureId,
      year: campaignYear,
      author: { id: agentId, level: AuthorLevel.DEPARTEMENT },
      type: TarificationEventType.DOCUMENT_SHARED,
      documentId: l48.id,
      stepCode: null,
      text: null,
    });
    await prisma.tarificationEvent.updateMany({
      where: { structureTarification: { structureId } },
      data: { createdAt: new Date(emulatedNow) },
    });
    await prisma.tarificationDocumentOpening.create({
      data: {
        documentId: l48.id,
        userId: operateurId,
        createdAt: new Date(emulatedNow),
      },
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  afterAll(async () => {
    await deleteTarificationTestData({ structureId, campaignYear });
    await prisma.documentFinancier.deleteMany({ where: { structureId } });
    await prisma.structure.delete({ where: { id: structureId } });
    await prisma.user.deleteMany({
      where: { id: { in: [agentId, operateurId] } },
    });
    await prisma.$disconnect();
  });

  it("écrit la réponse et sa pièce ensemble, l'une citant l'autre", async () => {
    const file = await createFile();

    const { id } = await respond(file.key);

    const [document] = await findResponseDocuments();
    expect(document).toMatchObject({
      fileUploadId: file.id,
      status: TarificationDocumentStatus.FINAL,
    });
    const event = await prisma.tarificationEvent.findUniqueOrThrow({
      where: { id },
    });
    expect(event).toMatchObject({
      type: TarificationEventType.L48_CONTESTED,
      documentId: document.id,
      authorId: operateurId,
    });
  });

  it("n'écrit pas la pièce quand la réponse est refusée, et laisse le fichier libre", async () => {
    const file = await createFile();

    await expect(respond(file.key, { stepCode: "RCA" })).rejects.toThrow(
      "n'est pas valide"
    );

    expect(await findResponseDocuments()).toEqual([]);
    const retry = await respond(file.key);
    expect(retry.id).toEqual(expect.any(Number));
    expect(await findResponseDocuments()).toHaveLength(1);
  });
});
