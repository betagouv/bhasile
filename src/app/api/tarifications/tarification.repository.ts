import { DomainError } from "@/app/utils/domain-error.util";
import type { Prisma } from "@/generated/prisma/client";
import {
  type AuthorLevel,
  type TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import type { PrismaTransaction } from "@/types/prisma.type";
import type { TarificationJournalEvent } from "@/types/tarification.type";

const structureScopeSelect = {
  id: true,
  departementAdministratif: true,
  operateurId: true,
  type: true,
} satisfies Prisma.StructureSelect;

export const upsertStructureTarification = async (
  structureId: number,
  year: number
) => {
  // `update` non vide : sinon Prisma émule l'upsert (SELECT puis INSERT, P2002 sur deux premiers appels simultanés) au lieu d'un INSERT … ON CONFLICT
  const campaign = await prisma.tarificationCampaign.upsert({
    where: { year },
    update: { year },
    create: { year },
    select: { id: true },
  });
  return prisma.structureTarification.upsert({
    where: {
      structureId_campaignId: { structureId, campaignId: campaign.id },
    },
    update: { campaignId: campaign.id },
    create: { structureId, campaignId: campaign.id },
    select: { id: true },
  });
};

export const findStructureTarification = (structureId: number, year: number) =>
  prisma.structureTarification.findFirst({
    where: { structureId, campaign: { year } },
    select: { id: true },
  });

export const findStructureTarificationCampaigns = (structureId: number) =>
  prisma.structureTarification.findMany({
    where: { structureId },
    select: { campaign: { select: { year: true } } },
  });

export const findMessageTarification = (messageId: number) =>
  prisma.message.findUnique({
    where: { id: messageId },
    select: {
      conversation: {
        select: {
          structureTarification: {
            select: {
              structure: { select: structureScopeSelect },
              campaign: { select: { year: true } },
            },
          },
        },
      },
    },
  });

export const findStructureScope = (structureId: number) =>
  prisma.structure.findUnique({
    where: { id: structureId },
    select: { ...structureScopeSelect, codeBhasile: true },
  });

export const findPendingMessageContexts = () =>
  prisma.emailNotification.findMany({
    where: { processedAt: null },
    orderBy: { id: "asc" },
    select: {
      id: true,
      message: {
        select: {
          id: true,
          authorId: true,
          conversation: {
            select: {
              id: true,
              visibility: true,
              structureTarification: {
                select: {
                  structure: {
                    select: {
                      id: true,
                      departementAdministratif: true,
                      codeBhasile: true,
                    },
                  },
                  campaign: { select: { year: true } },
                },
              },
            },
          },
        },
      },
    },
  });

export const findTarificationCampaign = (
  year: number,
  db: PrismaTransaction = prisma
) =>
  db.tarificationCampaign.findUnique({
    where: { year },
    select: { drlPublishedAt: true, drlUrl: true },
  });

export const findStructureTarificationJournal = (
  structureId: number,
  year: number,
  db: PrismaTransaction = prisma
) =>
  db.structure.findUnique({
    where: { id: structureId },
    select: {
      departementAdministratif: true,
      cpomStructures: {
        select: {
          dateStart: true,
          dateEnd: true,
          cpom: {
            select: {
              actesAdministratifs: {
                select: {
                  id: true,
                  category: true,
                  parentId: true,
                  startDate: true,
                  endDate: true,
                },
              },
            },
          },
        },
      },
      structureTarifications: {
        where: { campaign: { year } },
        select: {
          documents: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              types: true,
              status: true,
              fileUpload: {
                select: {
                  key: true,
                  originalName: true,
                  mimeType: true,
                  fileSize: true,
                  sha256: true,
                },
              },
              openings: {
                select: {
                  documentId: true,
                  userId: true,
                  createdAt: true,
                  user: { select: { name: true } },
                },
              },
            },
          },
          events: {
            orderBy: { id: "asc" },
            select: {
              id: true,
              type: true,
              authorId: true,
              authorLevel: true,
              documentId: true,
              stepCode: true,
              text: true,
              createdAt: true,
              author: { select: { name: true } },
            },
          },
        },
      },
    },
  });

