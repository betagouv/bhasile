import type {
  TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";

export const TARIFICATION_STEP_DEFINITIONS: Record<
  TarificationStepCode,
  StepDefinition
> = {
  RCA: {
    label: "RCA",
    documentType: "RCA",
    requiredDeposit: "CA",
    deadlineDaysAfterDrl: 48,
  },
  L48: {
    label: "L48 et procédure contradictoire",
    documentType: "L48",
    requiredDeposit: "BP",
    deadlineDaysAfterDrl: 48,
  },
  DAB: {
    label: "DAB (L60)",
    documentType: "DAB",
    requiredDeposit: null,
    deadlineDaysAfterDrl: 60,
  },
  ARRETE: {
    label: "Arrêté",
    documentType: "ARRETE",
    requiredDeposit: null,
    deadlineDaysAfterDrl: null,
  },
};

export const TARIFICATION_DOCUMENT_TYPE_DEFINITIONS: Record<
  TarificationDocumentType,
  DocumentTypeDefinition
> = {
  CA: {
    label: "Compte administratif",
    emitter: "OPERATEUR",
    exerciseOffset: -2,
    isCatchUpAllowed: false,
  },
  RAPPORT_ACTIVITE: {
    label: "Rapport d'activité",
    emitter: "OPERATEUR",
    exerciseOffset: -2,
    isCatchUpAllowed: false,
  },
  BP: {
    label: "Budget prévisionnel",
    emitter: "OPERATEUR",
    exerciseOffset: 0,
    isCatchUpAllowed: false,
  },
  RAPPORT_BUDGETAIRE: {
    label: "Rapport budgétaire",
    emitter: "OPERATEUR",
    exerciseOffset: 0,
    isCatchUpAllowed: false,
  },
  RCA: {
    label: "RCA",
    emitter: "AGENT",
    exerciseOffset: -2,
    isCatchUpAllowed: false,
  },
  L48: {
    label: "L48",
    emitter: "AGENT",
    exerciseOffset: 0,
    isCatchUpAllowed: false,
  },
  REPONSE_CONTRADICTOIRE: {
    label: "Réponse au contradictoire",
    emitter: "OPERATEUR",
    exerciseOffset: 0,
    isCatchUpAllowed: false,
  },
  DAB: {
    label: "DAB",
    emitter: "AGENT",
    exerciseOffset: 0,
    isCatchUpAllowed: false,
  },
  ARRETE: {
    label: "Arrêté de tarification",
    emitter: "AGENT",
    exerciseOffset: 0,
    isCatchUpAllowed: true,
  },
  DAM: {
    label: "DAM",
    emitter: "AGENT",
    exerciseOffset: 0,
    isCatchUpAllowed: true,
  },
  ECHEANCIER: {
    label: "Échéancier",
    emitter: "AGENT",
    exerciseOffset: 0,
    isCatchUpAllowed: true,
  },
  DAI: {
    label: "DAI",
    emitter: "AGENT",
    exerciseOffset: 1,
    isCatchUpAllowed: true,
  },
  PIECE_JUSTIFICATIVE: {
    label: "Pièce justificative",
    emitter: "ANY",
    exerciseOffset: 0,
    isCatchUpAllowed: false,
  },
  AUTRE: {
    label: "Autre document",
    emitter: "ANY",
    exerciseOffset: 0,
    isCatchUpAllowed: false,
  },
};

export const TARIFICATION_EVENT_DEFINITIONS: Record<
  TarificationEventType,
  EventDefinition
> = {
  DOCUMENT_DEPOSITED: {
    author: "ANY",
    document: "REQUIRED",
    stepCode: "FORBIDDEN",
    text: "FORBIDDEN",
    visibility: "SHARED_DEPOSIT",
    notifies: true,
  },
  DOCUMENT_SHARED: {
    author: "AGENT",
    document: "REQUIRED",
    stepCode: "FORBIDDEN",
    text: "FORBIDDEN",
    visibility: "ALL",
    notifies: true,
  },
  APPROVED: {
    author: "AGENT",
    document: "REQUIRED",
    stepCode: "FORBIDDEN",
    text: "FORBIDDEN",
    visibility: "AGENTS",
    notifies: true,
  },
  CHANGES_REQUESTED: {
    author: "AGENT",
    document: "REQUIRED",
    stepCode: "FORBIDDEN",
    text: "REQUIRED",
    visibility: "AGENTS",
    notifies: true,
  },
  DOCUMENT_WITHDRAWN: {
    author: "AGENT",
    document: "REQUIRED",
    stepCode: "FORBIDDEN",
    text: "REQUIRED",
    visibility: "DOCUMENT",
    notifies: true,
  },
  STEP_MARKED_NOT_APPLICABLE: {
    author: "AGENT",
    document: "FORBIDDEN",
    stepCode: "REQUIRED",
    text: "REQUIRED",
    visibility: "ALL",
    notifies: false,
  },
  L48_ACCEPTED: {
    author: "OPERATEUR",
    document: "OPTIONAL",
    stepCode: "FORBIDDEN",
    text: "OPTIONAL",
    visibility: "ALL",
    notifies: false,
  },
  L48_CONTESTED: {
    author: "OPERATEUR",
    document: "OPTIONAL",
    stepCode: "FORBIDDEN",
    text: "OPTIONAL",
    visibility: "ALL",
    notifies: true,
  },
  OUT_OF_BHASILE_DECLARED: {
    author: "AGENT",
    document: "FORBIDDEN",
    stepCode: "FORBIDDEN",
    text: "REQUIRED",
    visibility: "ALL",
    notifies: false,
  },
};

export const CA_DEPOSIT_DEADLINE = "04-30";
export const BP_DEPOSIT_DEADLINE = "10-31";
export const CONTRADICTOIRE_DAYS = 8;
export const CONTRADICTOIRE_DEEMED_RECEIPT_DAYS = 15;

type StepDefinition = {
  label: string;
  documentType: TarificationDocumentType;
  requiredDeposit: "CA" | "BP" | null;
  deadlineDaysAfterDrl: number | null;
};

type DocumentTypeDefinition = {
  label: string;
  emitter: AuthorKind;
  exerciseOffset: number;
  isCatchUpAllowed: boolean;
};

// DOCUMENT : visible de l'opérateur si le document l'est ; SHARED_DEPOSIT : seulement un dépôt partagé d'office,
// pour que la date de rédaction d'une version des agents ne lui parvienne jamais
type EventDefinition = {
  author: AuthorKind;
  document: ColumnRule;
  stepCode: ColumnRule;
  text: ColumnRule;
  visibility: "ALL" | "AGENTS" | "DOCUMENT" | "SHARED_DEPOSIT";
  notifies: boolean;
};

export type AuthorKind = "AGENT" | "OPERATEUR" | "ANY";

export type ColumnRule = "REQUIRED" | "OPTIONAL" | "FORBIDDEN";
