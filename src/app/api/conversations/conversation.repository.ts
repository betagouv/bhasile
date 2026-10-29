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
    const message = await tx.message.create({ data, select: { id: true } });
    const attached = await tx.fileUpload.updateMany({
      where: {
        key: { in: fileKeys },
        acteAdministratifId: null,
        documentFinancierId: null,
        controleId: null,
        evaluationId: null,
        operateurId: null,
        messageId: null,
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

export const findPendingMessageIds = async (
  createdBefore: Date
): Promise<number[]> => {
  const messages = await prisma.message.findMany({
    where: { notification: null, createdAt: { lt: createdBefore } },
    orderBy: { id: "asc" },
    select: { id: true },
  });
  return messages.map((message) => message.id);
};

export const createMessageNotifications = (
  messageIds: number[],
  abandonedAt: Date | null
) =>
  prisma.messageNotification.createMany({
    data: messageIds.map((messageId) => ({ messageId, abandonedAt })),
    skipDuplicates: true,
  });

export const findNotifiedOrReadPairs = async (
  messageIds: number[]
): Promise<MessageUser[]> => {
  const [notifiedPairs, readPairs] = await Promise.all([
    prisma.messageNotificationRecipient.findMany({
      where: { messageId: { in: messageIds } },
      select: { messageId: true, userId: true },
    }),
    prisma.messageReceipt.findMany({
      where: { messageId: { in: messageIds } },
      select: { messageId: true, userId: true },
    }),
  ]);
  return [...notifiedPairs, ...readPairs];
};

export const createNotificationRecipients = (
  data: {
    messageId: number;
    userId: number;
    email: string;
    brevoMessageId: string;
  }[]
) =>
  prisma.messageNotificationRecipient.createMany({
    data,
    skipDuplicates: true,
  });

type MessageUser = { messageId: number; userId: number };