// La première ouverture fait foi : les suivantes n'écrasent rien
export const createTarificationDocumentOpening = (
  documentId: number,
  userId: number
) =>
  prisma.tarificationDocumentOpening.createMany({
    data: [{ documentId, userId }],
    skipDuplicates: true,
  });

// L'upsert verrouille la tarification jusqu'au commit, grâce à son `update` non vide : deux faits simultanés
// s'exécutent l'un après l'autre, et le second relit le journal avant ses gardes. La campagne reste hors
// transaction : son verrou bloquerait toutes les structures du pays
export const runInTarificationTransaction = async <T>(
  structureId: number,
  year: number,
  callback: (transaction: TarificationTransaction) => Promise<T>
): Promise<T> => {
  const campaign = await prisma.tarificationCampaign.upsert({
    where: { year },
    update: { year },
    create: { year },
    select: { id: true },
  });
  return prisma.$transaction(async (tx) => {
    const { id: structureTarificationId } =
      await tx.structureTarification.upsert({
        where: {
          structureId_campaignId: { structureId, campaignId: campaign.id },
        },
        update: { campaignId: campaign.id },
        create: { structureId, campaignId: campaign.id },
        select: { id: true },
      });
    return callback({
      findJournal: () =>
        findStructureTarificationJournal(structureId, year, tx),
      findCampaign: () => findTarificationCampaign(year, tx),
      createDocument: (document) =>
        createTarificationDocument(tx, structureTarificationId, document),
      createEvent: (event) =>
        createTarificationEvent(tx, structureTarificationId, event),
    });
  });
};

const createTarificationDocument = async (
  tx: PrismaTransaction,
  structureTarificationId: number,
  { fileKey, types, status, author }: TarificationDocumentCreate
): Promise<{ id: number }> => {
  const fileUpload = await tx.fileUpload.findFirst({
    where: {
      key: fileKey,
      acteAdministratifId: null,
      documentFinancierId: null,
      controleId: null,
      evaluationId: null,
      operateurId: null,
      messageId: null,
      tarificationDocument: null,
    },
    select: { id: true },
  });
  if (!fileUpload) {
    throw new DomainError("Ce fichier est introuvable ou déjà rattaché", 422);
  }
  const document = await tx.tarificationDocument.create({
    data: {
      structureTarificationId,
      fileUploadId: fileUpload.id,
      types,
      status,
    },
    select: { id: true },
  });
  await tx.tarificationEvent.create({
    data: {
      structureTarificationId,
      type: TarificationEventType.DOCUMENT_DEPOSITED,
      authorId: author.id,
      authorLevel: author.level,
      documentId: document.id,
    },
  });
  return document;
};

const createTarificationEvent = (
  tx: PrismaTransaction,
  structureTarificationId: number,
  event: TarificationEventCreate
): Promise<{ id: number }> =>
  tx.tarificationEvent.create({
    data: { structureTarificationId, ...event },
    select: { id: true },
  });

type TarificationDocumentCreate = {
  fileKey: string;
  types: TarificationDocumentType[];
  status: TarificationDocumentStatus;
  author: { id: number; level: AuthorLevel };
};

type TarificationEventCreate = Omit<
  TarificationJournalEvent,
  "id" | "createdAt"
>;

export type TarificationJournalSource = {
  findJournal: () => ReturnType<typeof findStructureTarificationJournal>;
  findCampaign: () => ReturnType<typeof findTarificationCampaign>;
};

export type TarificationTransaction = TarificationJournalSource & {
  createDocument: (
    document: TarificationDocumentCreate
  ) => Promise<{ id: number }>;
  createEvent: (event: TarificationEventCreate) => Promise<{ id: number }>;
};
