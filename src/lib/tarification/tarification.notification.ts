import { AuthorLevel, TarificationEventType } from "@/generated/prisma/enums";
import { TARIFICATION_EVENT_DEFINITIONS } from "@/lib/tarification/tarification.definition";
import type {
  TarificationJournal,
  TarificationJournalEvent,
} from "@/types/tarification.type";

export const isNotificationRecipient = (
  recipient: RecipientProfile,
  event: TarificationJournalEvent,
  journal: NotificationJournal,
  readEventIds: Set<number>
): boolean => {
  if (
    !TARIFICATION_EVENT_DEFINITIONS[event.type].notifies ||
    event.authorId === recipient.userId
  ) {
    return false;
  }
  switch (event.type) {
    case TarificationEventType.DOCUMENT_DEPOSITED:
      return (
        event.authorLevel === AuthorLevel.OPERATEUR &&
        recipient.isDepartementEditor
      );
    case TarificationEventType.DOCUMENT_SHARED:
      return recipient.isOperateur;
    case TarificationEventType.APPROVED:
    case TarificationEventType.CHANGES_REQUESTED:
      return (
        findDepositAuthorId(journal, event.documentId) === recipient.userId
      );
    case TarificationEventType.L48_CONTESTED:
      return recipient.isDepartementEditor || recipient.isRegionEditor;
    case TarificationEventType.DOCUMENT_WITHDRAWN:
      return (
        recipient.isOperateur &&
        hasSeenShare(recipient.userId, journal, event.documentId, readEventIds)
      );
    default:
      return false;
  }
};

// Borne la lecture aux faits qu'un profil peut recevoir ; à garder aligné sur isNotificationRecipient
export const getReceivableEventTypes = ({
  isDepartementEditor,
  isRegionEditor,
  isOperateur,
}: Omit<RecipientProfile, "userId">): TarificationEventType[] => [
  ...(isDepartementEditor ? [TarificationEventType.DOCUMENT_DEPOSITED] : []),
  ...(isDepartementEditor || isRegionEditor
    ? [
        TarificationEventType.APPROVED,
        TarificationEventType.CHANGES_REQUESTED,
        TarificationEventType.L48_CONTESTED,
      ]
    : []),
  ...(isOperateur
    ? [
        TarificationEventType.DOCUMENT_SHARED,
        TarificationEventType.DOCUMENT_WITHDRAWN,
      ]
    : []),
];

// Contexte lu par les règles, même antérieur à la borne : auteur d'une version, partage d'un document retiré,
// retrait d'un partage ; à garder aligné sur isNotificationRecipient
export const NOTIFICATION_CONTEXT_TYPES = [
  TarificationEventType.DOCUMENT_DEPOSITED,
  TarificationEventType.DOCUMENT_SHARED,
  TarificationEventType.DOCUMENT_WITHDRAWN,
];

// Un partage retiré mènerait à un document qu'on ne peut plus ouvrir : seul son retrait peut être signalé
export const isNotificationEvent = (
  recipient: RecipientProfile,
  event: TarificationJournalEvent,
  journal: NotificationJournal,
  readEventIds: Set<number>
): boolean =>
  isNotificationRecipient(recipient, event, journal, readEventIds) &&
  !(
    event.type === TarificationEventType.DOCUMENT_SHARED &&
    isWithdrawn(journal, event.documentId)
  );

const findDepositAuthorId = (
  journal: NotificationJournal,
  documentId: number | null
): number | null =>
  journal.events.find(
    (event) =>
      event.type === TarificationEventType.DOCUMENT_DEPOSITED &&
      event.documentId === documentId
  )?.authorId ?? null;

const hasSeenShare = (
  userId: number,
  journal: NotificationJournal,
  documentId: number | null,
  readEventIds: Set<number>
): boolean =>
  journal.openings.some(
    (opening) => opening.documentId === documentId && opening.userId === userId
  ) ||
  journal.events.some(
    (event) =>
      event.type === TarificationEventType.DOCUMENT_SHARED &&
      event.documentId === documentId &&
      readEventIds.has(event.id)
  );

const isWithdrawn = (
  journal: NotificationJournal,
  documentId: number | null
): boolean =>
  journal.events.some(
    (event) =>
      event.type === TarificationEventType.DOCUMENT_WITHDRAWN &&
      event.documentId === documentId
  );

export type RecipientProfile = {
  userId: number;
  isDepartementEditor: boolean;
  isRegionEditor: boolean;
  isOperateur: boolean;
};

type NotificationJournal = Pick<TarificationJournal, "events" | "openings">;
