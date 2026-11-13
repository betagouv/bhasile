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
  isOperateurDocument,
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
        file: document.fileUpload,
        typesLabel: document.types
          .map((type) => getExerciseLabel(type, journal.campaignYear))
          .join(", "),
        stateLabel: getVersionStateLabel({
          status: document.status,
          types: document.types,
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
        reviewRequestText:
          documentEvents.findLast(
            (event) => event.type === TarificationEventType.CHANGES_REQUESTED
          )?.text ?? null,
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
  const lastReview = events.filter((event) => isReviewType(event.type)).at(-1);
  return {
    creators: getParticipants(deposits),
    reviewers: getParticipants(reviews),
    hasChangesRequested:
      lastReview?.type === TarificationEventType.CHANGES_REQUESTED,
    isValidated: reviews.length > 0,
    isSigned: documents.some(
      (document) => document.status === TarificationDocumentStatus.FINAL
    ),
    isSent: documents.some((document) => sharedAtByDocumentId.has(document.id)),
    isReceived: journal.openings.some(
      (opening) =>
        documentIds.has(opening.documentId) &&
        sharedAtByDocumentId.has(opening.documentId)
    ),
  };
};

const getExerciseLabel = (
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
  types,
  isWithdrawn,
  isShared,
  reviewTypes,
}: {
  status: TarificationDocumentStatus;
  types: TarificationDocumentType[];
  isWithdrawn: boolean;
  isShared: boolean;
  reviewTypes: TarificationEventType[];
}): string => {
  if (isWithdrawn) {
    return "Retiré";
  }
  if (isOperateurDocument({ types })) {
    return "Déposé";
  }
  if (isShared) {
    return "Envoyé";
  }
  if (status === TarificationDocumentStatus.FINAL) {
    return "Signé";
  }
  const lastReviewType = reviewTypes.at(-1);
  if (lastReviewType === TarificationEventType.CHANGES_REQUESTED) {
    return "Modifications demandées";
  }
  return lastReviewType === TarificationEventType.APPROVED ? "Validé" : "Créé";
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
  file: TarificationJournalRead["documents"][number]["fileUpload"];
  typesLabel: string;
  stateLabel: string;
  date: Date | null;
  authorName: string | null;
  isShared: boolean;
  isWithdrawn: boolean;
  withdrawalReason: string | null;
  reviewRequestText: string | null;
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
};
