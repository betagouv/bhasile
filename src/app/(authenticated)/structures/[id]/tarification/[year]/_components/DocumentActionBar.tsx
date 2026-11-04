"use client";

import Button from "@codegouvfr/react-dsfr/Button";
import { ReactElement, useState } from "react";

import { getApiErrorMessage } from "@/app/utils/api-error.util";
import {
  TarificationEventType,
  type TarificationStepCode,
} from "@/generated/prisma/enums";
import type { VersionActions } from "@/lib/tarification/tarification.actions";
import type { TarificationSectionCode } from "@/lib/tarification/tarification.definition";
import type { SectionVersion } from "@/lib/tarification/tarification.section";
import type { TarificationEventApiCreateClient } from "@/schemas/api/tarification.schema";

import { type L48Response, L48ResponseButtons } from "./L48ResponseButtons";
import {
  type ActionRequest,
  TarificationActionModal,
} from "./TarificationActionModal";

export const DocumentActionBar = ({
  sectionCode,
  version,
  versionActions,
  canMarkNotApplicable,
  canRespondToL48,
  reviewerNames,
  hasSharedL48,
  contradictoireDeadline,
  recordEvent,
  respondToL48,
}: Props): ReactElement => {
  const [request, setRequest] = useState<ActionRequest | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isReviewing, setIsReviewing] = useState(false);

  const documentId = version?.id ?? null;

  const modal = (
    <TarificationActionModal
      modalId="tarification-document-action"
      request={request}
      onClose={() => setRequest(null)}
    />
  );

  const hasActions =
    versionActions?.canApprove ||
    versionActions?.canRequestChanges ||
    versionActions?.canShare ||
    versionActions?.canWithdraw ||
    canMarkNotApplicable ||
    canRespondToL48;
  if (!hasActions && reviewerNames.length === 0) {
    return modal;
  }

  const approve = async () => {
    setIsReviewing(true);
    setErrorMessage(null);
    try {
      await recordEvent({ type: TarificationEventType.APPROVED, documentId });
    } catch (error) {
      setErrorMessage(
        getApiErrorMessage(
          error,
          "L’action n’a pas abouti. Réessayez dans quelques instants."
        )
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const requestShare = () => {
    const isL48 = !!version?.types.includes("L48");
    setRequest({
      title: "Envoyer à l’opérateur",
      description: isL48
        ? "Le document sera visible par l’opérateur. Le délai de 8 jours du contradictoire démarrera à sa première ouverture."
        : "Le document sera visible par l’opérateur.",
      warning: getShareWarning({
        isSecondL48: isL48 && hasSharedL48,
        isReviewed: reviewerNames.length > 0,
      }),
      confirmLabel: "Envoyer à l’opérateur",
      onConfirm: () =>
        recordEvent({
          type: TarificationEventType.DOCUMENT_SHARED,
          documentId,
        }),
    });
  };

  const requestChanges = () =>
    setRequest({
      title: "Demander des modifications",
      description: "Votre demande sera visible des agents.",
      textLabel: "Modifications demandées",
      isTextRequired: true,
      confirmLabel: "Demander des modifications",
      onConfirm: ({ text }) =>
        recordEvent({
          type: TarificationEventType.CHANGES_REQUESTED,
          documentId,
          text,
        }),
    });

  const requestWithdrawal = () =>
    setRequest({
      title: "Retirer le document",
      description:
        "L’opérateur verra « retiré le … » et ne pourra plus l’ouvrir. Rien n’est effacé.",
      textLabel: "Motif du retrait",
      isTextRequired: true,
      confirmLabel: "Retirer le document",
      onConfirm: ({ text }) =>
        recordEvent({
          type: TarificationEventType.DOCUMENT_WITHDRAWN,
          documentId,
          text,
        }),
    });

  const requestNotApplicable = () =>
    setRequest({
      title: "Déclarer l’étape sans objet",
      description:
        "Cette déclaration ne s’annule pas. Si le document arrive plus tard, son envoi fera l’étape.",
      textLabel: "Motif",
      isTextRequired: true,
      confirmLabel: "Déclarer sans objet",
      onConfirm: ({ text }) =>
        recordEvent({
          type: TarificationEventType.STEP_MARKED_NOT_APPLICABLE,
          stepCode: sectionCode as TarificationStepCode,
          text,
        }),
    });

  return (
    <footer className="flex items-center gap-3 flex-wrap bg-white rounded-xl border border-border-default-grey px-6 py-4">
      <p className="mb-0 text-sm grow">
        {reviewerNames.length > 0 && (
          <>
            relu par <strong>{reviewerNames.join(", ")}</strong>
          </>
        )}
        {versionActions?.canShare && reviewerNames.length === 0 && "non relu"}
      </p>
      {errorMessage && (
        <p role="alert" className="mb-0 text-sm text-default-error">
          {errorMessage}
        </p>
      )}
      {canMarkNotApplicable && (
        <Button priority="tertiary" onClick={requestNotApplicable}>
          Sans objet
        </Button>
      )}
      {versionActions?.canWithdraw && (
        <Button priority="tertiary" onClick={requestWithdrawal}>
          Retirer
        </Button>
      )}
      {versionActions?.canRequestChanges && (
        <Button priority="secondary" onClick={requestChanges}>
          Demander des modifications
        </Button>
      )}
      {versionActions?.canApprove && (
        <Button disabled={isReviewing} onClick={approve}>
          J’ai relu ce document
        </Button>
      )}
      {versionActions?.canShare && (
        <Button onClick={requestShare}>Envoyer à l’opérateur</Button>
      )}
      {canRespondToL48 && (
        <L48ResponseButtons
          contradictoireDeadline={contradictoireDeadline}
          respondToL48={respondToL48}
          onRequest={setRequest}
        />
      )}
      {modal}
    </footer>
  );
};

const getShareWarning = ({
  isSecondL48,
  isReviewed,
}: {
  isSecondL48: boolean;
  isReviewed: boolean;
}): string | undefined => {
  if (isSecondL48) {
    return "Une L48 a déjà été envoyée : celle-ci ne relance pas le délai. Les corrections passent par la DAB.";
  }
  return isReviewed ? undefined : "Ce document n’a été relu par personne.";
};

type Props = {
  sectionCode: TarificationSectionCode;
  version: SectionVersion | undefined;
  versionActions: VersionActions | undefined;
  canMarkNotApplicable: boolean;
  canRespondToL48: boolean;
  reviewerNames: string[];
  hasSharedL48: boolean;
  contradictoireDeadline: string | null;
  recordEvent: (event: TarificationEventApiCreateClient) => Promise<void>;
  respondToL48: (response: L48Response) => Promise<void>;
};
