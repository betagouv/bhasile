import type { MessageDb } from "@/app/api/conversations/conversation.db.type";
import {
  changeMessageTag,
  getMessages,
  markMessagesAsRead,
  postMessage,
} from "@/app/api/conversations/conversation.service";
import {
  assertCanPostMessage,
  getAuthorLevel,
} from "@/app/api/conversations/conversation.util";
import { getUserWithGrantsByEmail } from "@/app/api/users/user.repository";
import { getEffectiveGrants } from "@/app/api/users/user.util";
import { DomainError } from "@/app/utils/domain-error.util";
import type { AuthorLevel, Visibility } from "@/generated/prisma/enums";
import { canAccessTarification } from "@/lib/casl";
import { SessionUser } from "@/types/global";

import { TARIFICATION_CONVERSATION_TAGS } from "./tarification.constants";
import {
  findMessageTarification,
  findStructureScope,
  findStructureTarification,
  upsertStructureTarification,
} from "./tarification.repository";
import { assertCampaignOpen, assertCanWrite } from "./tarification.util";

export const getTarificationParticipant = async (
  user: SessionUser,
  structureId: number
): Promise<TarificationParticipant> => {
  const structure = await findStructureScope(structureId);
  if (!structure) {
    throw new DomainError("Structure introuvable", 404);
  }
  return resolveParticipant(user, structure);
};

export const getTarificationReader = async (
  user: SessionUser,
  structureId: number
): Promise<TarificationReader> => {
  const structure = await findStructureScope(structureId);
  if (!structure) {
    throw new DomainError("Structure introuvable", 404);
  }
  assertCanAccessTarification(user, structure);
  return { isOperateur: user.operateurId !== null };
};

export const postTarificationMessage = async ({
  structureId,
  year,
  visibility,
  author,
  text,
  tagKey,
  fileKeys,
}: {
  structureId: number;
  year: number;
  visibility: Visibility;
  author: TarificationParticipant;
  text: string;
  tagKey: string | null;
  fileKeys: string[];
}): Promise<MessageDb> => {
  assertCanWrite(author);
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
      fileKeys,
    },
    TARIFICATION_CONVERSATION_TAGS
  );
};

export const getTarificationMessages = async ({
  structureId,
  year,
  visibility,
  reader,
}: {
  structureId: number;
  year: number;
  visibility: Visibility;
  reader: TarificationReader;
}): Promise<MessageDb[]> => {
  const tarification = await findStructureTarification(structureId, year);
  if (!tarification) {
    return [];
  }
  return getMessages({
    structureTarificationId: tarification.id,
    visibility,
    isOperateurReader: reader.isOperateur,
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
}): Promise<{ count: number }> => {
  if (reader.isSuperAdmin) {
    return { count: 0 };
  }
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
  user,
}: {
  messageId: number;
  tagKey: string | null;
  user: SessionUser;
}): Promise<MessageDb> => {
  const message = await findMessageTarification(messageId);
  if (!message) {
    throw new DomainError("Message introuvable", 404);
  }
  const { structure, campaign } = message.conversation.structureTarification;
  const editor = await resolveParticipant(user, structure);
  assertCanWrite(editor);
  assertCampaignOpen(campaign.year);
  return changeMessageTag(
    { messageId, tagKey, editorLevel: editor.level },
    TARIFICATION_CONVERSATION_TAGS
  );
};

const resolveParticipant = async (
  user: SessionUser,
  structure: TarificationStructureScope
): Promise<TarificationParticipant> => {
  assertCanAccessTarification(user, structure);
  const databaseUser = await getUserWithGrantsByEmail({ email: user.email });
  if (!databaseUser) {
    throw new DomainError("Utilisateur inconnu", 401);
  }
  return {
    id: databaseUser.id,
    level: getAuthorLevel({
      operateurId: databaseUser.operateurId,
      grants: getEffectiveGrants(databaseUser),
    }),
    isSuperAdmin: databaseUser.isSuperAdmin,
  };
};

const assertCanAccessTarification = (
  user: SessionUser,
  structure: TarificationStructureScope
): void => {
  if (!canAccessTarification(user, structure)) {
    throw new DomainError(
      "Accès refusé à la tarification de la structure",
      403
    );
  }
};

type TarificationStructureScope = {
  id: number;
  departementAdministratif: string;
  operateurId: number | null;
};

export type TarificationReader = { isOperateur: boolean };

export type TarificationParticipant = {
  id: number;
  level: AuthorLevel;
  isSuperAdmin: boolean;
};
