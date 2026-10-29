import dayjs from "dayjs";

import { getNow } from "@/app/utils/now.util";
import { AuthorLevel, type Visibility } from "@/generated/prisma/enums";
import { isBrevoConfigured, sendTemplateEmail } from "@/lib/brevo";
import type {
  ConversationTag,
  PendingMessageNotification,
} from "@/types/conversation.type";

import type { MessageDb } from "./conversation.db.type";
import {
  createMessage,
  createMessageNotifications,
  createMessageReceipts,
  createNotificationRecipients,
  findConversationMessageIds,
  findMessages,
  findNotifiedOrReadPairs,
  findPendingMessageIds,
  updateMessageTagKey,
  upsertConversation,
} from "./conversation.repository";
import {
  assertCanAccessVisibility,
  assertCanPostMessage,
  assertCanTag,
  assertTagKnown,
  buildDigests,
} from "./conversation.util";

const NOTIFICATION_ABANDON_DAYS = 3;

export const postMessage = async (
  {
    structureTarificationId,
    visibility,
    author,
    text,
    tagKey,
    fileKeys,
  }: {
    structureTarificationId: number;
    visibility: Visibility;
    author: ConversationParticipant;
    text: string;
    tagKey: string | null;
    fileKeys: string[];
  },
  tags: ConversationTag[]
): Promise<MessageDb> => {
  assertCanPostMessage({ level: author.level, visibility, tagKey }, tags);
  const conversation = await upsertConversation(
    structureTarificationId,
    visibility
  );
  return createMessage({
    conversationId: conversation.id,
    authorId: author.id,
    authorLevel: author.level,
    text,
    tagKey,
    fileKeys: [...new Set(fileKeys)],
  });
};

export const getMessages = ({
  structureTarificationId,
  visibility,
  isAgentReader,
}: {
  structureTarificationId: number;
  visibility: Visibility;
  isAgentReader: boolean;
}): Promise<MessageDb[]> => {
  assertCanAccessVisibility(isAgentReader, visibility);
  return findMessages(structureTarificationId, visibility);
};

export const changeMessageTag = (
  {
    messageId,
    tagKey,
    editorLevel,
  }: { messageId: number; tagKey: string | null; editorLevel: AuthorLevel },
  tags: ConversationTag[]
): Promise<MessageDb> => {
  assertCanTag(editorLevel);
  if (tagKey !== null) {
    assertTagKnown(tagKey, tags);
  }
  return updateMessageTagKey(messageId, tagKey);
};

export const markMessagesAsRead = async ({
  structureTarificationId,
  visibility,
  reader,
  messageIds,
}: {
  structureTarificationId: number;
  visibility: Visibility;
  reader: ConversationParticipant;
  messageIds: number[];
}) => {
  assertCanAccessVisibility(reader.level !== AuthorLevel.OPERATEUR, visibility);
  const conversationMessageIds = await findConversationMessageIds(
    structureTarificationId,
    visibility,
    messageIds
  );
  return createMessageReceipts(reader.id, conversationMessageIds);
};

export const sendMessageDigests = async (
  pendingMessages: PendingMessageNotification[]
): Promise<{ sentCount: number; failedCount: number }> => {
  const templateId = getMessageTemplateId();
  if (templateId === null) {
    return { sentCount: 0, failedCount: 0 };
  }
  const digests = buildDigests(
    pendingMessages,
    await findNotifiedOrReadPairs(
      pendingMessages.map((message) => message.messageId)
    )
  );
  const failedUserIds = new Set<number>();
  for (const digest of digests) {
    try {
      const brevoMessageId = await sendTemplateEmail({
        to: digest.email,
        templateId,
        params: {
          nombre: digest.messageIds.length,
          conversations: digest.conversations,
        },
      });
      await createNotificationRecipients(
        digest.messageIds.map((messageId) => ({
          messageId,
          userId: digest.userId,
          email: digest.email,
          brevoMessageId,
        }))
      );
    } catch (error) {
      failedUserIds.add(digest.userId);
      console.error(error);
    }
  }
  await createMessageNotifications(
    pendingMessages
      .filter(
        (message) =>
          !message.recipients.some((recipient) =>
            failedUserIds.has(recipient.userId)
          )
      )
      .map((message) => message.messageId),
    null
  );
  return {
    sentCount: digests.length - failedUserIds.size,
    failedCount: failedUserIds.size,
  };
};

export const abandonStaleNotifications = async (): Promise<number> => {
  if (getMessageTemplateId() === null) {
    return 0;
  }
  const now = getNow();
  const staleMessageIds = await findPendingMessageIds(
    dayjs(now).subtract(NOTIFICATION_ABANDON_DAYS, "day").toDate()
  );
  await createMessageNotifications(staleMessageIds, now);
  return staleMessageIds.length;
};

const getMessageTemplateId = (): number | null => {
  const templateId = Number(process.env.BREVO_MESSAGE_TEMPLATE_ID);
  return isBrevoConfigured() && templateId > 0 ? templateId : null;
};

type ConversationParticipant = { id: number; level: AuthorLevel };
