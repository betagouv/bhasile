import {
  TarificationDocumentStatus,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";
import {
  addDays,
  type CivilDate,
  toLocalDate,
} from "@/lib/tarification/tarification.date";
import {
  BP_DEPOSIT_DEADLINE,
  CA_DEPOSIT_DEADLINE,
  CONTRADICTOIRE_DAYS,
  CONTRADICTOIRE_DEEMED_RECEIPT_DAYS,
  TARIFICATION_STEP_DEFINITIONS,
} from "@/lib/tarification/tarification.definition";
import type {
  ContradictoireState,
  DepositState,
  StepState,
  TarificationJournal,
  TarificationJournalDocument,
  TarificationJournalEvent,
  TarificationState,
} from "@/types/tarification.type";

export const computeTarificationState = (
  journal: TarificationJournal,
  now: Date
): TarificationState => {
  const today = toLocalDate(now, journal.timeZone);
  const activeDocuments = getActiveDocuments(journal);
  const sharedAtByDocumentId = getSharedAtByDocumentId(journal);
  const isOutOfBhasile = journal.events.some(
    (event) => event.type === TarificationEventType.OUT_OF_BHASILE_DECLARED
  );
  const isNeverLate = isOutOfBhasile || journal.isCoveredByCpom;

  const deposits = (["CA", "BP"] as const).map((type) =>
    computeDeposit(journal, activeDocuments, { type, today, isNeverLate })
  );

  return {
    isOutOfBhasile,
    deposits,
    steps: computeSteps(journal, {
      activeDocuments,
      sharedAtByDocumentId,
      deposits,
      today,
      isNeverLate,
    }),
    contradictoire: computeContradictoire(journal, {
      activeDocuments,
      sharedAtByDocumentId,
      today,
    }),
  };
};

const getActiveDocuments = (
  journal: TarificationJournal
): TarificationJournalDocument[] => {
  const withdrawnDocumentIds = new Set(
    journal.events
      .filter(
        (event) => event.type === TarificationEventType.DOCUMENT_WITHDRAWN
      )
      .map((event) => event.documentId)
  );
  return journal.documents.filter(
    (document) => !withdrawnDocumentIds.has(document.id)
  );
};

// Un dépôt de l'opérateur est partagé d'office ; un document des agents l'est à son premier partage
const getSharedAtByDocumentId = (
  journal: TarificationJournal
): Map<number, Date> => {
  const statusByDocumentId = new Map(
    journal.documents.map((document) => [document.id, document.status])
  );
  const sharedAtByDocumentId = new Map<number, Date>();
  for (const event of getChronologicalEvents(journal)) {
    if (
      event.documentId === null ||
      sharedAtByDocumentId.has(event.documentId)
    ) {
      continue;
    }
    const isOperateurDeposit =
      event.type === TarificationEventType.DOCUMENT_DEPOSITED &&
      statusByDocumentId.get(event.documentId) ===
        TarificationDocumentStatus.SHARED;
    if (
      isOperateurDeposit ||
      event.type === TarificationEventType.DOCUMENT_SHARED
    ) {
      sharedAtByDocumentId.set(event.documentId, event.createdAt);
    }
  }
  return sharedAtByDocumentId;
};

const computeDeposit = (
  journal: TarificationJournal,
  activeDocuments: TarificationJournalDocument[],
  {
    type,
    today,
    isNeverLate,
  }: { type: "CA" | "BP"; today: CivilDate; isNeverLate: boolean }
): DepositState => {
  const deadline: CivilDate = `${journal.campaignYear - 1}-${type === "CA" ? CA_DEPOSIT_DEADLINE : BP_DEPOSIT_DEADLINE}`;
  const documentIds = new Set(
    activeDocuments
      .filter((document) => document.types.includes(type))
      .map((document) => document.id)
  );
  const deposit = getChronologicalEvents(journal).find(
    (event) =>
      event.type === TarificationEventType.DOCUMENT_DEPOSITED &&
      event.documentId !== null &&
      documentIds.has(event.documentId)
  );
  if (!deposit) {
    return {
      type,
      depositedAt: null,
      deadline,
      isLate: !isNeverLate && today > deadline,
    };
  }
  const isBackfill = deposit.authorId === null;
  return {
    type,
    depositedAt: deposit.createdAt,
    deadline,
    isLate:
      !isNeverLate &&
      !isBackfill &&
      toLocalDate(deposit.createdAt, journal.timeZone) > deadline,
  };
};

const computeSteps = (
  journal: TarificationJournal,
  {
    activeDocuments,
    sharedAtByDocumentId,
    deposits,
    today,
    isNeverLate,
  }: {
    activeDocuments: TarificationJournalDocument[];
    sharedAtByDocumentId: Map<number, Date>;
    deposits: DepositState[];
    today: CivilDate;
    isNeverLate: boolean;
  }
): StepState[] => {
  let hasPendingStep = false;
  return Object.values(TarificationStepCode).map((code) => {
    const definition = TARIFICATION_STEP_DEFINITIONS[code];
    const deadline =
      journal.drlPublishedAt !== null &&
      definition.deadlineDaysAfterDrl !== null
        ? addDays(journal.drlPublishedAt, definition.deadlineDaysAfterDrl)
        : null;
    const isDone = activeDocuments.some(
      (document) =>
        document.types.includes(definition.documentType) &&
        sharedAtByDocumentId.has(document.id)
    );
    if (isDone) {
      return { code, status: "DONE", deadline, isLate: false };
    }
    const isNotApplicable = journal.events.some(
      (event) =>
        event.type === TarificationEventType.STEP_MARKED_NOT_APPLICABLE &&
        event.stepCode === code
    );
    if (isNotApplicable) {
      return { code, status: "NOT_APPLICABLE", deadline, isLate: false };
    }
    const isFirstPendingStep = !hasPendingStep;
    hasPendingStep = true;
    const hasRequiredDeposit =
      definition.requiredDeposit === null ||
      deposits.some(
        (deposit) =>
          deposit.type === definition.requiredDeposit &&
          deposit.depositedAt !== null
      );
    return {
      code,
      status:
        isFirstPendingStep && hasRequiredDeposit ? "EXPECTED" : "UPCOMING",
      deadline,
      isLate: !isNeverLate && deadline !== null && today > deadline,
    };
  });
};

const computeContradictoire = (
  journal: TarificationJournal,
  {
    activeDocuments,
    sharedAtByDocumentId,
    today,
  }: {
    activeDocuments: TarificationJournalDocument[];
    sharedAtByDocumentId: Map<number, Date>;
    today: CivilDate;
  }
): ContradictoireState => {
  const l48Document = activeDocuments
    .filter(
      (document) =>
        document.types.includes("L48") && sharedAtByDocumentId.has(document.id)
    )
    .sort(
      (firstDocument, secondDocument) =>
        sharedAtByDocumentId.get(firstDocument.id)!.getTime() -
        sharedAtByDocumentId.get(secondDocument.id)!.getTime()
    )[0];
  if (!l48Document) {
    return {
      status: "NOT_STARTED",
      l48DocumentId: null,
      deadline: null,
      isClosed: false,
    };
  }

  const sharedDate = toLocalDate(
    sharedAtByDocumentId.get(l48Document.id)!,
    journal.timeZone
  );
  const firstOpening = journal.openings
    .filter((opening) => opening.documentId === l48Document.id)
    .sort(
      (earlierOpening, laterOpening) =>
        earlierOpening.createdAt.getTime() - laterOpening.createdAt.getTime()
    )[0];
  const receivedDate = getReceivedDate({
    openedAt: firstOpening?.createdAt ?? null,
    timeZone: journal.timeZone,
    sharedDate,
    today,
  });
  const deadline = receivedDate
    ? addDays(receivedDate, CONTRADICTOIRE_DAYS)
    : null;
  const isClosed = deadline !== null && today > deadline;
  const lastResponse = getChronologicalEvents(journal)
    .filter(
      (event) =>
        (event.type === TarificationEventType.L48_ACCEPTED ||
          event.type === TarificationEventType.L48_CONTESTED) &&
        (deadline === null ||
          toLocalDate(event.createdAt, journal.timeZone) <= deadline)
    )
    .at(-1);

  return {
    status: getContradictoireStatus({ lastResponse, deadline, isClosed }),
    l48DocumentId: l48Document.id,
    deadline,
    isClosed,
  };
};

// Jamais ouverte dans les 15 jours : réputée reçue à la date de son partage
const getReceivedDate = ({
  openedAt,
  timeZone,
  sharedDate,
  today,
}: {
  openedAt: Date | null;
  timeZone: string;
  sharedDate: CivilDate;
  today: CivilDate;
}): CivilDate | null => {
  if (openedAt) {
    return toLocalDate(openedAt, timeZone);
  }
  if (today > addDays(sharedDate, CONTRADICTOIRE_DEEMED_RECEIPT_DAYS)) {
    return sharedDate;
  }
  return null;
};

const getContradictoireStatus = ({
  lastResponse,
  deadline,
  isClosed,
}: {
  lastResponse: TarificationJournalEvent | undefined;
  deadline: CivilDate | null;
  isClosed: boolean;
}): ContradictoireState["status"] => {
  if (lastResponse) {
    return lastResponse.type === TarificationEventType.L48_CONTESTED
      ? "CONTESTED"
      : "ACCEPTED";
  }
  if (deadline === null) {
    return "WAITING_OPENING";
  }
  return isClosed ? "DEEMED_ACCEPTED" : "RUNNING";
};

const getChronologicalEvents = (
  journal: TarificationJournal
): TarificationJournalEvent[] =>
  [...journal.events].sort(
    (firstEvent, secondEvent) => firstEvent.id - secondEvent.id
  );
