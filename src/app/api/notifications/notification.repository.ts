import type { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";

export const findNotificationUser = (userId: number) =>
  prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { createdAt: true, notificationSeenAt: true },
  });

export const findNotificationTarifications = ({
  where,
  eventWhere,
  userId,
}: {
  where: Prisma.StructureTarificationWhereInput;
  eventWhere: Prisma.TarificationEventWhereInput;
  userId: number;
}) =>
  prisma.structureTarification.findMany({
    where,
    select: {
      campaign: { select: { year: true } },
      structure: {
        select: {
          id: true,
          codeBhasile: true,
          departementAdministratif: true,
          operateurId: true,
        },
      },
      documents: {
        select: {
          id: true,
          types: true,
          status: true,
          openings: {
            where: { userId },
            select: { documentId: true, userId: true, createdAt: true },
          },
        },
      },
      events: {
        where: eventWhere,
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
          notificationReads: { where: { userId }, select: { userId: true } },
        },
      },
    },
  });

export const findNotificationConversations = ({
  where,
  unreadMessageWhere,
}: {
  where: Prisma.ConversationWhereInput;
  unreadMessageWhere: Prisma.MessageWhereInput;
}) =>
  prisma.conversation.findMany({
    where,
    select: {
      id: true,
      visibility: true,
      structureTarification: {
        select: {
          campaign: { select: { year: true } },
          structure: {
            select: {
              id: true,
              codeBhasile: true,
              departementAdministratif: true,
              operateurId: true,
            },
          },
        },
      },
      messages: {
        where: unreadMessageWhere,
        orderBy: { id: "desc" },
        take: 1,
        select: { createdAt: true },
      },
      _count: { select: { messages: { where: unreadMessageWhere } } },
    },
  });

export const createNotificationRead = (
  userId: number,
  tarificationEventId: number
) =>
  prisma.notificationRead.createMany({
    data: [{ userId, tarificationEventId }],
    skipDuplicates: true,
  });

// Borné par l'horloge de la base, qui date le journal, et jamais en recul
export const updateNotificationSeenAt = (userId: number, seenUntil: Date) =>
  prisma.$executeRaw`
    UPDATE "User"
    SET "notificationSeenAt" = GREATEST(
      COALESCE("notificationSeenAt", '-infinity'::timestamp),
      LEAST(
        ${seenUntil.toISOString()}::timestamptz AT TIME ZONE 'UTC',
        clock_timestamp() AT TIME ZONE 'UTC'
      )
    )
    WHERE "id" = ${userId}`;

export type NotificationTarificationDb = Awaited<
  ReturnType<typeof findNotificationTarifications>
>[number];

export type NotificationConversationDb = Awaited<
  ReturnType<typeof findNotificationConversations>
>[number];
