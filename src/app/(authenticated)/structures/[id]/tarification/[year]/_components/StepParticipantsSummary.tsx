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
  const names = participants.map(({ name }) => name).join(", ");
  return (
    <span className="flex items-center gap-1">
      {levels.map((level) => (
        <Badge key={level} type="yellow">
          {AUTHOR_LEVEL_LABELS[level]}
        </Badge>
      ))}
      <span
        title={names}
        className="fr-icon-user-line fr-icon--xs text-title-blue-france border-0 border-b border-dashed border-title-blue-france"
      >
        <span className="sr-only">{names}</span>
      </span>
    </span>
  );
};

type Props = {
  participants: StepParticipant[];
};
