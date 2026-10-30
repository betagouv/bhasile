import type { MessageDb } from "@/app/api/conversations/conversation.db.type";
import {
  changeMessageTag,
  getMessages,
  markMessagesAsRead,
  postMessage,
} from "@/app/api/conversations/conversation.service";
import { assertCanPostMessage } from "@/app/api/conversations/conversation.util";
import { DomainError } from "@/app/utils/domain-error.util";
import type { AuthorLevel, Visibility } from "@/generated/prisma/enums";
import { SessionUser } from "@/types/global";

import { TARIFICATION_CONVERSATION_TAGS } from "./tarification.constants";
import {
  findMessageTarification,
  findStructureTarification,
  upsertStructureTarification,
} from "./tarification.repository";
import { assertCampaignOpen, canAccessTarification } from "./tarification.util";

export const postTarificationMessage = async ({
  structureId,
  year,
  visibility,
  author,
  text,
  tagKey,
}: {
  structureId: number;
  year: number;
  visibility: Visibility;
  author: TarificationParticipant;
  text: string;
  tagKey: string | null;
}): Promise<MessageDb> => {
  assertCampaignOpen(year);
  assertCanPostMessage(
    { level: author.level, visibility, tagKey },
    TARIFICATION_CONVERSATION_TAGS
  );
  const tarification = await upsertStructureTarification(structureId, year);
  return postMessage(
    {
      structureTarificationId: tarification.id,
      visibility,
      author,
      text,
      tagKey,
    },
    TARIFICATION_CONVERSATION_TAGS
  );
};

export const getTarificationMessages = async ({
  structureId,
  year,
  visibility,
  readerLevel,
}: {
  structureId: number;
  year: number;
  visibility: Visibility;
  readerLevel: AuthorLevel;
}): Promise<MessageDb[]> => {
  const tarification = await findStructureTarification(structureId, year);
  if (!tarification) {
    return [];
  }
  return getMessages({
    structureTarificationId: tarification.id,
    visibility,
    readerLevel,
  });
};

export const markTarificationMessagesAsRead = async ({
  structureId,
  year,
  visibility,
  reader,
  messageIds,
}: {
  structureId: number;
  year: number;
  visibility: Visibility;
  reader: TarificationParticipant;
  messageIds: number[];
}) => {
  const tarification = await findStructureTarification(structureId, year);
  if (!tarification) {
    return { count: 0 };
  }
  return markMessagesAsRead({
    structureTarificationId: tarification.id,
    visibility,
    reader,
    messageIds,
  });
};

export const changeTarificationMessageTag = async ({
  messageId,
  tagKey,
  editor,
}: {
  messageId: number;
  tagKey: string | null;
  editor: { user: SessionUser; level: AuthorLevel };
}): Promise<MessageDb> => {
  const message = await findMessageTarification(messageId);
  if (!message) {
    throw new DomainError("Message introuvable", 404);
  }
  const { structure, campaign } = message.conversation.structureTarification;
  if (!canAccessTarification(editor.user, structure)) {
    throw new DomainError(
      "Accès refusé à la tarification de la structure",
      403
    );
  }
  assertCampaignOpen(campaign.year);
  return changeMessageTag(
    { messageId, tagKey, editorLevel: editor.level },
    TARIFICATION_CONVERSATION_TAGS
  );
};

type TarificationParticipant = { id: number; level: AuthorLevel };
