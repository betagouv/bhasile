import type { AuthorLevel, Visibility } from "@/generated/prisma/enums";
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
  }: {
    structureTarificationId: number;
    visibility: Visibility;
    author: ConversationParticipant;
    text: string;
    tagKey: string | null;
  },
  tags: ConversationTag[]
): Promise<MessageDb> => {
  assertCanAccessVisibility(author.level, visibility);
  if (tagKey !== null) {
    assertCanTag(author.level);
    assertTagKnown(tagKey, tags);
  }
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
  });
};

export const getMessages = (
  {
    structureTarificationId,
    visibility,
    readerLevel,
  }: {
    structureTarificationId: number;
    visibility: Visibility;
    readerLevel: AuthorLevel;
  },
  afterMessageId = 0
): Promise<MessageDb[]> => {
  assertCanAccessVisibility(readerLevel, visibility);
  return findMessages(structureTarificationId, visibility, afterMessageId);
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
  assertCanAccessVisibility(reader.level, visibility);
  const conversationMessageIds = await findConversationMessageIds(
    structureTarificationId,
    visibility,
    messageIds
  );
  return createMessageReceipts(reader.id, conversationMessageIds);
};

type ConversationParticipant = { id: number; level: AuthorLevel };
