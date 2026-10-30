import {
  AuthorLevel,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
} from "@/generated/prisma/enums";
import type {
  TarificationJournal,
  TarificationJournalEvent,
} from "@/types/tarification.type";

export const OPERATEUR_USER_ID = 10;
export const AGENT_USER_ID = 20;

export const createJournal = (
  overrides: Partial<TarificationJournal> = {}
): TarificationJournal => ({
  campaignYear: 2028,
  timeZone: "Europe/Paris",
  drlPublishedAt: null,
  isCoveredByCpom: false,
  documents: [],
  events: [],
  openings: [],
  ...overrides,
});

export const addEvent = (
  journal: TarificationJournal,
  overrides: Partial<TarificationJournalEvent> &
    Pick<TarificationJournalEvent, "type" | "createdAt">
): TarificationJournalEvent => {
  const event: TarificationJournalEvent = {
    id: journal.events.length + 1,
    authorId: AGENT_USER_ID,
    authorLevel: AuthorLevel.DEPARTEMENT,
    documentId: null,
    stepCode: null,
    text: null,
    ...overrides,
  };
  journal.events.push(event);
  return event;
};

export const depositDocument = (
  journal: TarificationJournal,
  {
    types,
    at,
    status = TarificationDocumentStatus.SHARED,
    authorId = OPERATEUR_USER_ID,
    authorLevel = AuthorLevel.OPERATEUR,
  }: {
    types: TarificationDocumentType[];
    at: string;
    status?: TarificationDocumentStatus;
    authorId?: number | null;
    authorLevel?: AuthorLevel | null;
  }
): number => {
  const documentId = journal.documents.length + 1;
  journal.documents.push({ id: documentId, types, status });
  addEvent(journal, {
    type: TarificationEventType.DOCUMENT_DEPOSITED,
    documentId,
    authorId,
    authorLevel,
    createdAt: new Date(at),
  });
  return documentId;
};

export const shareAgentDocument = (
  journal: TarificationJournal,
  { types, at }: { types: TarificationDocumentType[]; at: string }
): number => {
  const documentId = depositDocument(journal, {
    types,
    at,
    status: TarificationDocumentStatus.FINAL,
    authorId: AGENT_USER_ID,
    authorLevel: AuthorLevel.DEPARTEMENT,
  });
  addEvent(journal, {
    type: TarificationEventType.DOCUMENT_SHARED,
    documentId,
    createdAt: new Date(at),
  });
  return documentId;
};

export const openDocument = (
  journal: TarificationJournal,
  documentId: number,
  at: string
): void => {
  journal.openings.push({
    documentId,
    userId: OPERATEUR_USER_ID,
    createdAt: new Date(at),
  });
};
