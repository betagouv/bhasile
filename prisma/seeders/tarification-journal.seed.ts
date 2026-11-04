import { fakerFR as faker } from "@faker-js/faker";

import {
  AuthorLevel,
  PrismaClient,
  TarificationDocumentStatus,
  TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
  Visibility,
} from "@/generated/prisma/client";
import { isEventShapeValid } from "@/lib/tarification/tarification.event";

import { createFakeFileUpload } from "./file-upload.seed";
import { daysAgo, SCENARIOS } from "./tarification-journal.scenarios";

const DRL_PUBLISHED_DAYS_AGO = 55;

export const createFakeTarificationJournals = async (
  prisma: PrismaClient,
  campaignYear: number
): Promise<void> => {
  const campaign = await prisma.tarificationCampaign.update({
    where: { year: campaignYear },
    data: { drlPublishedAt: daysAgo(DRL_PUBLISHED_DAYS_AGO) },
    select: { id: true },
  });
  const [departementalAgent, regionalAgent] = await Promise.all([
    prisma.user.findFirstOrThrow({
      where: { email: { startsWith: "departemental@" } },
      select: { id: true },
    }),
    prisma.user.findFirstOrThrow({
      where: { email: { startsWith: "regional@" } },
      select: { id: true },
    }),
  ]);
  const tarifications = await prisma.structureTarification.findMany({
    where: {
      campaignId: campaign.id,
      structure: { operateurId: { not: null } },
    },
    select: {
      id: true,
      structureId: true,
      structure: { select: { operateurId: true } },
    },
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
    await SCENARIOS[index].write(createJournalWriter(prisma, tarification.id), {
      agent: { id: departementalAgent.id, level: AuthorLevel.DEPARTEMENT },
      reviewer: { id: regionalAgent.id, level: AuthorLevel.REGION },
      operateur: { id: operateurUser.id, level: AuthorLevel.OPERATEUR },
      campaignYear,
    });
  }

  // Le cron de notification ne doit pas envoyer de mail pour ces événements fictifs
  const seededEvents = await prisma.tarificationEvent.findMany({
    select: { id: true },
  });
  await prisma.tarificationEventNotification.createMany({
    data: seededEvents.map((event) => ({ eventId: event.id })),
  });

  console.log(
    `✅ Journaux de tarification ${campaignYear} (structure : scénario) :\n${tarifications
      .map(
        (tarification, index) =>
          `   ${tarification.structureId} : ${SCENARIOS[index].label}`
      )
      .join("\n")}`
  );
};

const createJournalWriter = (
  prisma: PrismaClient,
  structureTarificationId: number
) => {
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
        createdAt: at,
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
    at: Date;
  }): Promise<number> => {
    const fileUpload = await prisma.fileUpload.create({
      data: { ...createFakeFileUpload(), createdAt: at },
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
    // Le cron de notification ne doit pas envoyer de mail pour ces messages fictifs
    addMessage: async ({
      visibility,
      author,
      text,
      tagKey,
      readBy,
      at,
    }: {
      visibility: Visibility;
      author: SeededAuthor;
      text: string;
      tagKey: string;
      readBy?: SeededAuthor;
      at: Date;
    }): Promise<void> => {
      await prisma.message.create({
        data: {
          conversation: {
            connect: {
              structureTarificationId_visibility: {
                structureTarificationId,
                visibility,
              },
            },
          },
          author: { connect: { id: author.id } },
          authorLevel: author.level,
          text,
          tagKey,
          createdAt: at,
          notification: { create: {} },
          receipts: readBy ? { create: { userId: readBy.id } } : undefined,
        },
      });
    },
    share: async (
      types: TarificationDocumentType[],
      agent: SeededAuthor,
      at: Date
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
      at: Date
    ): Promise<void> => {
      await prisma.tarificationDocumentOpening.create({
        data: { documentId, userId: user.id, createdAt: at },
      });
    },
  };
};

export type SeededAuthor = { id: number; level: AuthorLevel };

type SeededEvent = {
  type: TarificationEventType;
  author: SeededAuthor;
  documentId?: number | null;
  stepCode?: TarificationStepCode | null;
  text?: string | null;
  at: Date;
};

export type JournalWriter = ReturnType<typeof createJournalWriter>;
