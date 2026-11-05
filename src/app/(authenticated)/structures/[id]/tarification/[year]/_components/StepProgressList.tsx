import { ReactElement, ReactNode } from "react";

import {
  formatCivilDate,
  formatInstantDayAndTime,
} from "@/app/utils/date.util";
import type { StepProgress } from "@/lib/tarification/tarification.section";

import { StepParticipantsSummary } from "./StepParticipantsSummary";
import { StepLineStatus, StepProgressLine } from "./StepProgressLine";

export const StepProgressList = ({
  progress,
  isOperateur,
  deadline,
  timeZone,
}: Props): ReactElement => {
  const buildDoneLabel = (label: string, date: Date | null): ReactNode =>
    date ? (
      <>
        {label} le{" "}
        <strong>{formatInstantDayAndTime(date, timeZone)}</strong>
      </>
    ) : (
      label
    );

  const lines: Line[] = [
    ...(isOperateur
      ? []
      : [
          {
            key: "created",
            isDone: progress.creators.length > 0,
            doneLabel: buildDoneLabel("créé", progress.createdAt),
            pendingLabel: "à créer",
            participants: (
              <StepParticipantsSummary participants={progress.creators} />
            ),
          },
          ...(progress.hasChangesRequested
            ? [
                {
                  key: "changes",
                  isDone: false,
                  doneLabel: null,
                  pendingLabel: "modifications demandées",
                },
              ]
            : []),
          {
            key: "validated",
            isDone: progress.isValidated,
            doneLabel: buildDoneLabel("validé", progress.validatedAt),
            pendingLabel: "à valider",
            participants: (
              <StepParticipantsSummary participants={progress.reviewers} />
            ),
          },
          {
            key: "signed",
            isDone: progress.isSigned,
            doneLabel: buildDoneLabel("signé", progress.signedAt),
            pendingLabel: "à signer",
          },
        ]),
    {
      key: "sent",
      isDone: progress.isSent,
      doneLabel: buildDoneLabel("envoyé", progress.sentAt),
      pendingLabel: deadline ? (
        <>
          à envoyer{" "}
          <strong>avant le {formatCivilDate(deadline).slice(0, 5)}</strong>
        </>
      ) : (
        "à envoyer"
      ),
    },
    {
      key: "received",
      isDone: progress.isReceived,
      doneLabel: buildDoneLabel("reçu", progress.receivedAt),
      pendingLabel: "à recevoir",
    },
  ];
  const nextKey = lines.find((line) => !line.isDone)?.key;

  const getStatus = ({ key, isDone }: Line): StepLineStatus => {
    if (isDone) {
      return "DONE";
    }
    return key === nextKey ? "NEXT" : "LATER";
  };

  return (
    <ul className="fr-raw-list m-0 px-2 flex flex-col gap-1.5">
      {lines.map((line) => (
        <StepProgressLine
          key={line.key}
          label={line.isDone ? line.doneLabel : line.pendingLabel}
          status={getStatus(line)}
          participants={line.isDone ? line.participants : undefined}
        />
      ))}
    </ul>
  );
};

type Line = {
  key: string;
  isDone: boolean;
  doneLabel: ReactNode;
  pendingLabel: ReactNode;
  participants?: ReactNode;
};

type Props = {
  progress: StepProgress;
  isOperateur: boolean;
  deadline: string | null;
  timeZone: string;
};
