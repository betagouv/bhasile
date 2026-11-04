import { type TarificationEventType } from "@/generated/prisma/enums";
import { TARIFICATION_STEP_DEFINITIONS } from "@/lib/tarification/tarification.definition";
import { getExerciseLabel } from "@/lib/tarification/tarification.section";
import type { ConversationAnchor } from "@/types/conversation.type";
import type {
  TarificationJournal,
  TarificationJournalDocument,
  TarificationJournalEvent,
} from "@/types/tarification.type";

export const buildConversationAnchors = (
  journal: TarificationJournal
): ConversationAnchor[] => {
  const getDocumentLabel = (documentId: number | null): string | null => {
    const document = journal.documents.find(({ id }) => id === documentId);
    return document ? getTypesLabel(document, journal.campaignYear) : null;
  };
  return [
    ...journal.events.map((event) => ({
      id: `event-${event.id}`,
      label: getEventLabel(event, getDocumentLabel(event.documentId)),
      date: event.createdAt,
    })),
    ...journal.openings.map((opening) => ({
      id: `opening-${opening.documentId}-${opening.userId}`,
      label: `Ouverture : ${getDocumentLabel(opening.documentId)}`,
      date: opening.createdAt,
    })),
  ].sort((first, second) => first.date.getTime() - second.date.getTime());
};

const getTypesLabel = (
  document: TarificationJournalDocument,
  campaignYear: number
): string =>
  document.types.map((type) => getExerciseLabel(type, campaignYear)).join(", ");

const getEventLabel = (
  event: TarificationJournalEvent,
  documentLabel: string | null
): string => {
  const label = EVENT_LABELS[event.type];
  if (event.type === "L48_ACCEPTED" || event.type === "L48_CONTESTED") {
    return label;
  }
  const detail =
    documentLabel ??
    (event.stepCode && TARIFICATION_STEP_DEFINITIONS[event.stepCode].label);
  return detail ? `${label} : ${detail}` : label;
};

const EVENT_LABELS: Record<TarificationEventType, string> = {
  DOCUMENT_DEPOSITED: "Dépôt",
  DOCUMENT_SHARED: "Envoi",
  APPROVED: "Relecture",
  CHANGES_REQUESTED: "Modifications demandées",
  DOCUMENT_WITHDRAWN: "Retrait",
  STEP_MARKED_NOT_APPLICABLE: "Sans objet",
  L48_ACCEPTED: "L48 acceptée",
  L48_CONTESTED: "L48 contestée",
  OUT_OF_APP_DECLARED: "Déclarée hors Bhasile",
};
