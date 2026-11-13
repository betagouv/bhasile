import { unattachedFileWhere } from "@/app/api/files/file.db.type";
import { DomainError } from "@/app/utils/domain-error.util";
import type { AuthorLevel, Visibility } from "@/generated/prisma/enums";
import prisma from "@/lib/prisma";

import { type MessageDb, messageSelect } from "./conversation.db.type";

export const upsertConversation = (
  structureTarificationId: number,
  visibility: Visibility
) =>
  prisma.conversation.upsert({
    where: {
      structureTarificationId_visibility: {
        structureTarificationId,
        visibility,
      },
    },
    update: { visibility },
    create: { structureTarificationId, visibility },
    select: { id: true },
  });

// Le rattachement conditionnel dans la transaction empêche deux messages de se disputer un même fichier
export const createMessage = ({
  fileKeys,
  ...data
}: MessageCreateData): Promise<MessageDb> =>
  prisma.$transaction(async (tx) => {
    const message = await tx.message.create({
      data: { ...data, emailNotification: { create: {} } },
      select: { id: true },
    });
    const attached = await tx.fileUpload.updateMany({
      where: {
        key: { in: fileKeys },
        ...unattachedFileWhere,
      },
      data: { messageId: message.id },
    });
    if (attached.count !== fileKeys.length) {
      throw new DomainError(
        "Une pièce jointe est introuvable ou déjà rattachée à un document"
      );
    }
    return tx.message.findUniqueOrThrow({
      where: { id: message.id },
      select: messageSelect,
    });
  });

type MessageCreateData = {
  conversationId: number;
  authorId: number;
  authorLevel: AuthorLevel;
  text: string;
  tagKey: string | null;
  fileKeys: string[];
};

export const findMessages = (
  structureTarificationId: number,
  visibility: Visibility
): Promise<MessageDb[]> =>
  prisma.message.findMany({
    where: { conversation: { structureTarificationId, visibility } },
    orderBy: { id: "asc" },
    select: messageSelect,
  });

export const findUnreadMessageCounts = (
  structureTarificationId: number,
  userId: number
) =>
  prisma.conversation.findMany({
    where: { structureTarificationId },
    select: {
      visibility: true,
      _count: {
        select: {
          messages: {
            where: {
              authorId: { not: userId },
              receipts: { none: { userId } },
            },
          },
        },
      },
    },
  });

export const findConversationMessageIds = async (
  structureTarificationId: number,
  visibility: Visibility,
  messageIds: number[]
): Promise<number[]> => {
  const messages = await prisma.message.findMany({
    where: {
      id: { in: messageIds },
      conversation: { structureTarificationId, visibility },
    },
    select: { id: true },
  });
  return messages.map((message) => message.id);
};

export const updateMessageTagKey = (
  messageId: number,
  tagKey: string | null
): Promise<MessageDb> =>
  prisma.message.update({
    where: { id: messageId },
    data: { tagKey },
    select: messageSelect,
  });

export const createMessageReceipts = (userId: number, messageIds: number[]) =>
  prisma.messageReceipt.createMany({
    data: messageIds.map((messageId) => ({ messageId, userId })),
    skipDuplicates: true,
  });

export const findStaleNotificationIds = async (
  createdBefore: Date
): Promise<number[]> => {
  const notifications = await prisma.emailNotification.findMany({
    where: { processedAt: null, createdAt: { lt: createdBefore } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return notifications.map((notification) => notification.id);
};

export const markNotificationsProcessed = (
  notificationIds: number[],
  processedAt: Date
) =>
  prisma.emailNotification.updateMany({
    where: { id: { in: notificationIds } },
    data: { processedAt },
  });

export const markNotificationsAbandoned = (
  notificationIds: number[],
  abandonedAt: Date
) =>
  prisma.emailNotification.updateMany({
    where: { id: { in: notificationIds } },
    data: { processedAt: abandonedAt, abandonedAt },
  });

export const findNotifiedPairs = async (
  messageIds: number[]
): Promise<MessageUser[]> => {
  const recipients = await prisma.emailNotificationRecipient.findMany({
    where: { notification: { messageId: { in: messageIds } } },
    select: { userId: true, notification: { select: { messageId: true } } },
  });
  return recipients.map(({ userId, notification }) => ({
    messageId: notification.messageId,
    userId,
  }));
};

export const findReadPairs = (messageIds: number[]): Promise<MessageUser[]> =>
  prisma.messageReceipt.findMany({
    where: { messageId: { in: messageIds } },
    select: { messageId: true, userId: true },
  });

export const createNotificationRecipients = (
  data: {
    notificationId: number;
    userId: number;
    email: string;
    brevoMessageId: string;
  }[]
) =>
  prisma.emailNotificationRecipient.createMany({
    data,
    skipDuplicates: true,
  });

type MessageUser = { messageId: number; userId: number };
