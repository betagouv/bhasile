import type { MessageDb } from "@/app/api/conversations/conversation.db.type";
import {
  abandonStaleNotifications,
  changeMessageTag,
  getMessages,
  getUnreadMessageCounts,
  markMessagesAsRead,
  postMessage,
  sendMessageDigests,
} from "@/app/api/conversations/conversation.service";
import {
  assertCanPostMessage,
  getAuthorLevel,
} from "@/app/api/conversations/conversation.util";
import { copyStoredFile } from "@/app/api/files/file.service";
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
import {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationDocumentType,
  TarificationEventType,
  type TarificationStepCode,
  type Visibility,
} from "@/generated/prisma/enums";
import {
  canAccessTarification,
  canParticipateInTarification,
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
  computeFicheCopies,
  computeFicheCopyChanges,
  getDeletableFicheCopies,
} from "@/lib/tarification/tarification.fiche";
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
import type {
  FicheCopy,
  TarificationJournalEvent,
  TarificationJournalRead,
  TarificationJournalView,
} from "@/types/tarification.type";

import { TARIFICATION_CONVERSATION_TAGS } from "./tarification.constants";
import {
  findFicheCopies,
  findMessageTarification,
  findPendingMessageContexts,
  findStructureScope,
  findStructureTarification,
  findStructureTarificationCampaigns,
  findStructureTarificationJournal,
  findTarificationCampaign,
  runInTarificationTransaction,
  type TarificationJournalSource,
  type TarificationTransaction,
  upsertStructureTarification,
} from "./tarification.repository";
import {
  assertCampaignOpen,
  assertStructureEligible,
  buildNotificationParams,
  getMessageRecipients,
  getSelectableCampaignYears,
} from "./tarification.util";
import { createTarificationDocumentOpening } from "./tarification-document.repository";

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
    canParticipate: canParticipateInTarification(user),
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

export const getTarificationUnreadCounts = async ({
  structureId,
  year,
  overview: { participant, isOperateur, canParticipate },
}: {
  structureId: number;
  year: number;
  overview: Pick<
    TarificationOverview,
    "participant" | "isOperateur" | "canParticipate"
  >;
}): Promise<Record<Visibility, number>> => {
  // Un superadmin ne laisse pas d'accusé : tout lui paraîtrait non lu
  const tarification = canParticipate
    ? await findStructureTarification(structureId, year)
    : null;
  if (!tarification) {
    return { SHARED: 0, AGENTS: 0 };
  }
  return getUnreadMessageCounts({
    structureTarificationId: tarification.id,
    userId: participant.id,
    isAgentReader: !isOperateur,
  });
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
  const { journal, drlUrl } = await loadTarificationJournal(
    year,
    getJournalSource(structureId, year)
  );
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
  const document = await runInTarificationTransaction(
    structureId,
    year,
    (transaction) =>
      createDocumentInTransaction(transaction, year, {
        fileKey,
        types,
        status,
        author,
      })
  );
  if (status === TarificationDocumentStatus.SHARED) {
    await trySyncFicheCopies(structureId, year);
  }
  return document;
};

export const recordTarificationEvent = async ({
  structureId,
  year,
  author,
  type,
  documentId,
  fileKey = null,
  stepCode,
  text,
}: {
  structureId: number;
  year: number;
  author: TarificationParticipant;
  type: TarificationEventType;
  documentId: number | null;
  fileKey?: string | null;
  stepCode: TarificationStepCode | null;
  text: string | null;
}): Promise<{ id: number }> => {
  const structure = await findStructureScopeOrThrow(structureId);
  assertStructureEligible(structure);
  const createdEvent = await runInTarificationTransaction(
    structureId,
    year,
    async (transaction) => {
      const responseDocument = fileKey
        ? await createDocumentInTransaction(transaction, year, {
            fileKey,
            types: [TarificationDocumentType.REPONSE_CONTRADICTOIRE],
            status: TarificationDocumentStatus.SHARED,
            author,
          })
        : null;
      const event: Omit<TarificationJournalEvent, "id" | "createdAt"> = {
        type,
        authorId: author.id,
        authorLevel: author.level,
        documentId: responseDocument?.id ?? documentId,
        stepCode,
        text,
      };
      const { journal } = await loadTarificationJournal(year, transaction);
      const now = getNow();
      assertCanRecordEvent({
        journal,
        event,
        phase: getCampaignPhase(year, now, journal.timeZone),
        now,
      });
      return transaction.createEvent(event);
    }
  );
  if (
    type === TarificationEventType.DOCUMENT_SHARED ||
    type === TarificationEventType.DOCUMENT_WITHDRAWN
  ) {
    await trySyncFicheCopies(structureId, year);
  }
  return createdEvent;
};

