import prisma from "@/lib/prisma";

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

export const findMessageTarification = (messageId: number) =>
  prisma.message.findUnique({
    where: { id: messageId },
    select: {
      conversation: {
        select: {
          structureTarification: {
            select: {
              structure: {
                select: {
                  id: true,
                  departementAdministratif: true,
                  operateurId: true,
                },
              },
              campaign: { select: { year: true } },
            },
          },
        },
      },
    },
  });
