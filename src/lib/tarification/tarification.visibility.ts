import {
  TarificationDocumentStatus,
  TarificationEventType,
} from "@/generated/prisma/enums";
import { TARIFICATION_EVENT_DEFINITIONS } from "@/lib/tarification/tarification.definition";
import type {
  TarificationJournal,
  TarificationJournalDocument,
} from "@/types/tarification.type";

// Seul point de passage : aucune lecture du journal par l'opérateur ne le contourne
export const filterJournalForOperateur = (
  journal: TarificationJournal
): TarificationJournal => {
  const visibleDocumentIds = getOperateurVisibleDocumentIds(journal);
  const sharedDepositIds = new Set(
    journal.documents
      .filter(
        (document) => document.status === TarificationDocumentStatus.SHARED
      )
      .map((document) => document.id)
  );
  return {
    ...journal,
    documents: journal.documents.filter((document) =>
      visibleDocumentIds.has(document.id)
    ),
    events: journal.events.filter((event) => {
      const { visibility } = TARIFICATION_EVENT_DEFINITIONS[event.type];
      if (visibility === "SHARED_DEPOSIT") {
        return (
          event.documentId !== null && sharedDepositIds.has(event.documentId)
        );
      }
      if (visibility === "DOCUMENT") {
        return (
          event.documentId !== null && visibleDocumentIds.has(event.documentId)
        );
      }
      return visibility === "ALL";
    }),
    openings: journal.openings.filter((opening) =>
      visibleDocumentIds.has(opening.documentId)
    ),
  };
};

export const canOperateurOpenDocument = (
  journal: TarificationJournal,
  document: TarificationJournalDocument
): boolean =>
  getOperateurVisibleDocumentIds(journal).has(document.id) &&
  !journal.events.some(
    (event) =>
      event.type === TarificationEventType.DOCUMENT_WITHDRAWN &&
      event.documentId === document.id
  );

const getOperateurVisibleDocumentIds = (
  journal: TarificationJournal
): Set<number> => {
  const sharedDocumentIds = new Set(
    journal.events
      .filter((event) => event.type === TarificationEventType.DOCUMENT_SHARED)
      .map((event) => event.documentId)
  );
  return new Set(
    journal.documents
      .filter(
        (document) =>
          document.status === TarificationDocumentStatus.SHARED ||
          sharedDocumentIds.has(document.id)
      )
      .map((document) => document.id)
  );
};