// Les copies S3 se font hors transaction, pour ne pas tenir le verrou pendant un appel réseau : l'état voulu
// est recalculé sous verrou, et un objet copié pour rien reste orphelin
export const syncFicheCopies = async (
  structureId: number,
  year: number
): Promise<void> => {
  const { journal } = await loadTarificationJournal(
    year,
    getJournalSource(structureId, year)
  );
  const { copiesToCreate, copiesToDelete } = computeFicheCopyChanges(
    computeFicheCopies(journal),
    await findFicheCopies(structureId, year)
  );
  if (copiesToCreate.length === 0 && copiesToDelete.length === 0) {
    return;
  }
  const storedKeys = await storeFicheCopies(journal, copiesToCreate);
  const structure = await findStructureScopeOrThrow(structureId);

  await runInTarificationTransaction(structureId, year, async (transaction) => {
    const { journal: lockedJournal } = await loadTarificationJournal(
      year,
      transaction
    );
    const changes = computeFicheCopyChanges(
      computeFicheCopies(lockedJournal),
      await transaction.findFicheCopies()
    );
    const deletableCopies = getDeletableFicheCopies(lockedJournal, {
      copiesToDelete: changes.copiesToDelete,
      copiesWithoutFile: changes.copiesToCreate.filter(
        (copy) => !storedKeys.has(getFicheCopyKey(copy))
      ),
    });
    for (const copy of deletableCopies) {
      await transaction.deleteFicheCopy(copy);
    }
    for (const copy of changes.copiesToCreate) {
      const key = storedKeys.get(getFicheCopyKey(copy));
      if (key) {
        await transaction.createFicheCopy({
          copy,
          structureType: structure.type,
          file: { ...findJournalDocument(lockedJournal, copy).fileUpload, key },
        });
      }
    }
  });
};

// Une copie qui échoue ne bloque pas le reste : voir getDeletableFicheCopies
const storeFicheCopies = async (
  journal: TarificationJournalRead,
  copies: FicheCopy[]
): Promise<Map<string, string>> => {
  const storedKeys = new Map<string, string>();
  for (const copy of copies) {
    const { fileUpload } = findJournalDocument(journal, copy);
    try {
      storedKeys.set(
        getFicheCopyKey(copy),
        await copyStoredFile(
          process.env.S3_BUCKET_NAME!,
          fileUpload.key,
          fileUpload.originalName
        )
      );
    } catch (error) {
      console.error(`Copie du document ${copy.documentId} impossible`, error);
    }
  }
  return storedKeys;
};

const getFicheCopyKey = ({ documentId, category }: FicheCopy): string =>
  `${documentId}-${category}`;

const findJournalDocument = (
  journal: TarificationJournalRead,
  { documentId }: FicheCopy
) => journal.documents.find((document) => document.id === documentId)!;

const getJournalSource = (
  structureId: number,
  year: number
): TarificationJournalSource => ({
  findJournal: () => findStructureTarificationJournal(structureId, year),
  findCampaign: () => findTarificationCampaign(year),
});

// Le fait est déjà écrit : une panne de la copie ne doit pas le faire passer pour un échec. Le prochain dépôt,
// partage ou retrait rattrape la fiche
const trySyncFicheCopies = async (
  structureId: number,
  year: number
): Promise<void> => {
  try {
    await syncFicheCopies(structureId, year);
  } catch (error) {
    console.error(
      `Copie vers la fiche impossible (structure ${structureId}, campagne ${year})`,
      error
    );
  }
};

const createDocumentInTransaction = async (
  transaction: TarificationTransaction,
  year: number,
  {
    fileKey,
    types,
    status,
    author,
  }: {
    fileKey: string;
    types: TarificationDocumentType[];
    status: TarificationDocumentStatus;
    author: TarificationParticipant;
  }
): Promise<{ id: number }> => {
  const { journal } = await loadTarificationJournal(year, transaction);
  const now = getNow();
  assertCanDepositDocument({
    journal,
    authorLevel: author.level,
    types,
    status,
    phase: getCampaignPhase(year, now, journal.timeZone),
    now,
  });
  const file = await transaction.findUnattachedFile(fileKey);
  if (!file) {
    throw new DomainError("Ce fichier est introuvable ou déjà rattaché", 422);
  }
  const document = await transaction.createDocument({
    fileUploadId: file.id,
    types,
    status,
  });
  await transaction.createEvent({
    type: TarificationEventType.DOCUMENT_DEPOSITED,
    authorId: author.id,
    authorLevel: author.level,
    documentId: document.id,
    stepCode: null,
    text: null,
  });
  return document;
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

const loadTarificationJournal = async (
  year: number,
  { findJournal, findCampaign }: TarificationJournalSource
): Promise<{ journal: TarificationJournalRead; drlUrl: string | null }> => {
  const structure = await findJournal();
  const campaign = await findCampaign();
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
