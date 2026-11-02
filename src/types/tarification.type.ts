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

export type TarificationJournal<
  TDocument extends TarificationJournalDocument = TarificationJournalDocument,
  TEvent extends TarificationJournalEvent = TarificationJournalEvent,
  TOpening extends TarificationJournalOpening = TarificationJournalOpening,
> = {
  campaignYear: number;
  timeZone: string;
  drlPublishedAt: CivilDate | null;
  isCoveredByCpom: boolean;
  documents: TDocument[];
  events: TEvent[];
  openings: TOpening[];
};

export type TarificationJournalRead = TarificationJournal<
  TarificationJournalDocument & {
    fileUpload: {
      key: string;
      originalName: string;
      mimeType: string;
      fileSize: number;
      sha256: string | null;
    };
  },
  TarificationJournalEvent & { author: { name: string | null } | null },
  TarificationJournalOpening & { user: { name: string | null } }
>;

export type TarificationJournalView = {
  journal: TarificationJournalRead;
  state: TarificationState;
  drlUrl: string | null;
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
