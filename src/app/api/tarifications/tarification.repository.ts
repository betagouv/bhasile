import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

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

export const findTarificationCampaign = (year: number) =>
  prisma.tarificationCampaign.findUnique({
    where: { year },
    select: { drlPublishedAt: true, drlUrl: true },
  });

export const findStructureTarificationJournal = (
  structureId: number,
  year: number
) =>
  prisma.structure.findUnique({
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
