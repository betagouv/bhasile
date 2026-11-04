import { DomainError } from "@/app/utils/domain-error.util";
import type { Prisma } from "@/generated/prisma/client";
import {
  type AuthorLevel,
  type StructureType,
  type TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
} from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";
import type { PrismaTransaction } from "@/types/prisma.type";
import type {
  ExistingFicheCopy,
  FicheCopy,
  TarificationJournalEvent,
} from "@/types/tarification.type";

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
  const campaign = await upsertTarificationCampaign(year);
  return upsertTarificationInCampaign(structureId, campaign.id);
};

// `update` non vide : sinon Prisma émule l'upsert (SELECT puis INSERT, P2002 sur deux premiers appels simultanés) au lieu d'un INSERT … ON CONFLICT
const upsertTarificationCampaign = (year: number) =>
  prisma.tarificationCampaign.upsert({
    where: { year },
    update: { year },
    create: { year },
    select: { id: true },
  });

const upsertTarificationInCampaign = (
  structureId: number,
  campaignId: number,
  db: PrismaTransaction = prisma
) =>
  db.structureTarification.upsert({
    where: { structureId_campaignId: { structureId, campaignId } },
    update: { campaignId },
    create: { structureId, campaignId },
    select: { id: true },
  });

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
  const campaign = await upsertTarificationCampaign(year);
  return prisma.$transaction(async (tx) => {
    const { id: structureTarificationId } = await upsertTarificationInCampaign(
      structureId,
      campaign.id,
      tx
    );
    return callback({
      findJournal: () =>
        findStructureTarificationJournal(structureId, year, tx),
      findCampaign: () => findTarificationCampaign(year, tx),
      findFicheCopies: () => findFicheCopies(structureId, year, tx),
      createFicheCopy: (copy) => createFicheCopy(tx, structureId, copy),
      deleteFicheCopy: (copy) => deleteFicheCopy(tx, copy),
      createDocument: (document) =>
        createTarificationDocument(tx, structureTarificationId, document),
      createEvent: (event) =>
        createTarificationEvent(tx, structureTarificationId, event),
    });
  });
};

export const findFicheCopies = async (
  structureId: number,
  year: number,
  db: PrismaTransaction = prisma
): Promise<ExistingFicheCopy[]> => {
  const where = {
    sourceTarificationDocument: {
      structureTarification: { structureId, campaign: { year } },
    },
  };
  const select = {
    id: true,
    category: true,
    sourceTarificationDocumentId: true,
  };
  const documentsFinanciers = await db.documentFinancier.findMany({
    where,
    select,
  });
  const actesAdministratifs = await db.acteAdministratif.findMany({
    where,
    select,
  });
  return [
    ...documentsFinanciers.map((copy) => ({
      id: copy.id,
      target: "DOCUMENT_FINANCIER" as const,
      category: copy.category!,
      documentId: copy.sourceTarificationDocumentId!,
    })),
    ...actesAdministratifs.map((copy) => ({
      id: copy.id,
      target: "ACTE_ADMINISTRATIF" as const,
      category: copy.category!,
      documentId: copy.sourceTarificationDocumentId!,
    })),
  ];
};

const createFicheCopy = async (
  tx: PrismaTransaction,
  structureId: number,
  { copy, structureType, file }: FicheCopyCreate
): Promise<void> => {
  const fileUploads = { create: file };
  if (copy.target === "ACTE_ADMINISTRATIF") {
    await tx.acteAdministratif.create({
      data: {
        structureId,
        structureType,
        category: copy.category,
        startDate: new Date(Date.UTC(copy.year, 0, 1)),
        endDate: new Date(Date.UTC(copy.year, 11, 31)),
        sourceTarificationDocumentId: copy.documentId,
        fileUploads,
      },
    });
    return;
  }
  await tx.documentFinancier.create({
    data: {
      structureId,
      structureType,
      category: copy.category,
      year: copy.year,
      sourceTarificationDocumentId: copy.documentId,
      fileUploads,
    },
  });
};

const deleteFicheCopy = async (
  tx: PrismaTransaction,
  { id, target }: ExistingFicheCopy
): Promise<void> => {
  if (target === "ACTE_ADMINISTRATIF") {
    await tx.acteAdministratif.delete({ where: { id } });
    return;
  }
  await tx.documentFinancier.delete({ where: { id } });
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

type FicheCopyCreate = {
  copy: FicheCopy;
  structureType: StructureType | null;
  file: {
    key: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    sha256: string | null;
  };
};

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
  findFicheCopies: () => Promise<ExistingFicheCopy[]>;
  createFicheCopy: (copy: FicheCopyCreate) => Promise<void>;
  deleteFicheCopy: (copy: ExistingFicheCopy) => Promise<void>;
  createDocument: (
    document: TarificationDocumentCreate
  ) => Promise<{ id: number }>;
  createEvent: (event: TarificationEventCreate) => Promise<{ id: number }>;
};
