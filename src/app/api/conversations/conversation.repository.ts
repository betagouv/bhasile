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
    update: {},
    create: { structureTarificationId, visibility },
    select: { id: true },
  });

export const createMessage = (data: MessageCreateData): Promise<MessageDb> =>
  prisma.message.create({ data, select: messageSelect });

type MessageCreateData = {
  conversationId: number;
  authorId: number;
  authorLevel: AuthorLevel;
  text: string;
  tagKey: string | null;
};

export const findMessages = (
  structureTarificationId: number,
  visibility: Visibility,
  afterMessageId: number
): Promise<MessageDb[]> =>
  prisma.message.findMany({
    where: {
      id: { gt: afterMessageId },
      conversation: { structureTarificationId, visibility },
    },
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
