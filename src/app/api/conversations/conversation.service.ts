import { AuthorLevel, type Visibility } from "@/generated/prisma/enums";
import type { ConversationTag } from "@/types/conversation.type";

import type { MessageDb } from "./conversation.db.type";
import {
  createMessage,
  createMessageReceipts,
  findConversationMessageIds,
  findMessages,
  updateMessageTagKey,
  upsertConversation,
} from "./conversation.repository";
import {
  assertCanAccessVisibility,
  assertCanPostMessage,
  assertCanTag,
  assertTagKnown,
} from "./conversation.util";

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
  isOperateurReader,
}: {
  structureTarificationId: number;
  visibility: Visibility;
  isOperateurReader: boolean;
}): Promise<MessageDb[]> => {
  assertCanAccessVisibility(isOperateurReader, visibility);
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
  assertCanAccessVisibility(reader.level === AuthorLevel.OPERATEUR, visibility);
  const conversationMessageIds = await findConversationMessageIds(
    structureTarificationId,
    visibility,
    messageIds
  );
  return createMessageReceipts(reader.id, conversationMessageIds);
};

type ConversationParticipant = { id: number; level: AuthorLevel };
