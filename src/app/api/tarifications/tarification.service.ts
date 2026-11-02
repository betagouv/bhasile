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
import { getAssignedGrants, isAgentUser } from "@/app/api/users/user.util";
import { DomainError } from "@/app/utils/domain-error.util";
import { getNow } from "@/app/utils/now.util";
import { isStructureAutorisee } from "@/app/utils/structure.util";
import {
  AuthorLevel,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  type TarificationEventType,
  type TarificationStepCode,
  type Visibility,
} from "@/generated/prisma/enums";
import {
  canAccessTarification,
  isAgent,
  type StructureScope,
} from "@/lib/casl";
import {
  getCampaignPhase,
  getCatchUpCampaignYears,
  getOpenCampaignYears,
} from "@/lib/tarification/tarification.campaign";
import { computeTarificationState } from "@/lib/tarification/tarification.compute";
import {
  getDepartementTimeZone,
  toCivilDate,
} from "@/lib/tarification/tarification.date";
import {
  assertCanDepositDocument,
  assertCanRecordEvent,
} from "@/lib/tarification/tarification.guard";
import {
  canOperateurOpenDocument,
  filterJournalForOperateur,
} from "@/lib/tarification/tarification.visibility";
import type { ConversationTag } from "@/types/conversation.type";
import { SessionUser } from "@/types/global";
import type { PrismaTransaction } from "@/types/prisma.type";
import type {
  TarificationJournalEvent,
  TarificationJournalRead,
  TarificationJournalView,
} from "@/types/tarification.type";

import { TARIFICATION_CONVERSATION_TAGS } from "./tarification.constants";
import {
  createTarificationDocument,
  createTarificationDocumentOpening,
  createTarificationEvent,
  findMessageTarification,
  findPendingMessageContexts,
  findStructureScope,
  findStructureTarification,
  findStructureTarificationCampaigns,
  findStructureTarificationJournal,
  findTarificationCampaign,
  runInTarificationTransaction,
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
  const isEligible = isStructureAutorisee(structure.type);
  const isOperateur = participant.level === AuthorLevel.OPERATEUR;
  const timeZone = getDepartementTimeZone(structure.departementAdministratif);
  const openCampaignYears = isEligible
    ? getOpenCampaignYears(getNow(), timeZone)
    : [];
  return {
    codeBhasile: structure.codeBhasile,
    participant,
    isOperateur,
    openCampaignYears,
    campaignYears: getSelectableCampaignYears({
      openCampaignYears,
      catchUpCampaignYears:
        isEligible && !isOperateur
          ? getCatchUpCampaignYears(getNow(), timeZone)
          : [],
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
  const { journal, drlUrl } = await loadTarificationJournal(structureId, year);
  return {
    journal: reader.isAgent ? journal : filterJournalForOperateur(journal),
    state: computeTarificationState(journal, getNow()),
    drlUrl,
  };
};

export const depositTarificationDocument = async ({
  structureId,
  year,
  author,
  fileKey,
  types,
  status,
}: {
  structureId: number;
  year: number;
  author: TarificationParticipant;
  fileKey: string;
  types: TarificationDocumentType[];
  status: TarificationDocumentStatus;
}): Promise<{ id: number }> => {
  const structure = await findStructureScopeOrThrow(structureId);
  assertStructureEligible(structure);
  return runInTarificationTransaction(
    structureId,
    year,
    async (tx, structureTarificationId) => {
      const { journal } = await loadTarificationJournal(structureId, year, tx);
      const now = getNow();
      assertCanDepositDocument({
        journal,
        authorLevel: author.level,
        types,
        status,
        phase: getCampaignPhase(year, now, journal.timeZone),
        now,
      });
      return createTarificationDocument(tx, {
        structureTarificationId,
        fileKey,
        types,
        status,
        author,
      });
    }
  );
};

export const recordTarificationEvent = async ({
  structureId,
  year,
  author,
  type,
  documentId,
  stepCode,
  text,
}: {
  structureId: number;
  year: number;
  author: TarificationParticipant;
  type: TarificationEventType;
  documentId: number | null;
  stepCode: TarificationStepCode | null;
  text: string | null;
}): Promise<{ id: number }> => {
  const structure = await findStructureScopeOrThrow(structureId);
  assertStructureEligible(structure);
  const event: Omit<TarificationJournalEvent, "id" | "createdAt"> = {
    type,
    authorId: author.id,
    authorLevel: author.level,
    documentId,
    stepCode,
    text,
  };
  return runInTarificationTransaction(
    structureId,
    year,
    async (tx, structureTarificationId) => {
      const { journal } = await loadTarificationJournal(structureId, year, tx);
      const now = getNow();
      assertCanRecordEvent({
        journal,
        event,
        phase: getCampaignPhase(year, now, journal.timeZone),
        now,
      });
      return createTarificationEvent(tx, structureTarificationId, event);
    }
  );
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
  const isOperateurDeposit =
    journalDocument.status === TarificationDocumentStatus.SHARED;
  return isOperateurDeposit
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

const loadTarificationJournal = async (
  structureId: number,
  year: number,
  db?: PrismaTransaction
): Promise<{ journal: TarificationJournalRead; drlUrl: string | null }> => {
  const structure = await findStructureTarificationJournal(
    structureId,
    year,
    db
  );
  const campaign = await findTarificationCampaign(year, db);
  if (!structure) {
    throw new DomainError("Structure introuvable", 404);
  }
  const [tarification] = structure.structureTarifications;
  return {
    journal: {
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
    },
    drlUrl: campaign?.drlUrl ?? null,
  };
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

export type PendingTarificationOpening = {
  documentId: number;
  userId: number;
};

export type TarificationOverview = {
  codeBhasile: string;
  participant: TarificationParticipant;
  isOperateur: boolean;
  openCampaignYears: number[];
  campaignYears: number[];
  tags: ConversationTag[];
};

export type TarificationParticipant = {
  id: number;
  level: AuthorLevel;
};
