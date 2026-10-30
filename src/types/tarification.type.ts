import type {
  AuthorLevel,
  TarificationDocumentStatus,
  TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";
import type { CivilDate } from "@/lib/tarification/tarification.date";

export type TarificationJournalEvent = {
  id: number;
  type: TarificationEventType;
  authorId: number | null;
  authorLevel: AuthorLevel | null;
  documentId: number | null;
  stepCode: TarificationStepCode | null;
  text: string | null;
  createdAt: Date;
};

export type TarificationJournalDocument = {
  id: number;
  types: TarificationDocumentType[];
  status: TarificationDocumentStatus;
};

export type TarificationJournalOpening = {
  documentId: number;
  userId: number;
  createdAt: Date;
};

export type TarificationJournal = {
  campaignYear: number;
  timeZone: string;
  drlPublishedAt: CivilDate | null;
  isCoveredByCpom: boolean;
  documents: TarificationJournalDocument[];
  events: TarificationJournalEvent[];
  openings: TarificationJournalOpening[];
};

export type CampaignPhase = "UPCOMING" | "OPEN" | "CATCH_UP";

export type StepStatus = "DONE" | "NOT_APPLICABLE" | "EXPECTED" | "UPCOMING";

export type StepState = {
  code: TarificationStepCode;
  status: StepStatus;
  deadline: CivilDate | null;
  isLate: boolean;
};

export type DepositState = {
  type: "CA" | "BP";
  depositedAt: Date | null;
  deadline: CivilDate;
  isLate: boolean;
};

export type ContradictoireStatus =
  | "NOT_STARTED"
  | "WAITING_OPENING"
  | "RUNNING"
  | "ACCEPTED"
  | "CONTESTED"
  | "DEEMED_ACCEPTED";

export type ContradictoireState = {
  status: ContradictoireStatus;
  l48DocumentId: number | null;
  deadline: CivilDate | null;
  isClosed: boolean;
};

export type TarificationState = {
  isOutOfBhasile: boolean;
  deposits: DepositState[];
  steps: StepState[];
  contradictoire: ContradictoireState;
};
