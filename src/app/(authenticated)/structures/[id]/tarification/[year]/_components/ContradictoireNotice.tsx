import { ReactElement } from "react";

import { formatCivilDate } from "@/app/utils/date.util";
import type { ContradictoireState } from "@/types/tarification.type";

export const ContradictoireNotice = ({
  contradictoire: { status, deadline },
}: Props): ReactElement | null => {
  if (status === "NOT_STARTED") {
    return null;
  }
  return (
    <p className="mb-0 bg-white rounded-xl border border-border-default-grey px-6 py-3 text-sm">
      <strong>Contradictoire :</strong> {STATUS_LABELS[status]}
      {status === "RUNNING" && deadline && (
        <> – réponse attendue au plus tard le {formatCivilDate(deadline)}</>
      )}
    </p>
  );
};

const STATUS_LABELS: Record<
  Exclude<ContradictoireState["status"], "NOT_STARTED">,
  string
> = {
  WAITING_OPENING: "en attente de l’ouverture de la L48 par l’opérateur",
  RUNNING: "en cours",
  ACCEPTED: "L48 acceptée",
  CONTESTED: "L48 contestée",
  DEEMED_ACCEPTED: "L48 réputée acceptée",
};

type Props = {
  contradictoire: ContradictoireState;
};
