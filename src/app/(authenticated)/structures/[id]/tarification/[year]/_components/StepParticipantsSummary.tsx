import { ReactElement } from "react";

import { Badge } from "@/app/components/common/Badge";
import { AUTHOR_LEVEL_LABELS } from "@/constants";
import type { StepParticipant } from "@/lib/tarification/tarification.section";

export const StepParticipantsSummary = ({
  participants,
}: Props): ReactElement | null => {
  if (participants.length === 0) {
    return null;
  }
  const levels = [
    ...new Set(participants.map((participant) => participant.level)),
  ];
  return (
    <>
      <span title={participants.map(({ name }) => name).join(", ")}>
        par {participants.length} personne{participants.length > 1 ? "s" : ""}
      </span>
      {levels.map((level) => (
        <Badge key={level} type="yellow">
          {AUTHOR_LEVEL_LABELS[level]}
        </Badge>
      ))}
    </>
  );
};

type Props = {
  participants: StepParticipant[];
};
