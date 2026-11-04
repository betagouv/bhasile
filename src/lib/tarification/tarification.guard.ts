import { DomainError } from "@/app/utils/domain-error.util";
import {
  AuthorLevel,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
} from "@/generated/prisma/enums";
import {
  computeTarificationState,
  getActiveDocuments,
  getSharedAtByDocumentId,
} from "@/lib/tarification/tarification.compute";
import { TARIFICATION_DOCUMENT_TYPE_DEFINITIONS } from "@/lib/tarification/tarification.definition";
import { isEventShapeValid } from "@/lib/tarification/tarification.event";
import type {
  CampaignPhase,
  TarificationJournal,
  TarificationJournalDocument,
  TarificationJournalEvent,
} from "@/types/tarification.type";

export const assertCanDepositDocument = ({
  journal,
  authorLevel,
  types,
  status,
  phase,
  now,
}: {
  journal: TarificationJournal;
  authorLevel: AuthorLevel;
  types: TarificationDocumentType[];
  status: TarificationDocumentStatus;
  phase: CampaignPhase;
  now: Date;
}): void => {
  const isOperateur = authorLevel === AuthorLevel.OPERATEUR;
  const emitters = types.map(
    (type) => TARIFICATION_DOCUMENT_TYPE_DEFINITIONS[type].emitter
  );
  const hasOperateurType = emitters.includes("OPERATEUR");
  const hasAgentType = emitters.includes("AGENT");

  if (
    phase === "UPCOMING" ||
    (phase === "CATCH_UP" && (isOperateur || !isCatchUpAllowed(types)))
  ) {
    throw new DomainError("Ce dépôt n'est pas ouvert sur cette campagne", 409);
  }
  if (hasOperateurType && hasAgentType) {
    throw new DomainError(
      "Un document ne mêle pas des types de l'opérateur et des types des agents",
      422
    );
  }
  if (isOperateur && hasAgentType) {
    throw new DomainError("Ce type de document est déposé par les agents", 403);
  }
  if (!isOperateur && types.includes("REPONSE_CONTRADICTOIRE")) {
    throw new DomainError(
      "La réponse au contradictoire est déposée par l'opérateur",
      403
    );
  }
  if (!getDepositStatuses({ isOperateur, hasOperateurType }).includes(status)) {
    throw new DomainError("Cet état n'est pas possible pour ce dépôt", 422);
  }
  if (types.includes("REPONSE_CONTRADICTOIRE")) {
    assertContradictoireOpen(journal, now);
  }
};

export const assertCanRecordEvent = ({
  journal,
  event,
  phase,
  now,
}: {
  journal: TarificationJournal;
  event: Omit<TarificationJournalEvent, "id" | "createdAt">;
  phase: CampaignPhase;
  now: Date;
}): void => {
  if (!isEventShapeValid(event)) {
    throw new DomainError("Ce fait n'est pas valide pour cet auteur", 422);
  }
  const document = findEventDocument(journal, event);
  assertEventOpenInPhase({ event, document, phase });

  switch (event.type) {
    case TarificationEventType.DOCUMENT_SHARED:
      assertCanShare(journal, document!, now);
      break;
    case TarificationEventType.APPROVED:
    case TarificationEventType.CHANGES_REQUESTED:
      assertCanReview(journal, document!, event.authorId);
      break;
    case TarificationEventType.DOCUMENT_WITHDRAWN:
      assertCanWithdraw(journal, document!);
      break;
    case TarificationEventType.STEP_MARKED_NOT_APPLICABLE:
      assertStepPending(journal, event, now);
      break;
    case TarificationEventType.L48_ACCEPTED:
    case TarificationEventType.L48_CONTESTED:
      assertContradictoireOpen(journal, now);
      assertIsResponseDocument(journal, document);
      break;
    case TarificationEventType.OUT_OF_APP_DECLARED:
      assertNotOutOfBhasile(journal, now);
      break;
  }
};

const isCatchUpAllowed = (types: TarificationDocumentType[]): boolean =>
  types.every(
    (type) => TARIFICATION_DOCUMENT_TYPE_DEFINITIONS[type].isCatchUpAllowed
  );

// Un agent qui dépose à la place de l'opérateur le partage d'office : pas de brouillon qui compterait comme un dépôt
const getDepositStatuses = ({
  isOperateur,
  hasOperateurType,
}: {
  isOperateur: boolean;
  hasOperateurType: boolean;
}): TarificationDocumentStatus[] =>
  isOperateur || hasOperateurType
    ? [TarificationDocumentStatus.SHARED]
    : [TarificationDocumentStatus.DRAFT, TarificationDocumentStatus.FINAL];

