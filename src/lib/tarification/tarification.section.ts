import {
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";
import {
  getActiveDocuments,
  getSharedAtByDocumentId,
} from "@/lib/tarification/tarification.compute";
import {
  TARIFICATION_DOCUMENT_TYPE_DEFINITIONS,
  TARIFICATION_SECTION_DEFINITIONS,
  type TarificationSectionCode,
} from "@/lib/tarification/tarification.definition";
import type {
  TarificationJournalRead,
  TarificationState,
} from "@/types/tarification.type";

export const getSectionLabel = (
  code: TarificationSectionCode,
  year: number
): string => {
  const { label } = TARIFICATION_SECTION_DEFINITIONS[code];
  if (code === "CA") {
    return `${label} ${year + TARIFICATION_DOCUMENT_TYPE_DEFINITIONS.CA.exerciseOffset}`;
  }
  if (code === "BP") {
    return `${label} ${year}`;
  }
  if (code === "DAI") {
    return `${label} ${year} (issue de l'arrêté ${year - 1})`;
  }
  return label;
};

export const getSectionSubtitle = (
  code: TarificationSectionCode
): string | undefined => TARIFICATION_SECTION_DEFINITIONS[code].subtitle;

export const parseSectionCode = (
  value: string | undefined
): TarificationSectionCode | null =>
  value && Object.hasOwn(TARIFICATION_SECTION_DEFINITIONS, value)
    ? (value as TarificationSectionCode)
    : null;

export const getDefaultSectionCode = (
  state: TarificationState
): TarificationSectionCode =>
  state.steps.find((step) => step.status === "EXPECTED")?.code ??
  state.steps.find((step) => step.status === "UPCOMING")?.code ??
  TarificationStepCode.RCA;

// De la plus récente à la plus ancienne. Pour l'opérateur, le dépôt d'une version des agents est absent du journal :
// la date affichée est alors celle de son partage
export const getSectionVersions = (
  journal: TarificationJournalRead,
  code: TarificationSectionCode
): SectionVersion[] => {
  const sharedAtByDocumentId = getSharedAtByDocumentId(journal);
  const activeDocumentIds = new Set(
    getActiveDocuments(journal).map((document) => document.id)
  );
  return journal.documents
    .filter((document) =>
      document.types.some((type) =>
        TARIFICATION_SECTION_DEFINITIONS[code].types.includes(type)
      )
    )
    .map((document) => {
      const documentEvents = journal.events.filter(
        (event) => event.documentId === document.id
      );
      const firstEvent = documentEvents[0];
      const withdrawal = documentEvents.find(
        (event) => event.type === TarificationEventType.DOCUMENT_WITHDRAWN
      );
      return {
        id: document.id,
        types: document.types,
        file: document.fileUpload,
        typesLabel: document.types
          .map((type) => getExerciseLabel(type, journal.campaignYear))
          .join(", "),
        stateLabel: getVersionStateLabel({
          status: document.status,
          isWithdrawn: !activeDocumentIds.has(document.id),
          isShared: sharedAtByDocumentId.has(document.id),
          reviewTypes: documentEvents
            .map((event) => event.type)
            .filter(isReviewType),
        }),
        date: firstEvent?.createdAt ?? null,
        authorName: firstEvent?.author?.name ?? null,
        isShared: sharedAtByDocumentId.has(document.id),
        isWithdrawn: !activeDocumentIds.has(document.id),
        withdrawalReason: withdrawal?.text ?? null,
        changesRequests: getChangesRequests(documentEvents),
      };
    })
    .reverse();
};

export const computeStepProgress = (
  journal: TarificationJournalRead,
  code: TarificationStepCode
): StepProgress => {
  const sharedAtByDocumentId = getSharedAtByDocumentId(journal);
  const documents = getActiveDocuments(journal).filter((document) =>
    document.types.some(
      (type) =>
        TARIFICATION_SECTION_DEFINITIONS[code].types.includes(type) &&
        TARIFICATION_DOCUMENT_TYPE_DEFINITIONS[type].emitter !== "OPERATEUR"
    )
  );
  const documentIds = new Set(documents.map((document) => document.id));
  const events = journal.events.filter(
    (event) => event.documentId !== null && documentIds.has(event.documentId)
  );
  const deposits = events.filter(
    (event) => event.type === TarificationEventType.DOCUMENT_DEPOSITED
  );
  const reviews = events.filter(
    (event) => event.type === TarificationEventType.APPROVED
  );
  const latestDocument = documents.at(-1);
  const signedDocumentIds = new Set(
    documents
      .filter(
        (document) => document.status === TarificationDocumentStatus.FINAL
      )
      .map((document) => document.id)
  );
  const sentDates = documents.flatMap((document) =>
    sharedAtByDocumentId.get(document.id) ?? []
  );
  const receptions = journal.openings.filter(
    (opening) =>
      documentIds.has(opening.documentId) &&
      sharedAtByDocumentId.has(opening.documentId)
  );
  return {
    creators: getParticipants(deposits),
    reviewers: getParticipants(reviews),
    hasChangesRequested: events.some(
      (event) =>
        event.type === TarificationEventType.CHANGES_REQUESTED &&
        event.documentId === latestDocument?.id
    ),
    isValidated: reviews.length > 0,
    isSigned: documents.some(
      (document) => document.status === TarificationDocumentStatus.FINAL
    ),
    isSent: documents.some((document) => sharedAtByDocumentId.has(document.id)),
    isReceived: receptions.length > 0,
    createdAt: deposits[0]?.createdAt ?? null,
    validatedAt: reviews[0]?.createdAt ?? null,
    signedAt:
      deposits.find(
        (deposit) =>
          deposit.documentId !== null &&
          signedDocumentIds.has(deposit.documentId)
      )?.createdAt ?? null,
    sentAt: getEarliestDate(sentDates),
    receivedAt: getEarliestDate(receptions.map(({ createdAt }) => createdAt)),
  };
};

// Une demande reste affichée sur sa version : y répondre, c'est déposer une nouvelle version
const getChangesRequests = (
  documentEvents: TarificationJournalRead["events"]
): ChangesRequest[] =>
  documentEvents
    .filter((event) => event.type === TarificationEventType.CHANGES_REQUESTED)
    .map(({ id, text, author }) => ({
      id,
      text,
      authorName: author?.name ?? null,
    }));

const getEarliestDate = (dates: Date[]): Date | null =>
  dates.reduce<Date | null>(
    (earliest, date) => (!earliest || date < earliest ? date : earliest),
    null
  );

export const getExerciseLabel = (
  type: TarificationDocumentType,
  campaignYear: number
): string => {
  const { label, exerciseOffset } =
    TARIFICATION_DOCUMENT_TYPE_DEFINITIONS[type];
  return `${label} ${campaignYear + exerciseOffset}`;
};

const isReviewType = (type: TarificationEventType): boolean =>
  type === TarificationEventType.APPROVED ||
  type === TarificationEventType.CHANGES_REQUESTED;

const getVersionStateLabel = ({
  status,
  isWithdrawn,
  isShared,
  reviewTypes,
}: {
  status: TarificationDocumentStatus;
  isWithdrawn: boolean;
  isShared: boolean;
  reviewTypes: TarificationEventType[];
}): string => {
  if (isWithdrawn) {
    return "Retiré";
  }
  if (status === TarificationDocumentStatus.SHARED) {
    return "Déposé";
  }
  if (isShared) {
    return "Envoyé";
  }
  if (status === TarificationDocumentStatus.FINAL) {
    return "Signé";
  }
  if (reviewTypes.includes(TarificationEventType.CHANGES_REQUESTED)) {
    return "Modifications demandées";
  }
  return reviewTypes.includes(TarificationEventType.APPROVED)
    ? "Validé"
    : "Créé";
};

const getParticipants = (
  events: TarificationJournalRead["events"]
): StepParticipant[] => {
  const participantsById = new Map<number, StepParticipant>();
  for (const event of events) {
    if (event.authorId !== null && event.authorLevel !== null) {
      participantsById.set(event.authorId, {
        name: event.author?.name ?? "Utilisateur",
        level: event.authorLevel,
      });
    }
  }
  return [...participantsById.values()];
};

export type SectionVersion = {
  id: number;
  types: TarificationDocumentType[];
  file: TarificationJournalRead["documents"][number]["fileUpload"];
  typesLabel: string;
  stateLabel: string;
  date: Date | null;
  authorName: string | null;
  isShared: boolean;
  isWithdrawn: boolean;
  withdrawalReason: string | null;
  changesRequests: ChangesRequest[];
};

type ChangesRequest = {
  id: number;
  text: string | null;
  authorName: string | null;
};

export type StepParticipant = {
  name: string;
  level: NonNullable<TarificationJournalRead["events"][number]["authorLevel"]>;
};

export type StepProgress = {
  creators: StepParticipant[];
  reviewers: StepParticipant[];
  hasChangesRequested: boolean;
  isValidated: boolean;
  isSigned: boolean;
  isSent: boolean;
  isReceived: boolean;
  createdAt: Date | null;
  validatedAt: Date | null;
  signedAt: Date | null;
  sentAt: Date | null;
  receivedAt: Date | null;
};
