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
import { isStructureInCpom } from "@/app/api/structures/structure.util";
import {
  findUsersWithGrantsOnStructure,
  getUserWithGrantsByEmail,
} from "@/app/api/users/user.repository";
import {
  getAssignedGrants,
  isAgentUser,
  normalizeEmail,
} from "@/app/api/users/user.util";
import { getDepartementTimeZone, toCivilDate } from "@/app/utils/date.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { getNow } from "@/app/utils/now.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import { AuthorLevel, type Visibility } from "@/generated/prisma/enums";
import {
  canAccessTarification,
  canParticipateInTarification,
  isAgent,
  type StructureScope,
} from "@/lib/casl";
import { getOpenCampaignYears } from "@/lib/tarification/tarification.campaign";
import { computeTarificationState } from "@/lib/tarification/tarification.compute";
import { isOperateurDocument } from "@/lib/tarification/tarification.definition";
import {
  canOperateurOpenDocument,
  filterJournalForOperateur,
} from "@/lib/tarification/tarification.visibility";
import type { ConversationTag } from "@/types/conversation.type";
import { SessionUser } from "@/types/global";
import type {
  TarificationJournalRead,
  TarificationJournalView,
} from "@/types/tarification.type";

import { TARIFICATION_CONVERSATION_TAGS } from "./tarification.constants";
import {
  createTarificationDocumentOpening,
  findMessageTarification,
  findPendingMessageContexts,
  findStructureScope,
  findStructureTarification,
  findStructureTarificationCampaigns,
  findStructureTarificationJournal,
  findTarificationCampaign,
  upsertStructureTarification,
} from "./tarification.repository";
import {
  assertCampaignOpen,
  assertStructureEligible,
  buildNotificationParams,
  getMessageRecipients,
  getSelectableCampaignYears,
} from "./tarification.util";

export const getTarificationParticipant = async (
  user: SessionUser,
  structureId: number
): Promise<TarificationParticipant> => {
  assertCanParticipateInTarification(user);
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
  const openCampaignYears = isStructureAutorisee(structure.type)
    ? getOpenCampaignYears(
        getNow(),
        getDepartementTimeZone(structure.departementAdministratif)
      )
    : [];
  return {
    codeBhasile: structure.codeBhasile,
    participant,
    isOperateur: participant.level === AuthorLevel.OPERATEUR,
    canParticipate: canParticipateInTarification(user),
    openCampaignYears,
    campaignYears: getSelectableCampaignYears({
      openCampaignYears,
      tarificationYears: tarifications.map(
        (tarification) => tarification.campaign.year
      ),
    }),
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
  const structure = await findStructureScopeOrThrow(structureId);
  assertStructureEligible(structure);
  assertCampaignOpen(year, structure);
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
  assertCanParticipateInTarification(user);
  const message = await findMessageTarification(messageId);
  if (!message) {
    throw new DomainError("Message introuvable", 404);
  }
  const { structure, campaign } = message.conversation.structureTarification;
  const editor = await resolveParticipant(user, structure);
  assertStructureEligible(structure);
  assertCampaignOpen(campaign.year, structure);
  return changeMessageTag(
    { messageId, tagKey, editorLevel: editor.level },
    TARIFICATION_CONVERSATION_TAGS
  );
};

// Seul point de passage pour lire le journal : page, API, fichiers et mails
export const getTarificationJournal = async ({
  structureId,
  year,
  reader,
}: {
  structureId: number;
  year: number;
  reader: TarificationReader;
}): Promise<TarificationJournalView> => {
  const [structure, campaign] = await Promise.all([
    findStructureTarificationJournal(structureId, year),
    findTarificationCampaign(year),
  ]);
  if (!structure) {
    throw new DomainError("Structure introuvable", 404);
  }
  const [tarification] = structure.structureTarifications;
  const journal: TarificationJournalRead = {
    campaignYear: year,
    timeZone: getDepartementTimeZone(structure.departementAdministratif),
    drlPublishedAt: campaign?.drlPublishedAt
      ? toCivilDate(campaign.drlPublishedAt)
      : null,
    isCoveredByCpom: isStructureInCpom(structure, year),
    documents:
      tarification?.documents.map(({ id, types, status, fileUpload }) => ({
        id,
        types,
        status,
        fileUpload,
      })) ?? [],
    events: tarification?.events ?? [],
    openings:
      tarification?.documents.flatMap((document) => document.openings) ?? [],
  };
  return {
    journal: reader.isAgent ? journal : filterJournalForOperateur(journal),
    state: computeTarificationState(journal, getNow()),
    drlUrl: campaign?.drlUrl ?? null,
  };
};

export const authorizeTarificationDocument = async ({
  user,
  document,
}: {
  user: SessionUser;
  document: {
    id: number;
    structureTarification: { structureId: number; campaign: { year: number } };
  };
}): Promise<PendingTarificationOpening | null> => {
  const {
    structureId,
    campaign: { year },
  } = document.structureTarification;
  const participant = await getTarificationParticipant(user, structureId);
  if (participant.level !== AuthorLevel.OPERATEUR) {
    return null;
  }
  const { journal } = await getTarificationJournal({
    structureId,
    year,
    reader: { isAgent: false },
  });
  const journalDocument = journal.documents.find(
    (candidate) => candidate.id === document.id
  );
  if (!journalDocument || !canOperateurOpenDocument(journal, journalDocument)) {
    throw new DomainError("Aucun fichier trouvé", 404);
  }
  return isOperateurDocument(journalDocument)
    ? null
    : { documentId: document.id, userId: participant.id };
};

export const recordTarificationDocumentOpening = async ({
  documentId,
  userId,
}: PendingTarificationOpening): Promise<void> => {
  await createTarificationDocumentOpening(documentId, userId);
};

export const notifyPendingTarificationMessages = async (): Promise<{
  sentCount: number;
  failedCount: number;
  abandonedCount: number;
}> => {
  const abandonedCount = await abandonStaleNotifications();
  const notifications = await findPendingMessageContexts();
  const structuresById = new Map(
    notifications.map(({ message: { conversation } }) => [
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
    notifications.map(({ id: notificationId, message }) => {
      const { structure, campaign } =
        message.conversation.structureTarification;
      return {
        notificationId,
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
  const databaseUser = await getUserWithGrantsByEmail({
    email: normalizeEmail(user.email),
  });
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

const assertCanParticipateInTarification = (user: SessionUser): void => {
  if (!canParticipateInTarification(user)) {
    throw new DomainError(
      "Les superadmins consultent les échanges sans y participer",
      403
    );
  }
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

export type PendingTarificationOpening = {
  documentId: number;
  userId: number;
};

export type TarificationOverview = {
  codeBhasile: string;
  participant: TarificationParticipant;
  isOperateur: boolean;
  canParticipate: boolean;
  openCampaignYears: number[];
  campaignYears: number[];
  tags: ConversationTag[];
};

export type TarificationParticipant = {
  id: number;
  level: AuthorLevel;
};
