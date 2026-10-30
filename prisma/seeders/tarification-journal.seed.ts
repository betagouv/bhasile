import { fakerFR as faker } from "@faker-js/faker";

import {
  AuthorLevel,
  PrismaClient,
  TarificationDocumentStatus,
  TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/client";
import { isEventShapeValid } from "@/lib/tarification/tarification.event";

import { createFakeFileUpload } from "./file-upload.seed";

export const createFakeTarificationJournals = async (
  prisma: PrismaClient,
  campaignYear: number
): Promise<void> => {
  const campaign = await prisma.tarificationCampaign.update({
    where: { year: campaignYear },
    data: { drlPublishedAt: new Date(`${campaignYear}-03-01`) },
    select: { id: true },
  });
  const departementalAgent = await prisma.user.findFirstOrThrow({
    where: { email: { startsWith: "departemental@" } },
    select: { id: true },
  });
  const tarifications = await prisma.structureTarification.findMany({
    where: {
      campaignId: campaign.id,
      structure: { operateurId: { not: null } },
    },
    select: { id: true, structure: { select: { operateurId: true } } },
    orderBy: { id: "asc" },
    take: SCENARIOS.length,
  });

  for (const [index, tarification] of tarifications.entries()) {
    const operateurId = tarification.structure.operateurId!;
    const operateurUser = await prisma.user.upsert({
      where: { email: `operateur-${operateurId}@bhasile.test` },
      update: {},
      create: {
        name: faker.person.fullName(),
        email: `operateur-${operateurId}@bhasile.test`,
        operateurId,
      },
      select: { id: true },
    });
    await SCENARIOS[index].write(
      createJournalWriter(prisma, tarification.id, campaignYear),
      {
        agent: { id: departementalAgent.id, level: AuthorLevel.DEPARTEMENT },
        operateur: { id: operateurUser.id, level: AuthorLevel.OPERATEUR },
      }
    );
  }

  // Réputés notifiés : la reprise des notifications ne doit pas les envoyer
  const seededEvents = await prisma.tarificationEvent.findMany({
    select: { id: true },
  });
  await prisma.tarificationEventNotification.createMany({
    data: seededEvents.map((event) => ({ eventId: event.id })),
  });

  console.log(
    `✅ Journaux de tarification ${campaignYear} : ${tarifications
      .map(
        (tarification, index) => `${tarification.id} ${SCENARIOS[index].label}`
      )
      .join(", ")}`
  );
};

const createJournalWriter = (
  prisma: PrismaClient,
  structureTarificationId: number,
  campaignYear: number
) => {
  const toInstant = (yearOffset: number, monthDay: string): Date =>
    new Date(`${campaignYear + yearOffset}-${monthDay}T10:00:00Z`);

  const addEvent = async ({
    type,
    author,
    documentId = null,
    stepCode = null,
    text = null,
    at,
  }: SeededEvent): Promise<void> => {
    const event = {
      type,
      authorId: author.id,
      authorLevel: author.level,
      documentId,
      stepCode,
      text,
    };
    if (!isEventShapeValid(event)) {
      throw new Error(`Événement de tarification mal formé : ${type}`);
    }
    await prisma.tarificationEvent.create({
      data: {
        ...event,
        structureTarificationId,
        createdAt: toInstant(...at),
      },
    });
  };

  const deposit = async ({
    types,
    status,
    author,
    at,
  }: {
    types: TarificationDocumentType[];
    status: TarificationDocumentStatus;
    author: SeededAuthor;
    at: SeededDate;
  }): Promise<number> => {
    const fileUpload = await prisma.fileUpload.create({
      data: { ...createFakeFileUpload(), createdAt: toInstant(...at) },
    });
    const document = await prisma.tarificationDocument.create({
      data: {
        structureTarificationId,
        fileUploadId: fileUpload.id,
        types,
        status,
      },
    });
    await addEvent({
      type: TarificationEventType.DOCUMENT_DEPOSITED,
      author,
      documentId: document.id,
      at,
    });
    return document.id;
  };

  return {
    addEvent,
    deposit,
    share: async (
      types: TarificationDocumentType[],
      agent: SeededAuthor,
      at: SeededDate
    ): Promise<number> => {
      const documentId = await deposit({
        types,
        status: TarificationDocumentStatus.FINAL,
        author: agent,
        at,
      });
      await addEvent({
        type: TarificationEventType.DOCUMENT_SHARED,
        author: agent,
        documentId,
        at,
      });
      return documentId;
    },
    open: async (
      documentId: number,
      user: SeededAuthor,
      at: SeededDate
    ): Promise<void> => {
      await prisma.tarificationDocumentOpening.create({
        data: { documentId, userId: user.id, createdAt: toInstant(...at) },
      });
    },
  };
};

const depositOnTime = async (
  writer: JournalWriter,
  operateur: SeededAuthor
): Promise<void> => {
  await writer.deposit({
    types: ["CA", "RAPPORT_ACTIVITE"],
    status: TarificationDocumentStatus.SHARED,
    author: operateur,
    at: [-1, "04-15"],
  });
  await writer.deposit({
    types: ["BP", "RAPPORT_BUDGETAIRE"],
    status: TarificationDocumentStatus.SHARED,
    author: operateur,
    at: [-1, "10-20"],
  });
};

const SCENARIOS: Scenario[] = [
  { label: "rien déposé", write: async () => {} },
  {
    label: "contradictoire contesté",
    write: async (writer, { agent, operateur }) => {
      await depositOnTime(writer, operateur);
      await writer.share(["RCA"], agent, [0, "04-10"]);
      const l48DocumentId = await writer.share(["L48"], agent, [0, "04-12"]);
      await writer.open(l48DocumentId, operateur, [0, "04-14"]);
      const responseDocumentId = await writer.deposit({
        types: ["REPONSE_CONTRADICTOIRE"],
        status: TarificationDocumentStatus.SHARED,
        author: operateur,
        at: [0, "04-18"],
      });
      await writer.addEvent({
        type: TarificationEventType.L48_CONTESTED,
        author: operateur,
        documentId: responseDocumentId,
        text: faker.lorem.paragraph(),
        at: [0, "04-18"],
      });
    },
  },
  {
    label: "campagne bouclée",
    write: async (writer, { agent, operateur }) => {
      await depositOnTime(writer, operateur);
      await writer.share(["RCA"], agent, [0, "04-10"]);
      const l48DocumentId = await writer.share(["L48"], agent, [0, "04-12"]);
      await writer.open(l48DocumentId, operateur, [0, "04-13"]);
      await writer.addEvent({
        type: TarificationEventType.L48_ACCEPTED,
        author: operateur,
        at: [0, "04-15"],
      });
      await writer.share(["DAB"], agent, [0, "04-25"]);
      await writer.share(["ARRETE"], agent, [0, "06-15"]);
    },
  },
  {
    label: "CA en retard, versions de travail et retrait",
    write: async (writer, { agent, operateur }) => {
      await writer.deposit({
        types: ["CA"],
        status: TarificationDocumentStatus.SHARED,
        author: operateur,
        at: [-1, "05-20"],
      });
      const draftDocumentId = await writer.deposit({
        types: ["RCA"],
        status: TarificationDocumentStatus.DRAFT,
        author: agent,
        at: [0, "03-20"],
      });
      await writer.addEvent({
        type: TarificationEventType.CHANGES_REQUESTED,
        author: agent,
        documentId: draftDocumentId,
        text: faker.lorem.sentence(),
        at: [0, "03-22"],
      });
      const withdrawnDocumentId = await writer.share(["RCA"], agent, [
        0,
        "04-05",
      ]);
      await writer.addEvent({
        type: TarificationEventType.DOCUMENT_WITHDRAWN,
        author: agent,
        documentId: withdrawnDocumentId,
        text: "Erreur de structure",
        at: [0, "04-06"],
      });
    },
  },
  {
    label: "hors Bhasile",
    write: async (writer, { agent }) => {
      await writer.addEvent({
        type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
        author: agent,
        text: "Tarification menée par courrier",
        at: [0, "03-15"],
      });
    },
  },
];

type SeededAuthor = { id: number; level: AuthorLevel };

type SeededDate = [yearOffset: number, monthDay: string];

type SeededEvent = {
  type: TarificationEventType;
  author: SeededAuthor;
  documentId?: number | null;
  stepCode?: TarificationStepCode | null;
  text?: string | null;
  at: SeededDate;
};

type JournalWriter = ReturnType<typeof createJournalWriter>;

type Scenario = {
  label: string;
  write: (
    writer: JournalWriter,
    authors: { agent: SeededAuthor; operateur: SeededAuthor }
  ) => Promise<void>;
};
