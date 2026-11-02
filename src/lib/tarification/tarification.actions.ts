import { DomainError } from "@/app/utils/domain-error.util";
import {
  type AuthorLevel,
  TarificationDocumentStatus,
  type TarificationDocumentType,
  TarificationEventType,
  TarificationStepCode,
} from "@/generated/prisma/enums";
import {
  TARIFICATION_DOCUMENT_TYPE_DEFINITIONS,
  TARIFICATION_SECTION_DEFINITIONS,
  type TarificationSectionCode,
} from "@/lib/tarification/tarification.definition";
import {
  assertCanDepositDocument,
  assertCanRecordEvent,
} from "@/lib/tarification/tarification.guard";
import type {
  CampaignPhase,
  TarificationJournal,
  TarificationJournalEvent,
} from "@/types/tarification.type";

export const computeSectionActions = ({
  context,
  sectionCode,
  versionIds,
}: {
  context: ActionContext;
  sectionCode: TarificationSectionCode;
  versionIds: number[];
}): SectionActions => {
  if (!context.isEligible || sectionCode === "DAI") {
    return NO_ACTIONS;
  }
  const isStep = Object.hasOwn(TarificationStepCode, sectionCode);
  return {
    depositOptions: getDepositOptions(context, sectionCode),
    canMarkNotApplicable:
      isStep &&
      canRecord(context, {
        type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
        stepCode: sectionCode as TarificationStepCode,
        text: PLACEHOLDER_TEXT,
      }),
    canRespondToL48:
      sectionCode === TarificationStepCode.L48 &&
      canRecord(context, { type: TarificationEventType.L48_ACCEPTED }),
    versionActions: Object.fromEntries(
      versionIds.map((documentId) => [
        documentId,
        {
          canApprove: canRecord(context, {
            type: TarificationEventType.APPROVED,
            documentId,
          }),
          canRequestChanges: canRecord(context, {
            type: TarificationEventType.CHANGES_REQUESTED,
            documentId,
            text: PLACEHOLDER_TEXT,
          }),
          canShare: canRecord(context, {
            type: TarificationEventType.DOCUMENT_SHARED,
            documentId,
          }),
          canWithdraw: canRecord(context, {
            type: TarificationEventType.DOCUMENT_WITHDRAWN,
            documentId,
            text: PLACEHOLDER_TEXT,
          }),
        },
      ])
    ),
  };
};

export const canDeclareOutOfBhasile = (context: ActionContext): boolean =>
  context.isEligible &&
  canRecord(context, {
    type: TarificationEventType.OUT_OF_BHASILE_DECLARED,
    text: PLACEHOLDER_TEXT,
  });

const getDepositOptions = (
  context: ActionContext,
  sectionCode: TarificationSectionCode
): DepositOption[] =>
  TARIFICATION_SECTION_DEFINITIONS[sectionCode].types
    // La réponse au contradictoire se dépose avec la réponse elle-même
    .filter((type) => type !== "REPONSE_CONTRADICTOIRE")
    .flatMap((type) => {
      const statuses = DEPOSIT_STATUSES.filter((status) =>
        isAllowed(() =>
          assertCanDepositDocument({
            journal: context.journal,
            authorLevel: context.author.level,
            types: [type],
            status,
            phase: context.phase,
            now: context.now,
          })
        )
      );
      if (statuses.length === 0) {
        return [];
      }
      const { label, exerciseOffset } =
        TARIFICATION_DOCUMENT_TYPE_DEFINITIONS[type];
      return [
        {
          type,
          label: `${label} ${context.journal.campaignYear + exerciseOffset}`,
          statuses,
        },
      ];
    });

const canRecord = (
  { journal, author, phase, now }: ActionContext,
  event: Partial<Omit<TarificationJournalEvent, "id" | "createdAt">> &
    Pick<TarificationJournalEvent, "type">
): boolean =>
  isAllowed(() =>
    assertCanRecordEvent({
      journal,
      event: {
        authorId: author.id,
        authorLevel: author.level,
        documentId: null,
        stepCode: null,
        text: null,
        ...event,
      },
      phase,
      now,
    })
  );

const isAllowed = (assertion: () => void): boolean => {
  try {
    assertion();
    return true;
  } catch (error) {
    if (error instanceof DomainError) {
      return false;
    }
    throw error;
  }
};

const PLACEHOLDER_TEXT = "motif";

const DEPOSIT_STATUSES = [
  TarificationDocumentStatus.SHARED,
  TarificationDocumentStatus.FINAL,
  TarificationDocumentStatus.DRAFT,
];

const NO_ACTIONS: SectionActions = {
  depositOptions: [],
  canMarkNotApplicable: false,
  canRespondToL48: false,
  versionActions: {},
};

export type ActionContext = {
  journal: TarificationJournal;
  author: { id: number; level: AuthorLevel };
  phase: CampaignPhase;
  isEligible: boolean;
  now: Date;
};

export type DepositOption = {
  type: TarificationDocumentType;
  label: string;
  statuses: TarificationDocumentStatus[];
};

export type VersionActions = {
  canApprove: boolean;
  canRequestChanges: boolean;
  canShare: boolean;
  canWithdraw: boolean;
};

export type SectionActions = {
  depositOptions: DepositOption[];
  canMarkNotApplicable: boolean;
  canRespondToL48: boolean;
  versionActions: Record<number, VersionActions>;
};