const findEventDocument = (
  journal: TarificationJournal,
  event: Pick<TarificationJournalEvent, "documentId">
): TarificationJournalDocument | null => {
  if (event.documentId === null) {
    return null;
  }
  const document = journal.documents.find(
    (candidate) => candidate.id === event.documentId
  );
  if (!document) {
    throw new DomainError("Document introuvable", 404);
  }
  return document;
};

// Rattrapage : seul un agent peut encore partager, ou retirer s'il s'est trompé, un document de fin de campagne
const assertEventOpenInPhase = ({
  event,
  document,
  phase,
}: {
  event: Pick<TarificationJournalEvent, "type">;
  document: TarificationJournalDocument | null;
  phase: CampaignPhase;
}): void => {
  if (phase === "OPEN") {
    return;
  }
  const isCatchUpEvent =
    phase === "CATCH_UP" &&
    document !== null &&
    (event.type === TarificationEventType.DOCUMENT_SHARED ||
      event.type === TarificationEventType.DOCUMENT_WITHDRAWN) &&
    isCatchUpAllowed(document.types);
  if (!isCatchUpEvent) {
    throw new DomainError("Ce fait n'est pas ouvert sur cette campagne", 409);
  }
};

const isWithdrawn = (
  journal: TarificationJournal,
  document: TarificationJournalDocument
): boolean =>
  !getActiveDocuments(journal).some(
    (activeDocument) => activeDocument.id === document.id
  );

const assertCanShare = (
  journal: TarificationJournal,
  document: TarificationJournalDocument,
  now: Date
): void => {
  if (document.status !== TarificationDocumentStatus.FINAL) {
    throw new DomainError("Seule une version signée se partage", 409);
  }
  if (isWithdrawn(journal, document)) {
    throw new DomainError("Ce document a été retiré", 409);
  }
  if (getSharedAtByDocumentId(journal).has(document.id)) {
    throw new DomainError("Ce document est déjà partagé", 409);
  }
  const bpDeposit = computeTarificationState(journal, now).deposits.find(
    (deposit) => deposit.type === "BP"
  );
  if (document.types.includes("L48") && !bpDeposit?.depositedAt) {
    throw new DomainError("Pas de L48 sans BP déposé", 409);
  }
};

const assertCanReview = (
  journal: TarificationJournal,
  document: TarificationJournalDocument,
  reviewerId: number | null
): void => {
  if (document.status !== TarificationDocumentStatus.DRAFT) {
    throw new DomainError("Seule une version de travail se relit", 409);
  }
  const deposit = journal.events.find(
    (event) =>
      event.type === TarificationEventType.DOCUMENT_DEPOSITED &&
      event.documentId === document.id
  );
  if (deposit?.authorId === reviewerId) {
    throw new DomainError("L'auteur d'une version ne la relit pas", 403);
  }
};

const assertCanWithdraw = (
  journal: TarificationJournal,
  document: TarificationJournalDocument
): void => {
  if (!getSharedAtByDocumentId(journal).has(document.id)) {
    throw new DomainError("Seul un document partagé se retire", 409);
  }
  if (isWithdrawn(journal, document)) {
    throw new DomainError("Ce document est déjà retiré", 409);
  }
};

const assertStepPending = (
  journal: TarificationJournal,
  event: Pick<TarificationJournalEvent, "stepCode">,
  now: Date
): void => {
  const step = computeTarificationState(journal, now).steps.find(
    (candidate) => candidate.code === event.stepCode
  );
  if (step?.status === "DONE" || step?.status === "NOT_APPLICABLE") {
    throw new DomainError("Cette étape n'est plus en attente", 409);
  }
};

const assertContradictoireOpen = (
  journal: TarificationJournal,
  now: Date
): void => {
  const { status, isClosed } = computeTarificationState(
    journal,
    now
  ).contradictoire;
  if (status === "NOT_STARTED" || isClosed) {
    throw new DomainError("Le contradictoire n'est pas ouvert", 409);
  }
};

const assertIsResponseDocument = (
  journal: TarificationJournal,
  document: TarificationJournalDocument | null
): void => {
  if (
    document &&
    (!document.types.includes("REPONSE_CONTRADICTOIRE") ||
      isWithdrawn(journal, document))
  ) {
    throw new DomainError(
      "Ce document n'est pas une réponse au contradictoire",
      422
    );
  }
};

const assertNotOutOfBhasile = (
  journal: TarificationJournal,
  now: Date
): void => {
  if (computeTarificationState(journal, now).isOutOfBhasile) {
    throw new DomainError("Cette tarification est déjà hors Bhasile", 409);
  }
};
