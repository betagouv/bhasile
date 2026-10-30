import type { MessageDb } from "@/app/api/conversations/conversation.db.type";
import {
  abandonStaleNotifications,
  changeMessageTag,
  getMessages,
  markMessagesAsRead,
  postMessage,
  sendMessageDigests,
} from "@/app/api/conversations/conversation.service";
import {
  assertCanPostMessage,
  getAuthorLevel,
} from "@/app/api/conversations/conversation.util";
import {
  findUsersWithGrantsOnStructure,
  getUserWithGrantsByEmail,
} from "@/app/api/users/user.repository";
import { getAssignedGrants, isAgentUser } from "@/app/api/users/user.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { AuthorLevel, type Visibility } from "@/generated/prisma/enums";
import {
  canAccessTarification,
  isAgent,
  type StructureScope,
} from "@/lib/casl";
import type { ConversationTag } from "@/types/conversation.type";
import { SessionUser } from "@/types/global";

import { TARIFICATION_CONVERSATION_TAGS } from "./tarification.constants";
import {
  findMessageTarification,
  findPendingMessageContexts,
  findStructureScope,
  findStructureTarification,
  findStructureTarificationCampaigns,
  upsertStructureTarification,
} from "./tarification.repository";
import {
  assertCampaignOpen,
  buildNotificationParams,
  getMessageRecipients,
  getSelectableCampaignYears,
} from "./tarification.util";

export const getTarificationParticipant = async (
  user: SessionUser,
  structureId: number
): Promise<TarificationParticipant> => {
  const structure = await findStructureScopeOrThrow(structureId);
  return resolveParticipant(user, structure);
};

export const getTarificationReader = async (
  user: SessionUser,
  structureId: number
): Promise<TarificationReader> => {
  const structure = await findStructureScopeOrThrow(structureId);
  assertCanAccessTarification(user, structure);
  return { isAgent: isAgent(user) };
};

export const getTarificationOverview = async (
  user: SessionUser,
  structureId: number
): Promise<TarificationOverview> => {
  const structure = await findStructureScopeOrThrow(structureId);
  const participant = await resolveParticipant(user, structure);
  const tarifications = await findStructureTarificationCampaigns(structureId);
  return {
    codeBhasile: structure.codeBhasile,
    participant,
    isOperateur: participant.level === AuthorLevel.OPERATEUR,
    campaignYears: getSelectableCampaignYears(
      tarifications.map((tarification) => tarification.campaign.year)
    ),
    tags: TARIFICATION_CONVERSATION_TAGS,
  };
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
    isAgentReader: reader.isAgent,
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
  assertCampaignOpen(campaign.year);
  return changeMessageTag(
    { messageId, tagKey, editorLevel: editor.level },
    TARIFICATION_CONVERSATION_TAGS
  );
};

export const notifyPendingTarificationMessages = async (): Promise<{
  sentCount: number;
  failedCount: number;
  abandonedCount: number;
}> => {
  const abandonedCount = await abandonStaleNotifications();
  const messages = await findPendingMessageContexts();
  const structuresById = new Map(
    messages.map(({ conversation }) => [
      conversation.structureTarification.structure.id,
      conversation.structureTarification.structure,
    ])
  );
  const candidatesByStructureId = new Map(
    await Promise.all(
      [...structuresById.values()].map(
        async (structure) =>
          [
            structure.id,
            await findUsersWithGrantsOnStructure({
              structureId: structure.id,
              departementNumero: structure.departementAdministratif,
            }),
          ] as const
      )
    )
  );
  const { sentCount, failedCount } = await sendMessageDigests(
    messages.map((message) => {
      const { structure, campaign } =
        message.conversation.structureTarification;
      return {
        messageId: message.id,
        conversationId: message.conversation.id,
        recipients: getMessageRecipients(
          candidatesByStructureId.get(structure.id)!,
          { structure, authorId: message.authorId }
        ),
        params: buildNotificationParams({
          structure,
          year: campaign.year,
          visibility: message.conversation.visibility,
        }),
      };
    })
  );
  return { sentCount, failedCount, abandonedCount };
};

const resolveParticipant = async (
  user: SessionUser,
  structure: StructureScope
): Promise<TarificationParticipant> => {
  assertCanAccessTarification(user, structure);
  const databaseUser = await getUserWithGrantsByEmail({ email: user.email });
  if (!databaseUser) {
    throw new DomainError("Utilisateur inconnu", 401);
  }
  return {
    id: databaseUser.id,
    level: getAuthorLevel({
      isAgent: isAgentUser(databaseUser),
      grants: getAssignedGrants(databaseUser),
    }),
  };
};

const assertCanAccessTarification = (
  user: SessionUser,
  structure: StructureScope
): void => {
  if (!canAccessTarification(user, structure)) {
    throw new DomainError(
      "Accès à la tarification de la structure refusé",
      403
    );
  }
};

const findStructureScopeOrThrow = async (structureId: number) => {
  const structure = await findStructureScope(structureId);
  if (!structure) {
    throw new DomainError("Structure introuvable", 404);
  }
  return structure;
};

export type TarificationReader = { isAgent: boolean };

export type TarificationOverview = {
  codeBhasile: string;
  participant: TarificationParticipant;
  isOperateur: boolean;
  campaignYears: number[];
  tags: ConversationTag[];
};

export type TarificationParticipant = {
  id: number;
  level: AuthorLevel;
};
