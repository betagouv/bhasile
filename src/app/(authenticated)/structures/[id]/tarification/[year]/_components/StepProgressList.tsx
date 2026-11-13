import { ReactElement } from "react";

import type { StepProgress } from "@/lib/tarification/tarification.section";

import { StepParticipantsSummary } from "./StepParticipantsSummary";
import { StepProgressLine } from "./StepProgressLine";

export const StepProgressList = ({
  progress,
  isOperateur,
}: Props): ReactElement => (
  <ul className="fr-raw-list m-0 px-4 pb-4 flex flex-col gap-2 text-white text-sm">
    {!isOperateur && (
      <>
        <StepProgressLine
          label="créé"
          isDone={progress.creators.length > 0}
          participants={
            <StepParticipantsSummary participants={progress.creators} />
          }
        />
        <StepProgressLine
          label={
            progress.hasChangesRequested ? "modifications demandées" : "relu"
          }
          isDone={progress.reviewers.length > 0}
          participants={
            <StepParticipantsSummary participants={progress.reviewers} />
          }
        />
        <StepProgressLine label="validé" isDone={progress.isValidated} />
        <StepProgressLine label="signé" isDone={progress.isSigned} />
      </>
    )}
    <StepProgressLine label="envoyé" isDone={progress.isSent} />
    <StepProgressLine label="reçu" isDone={progress.isReceived} />
  </ul>
);

type Props = {
  progress: StepProgress;
  isOperateur: boolean;
};
