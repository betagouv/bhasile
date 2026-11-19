import Alert from "@codegouvfr/react-dsfr/Alert";
import { ReactElement } from "react";

import type { CampaignPhase } from "@/types/tarification.type";

export const CampaignNotice = ({
  year,
  phase,
  isEligible,
  isOperateur,
  isOutOfBhasile,
}: Props): ReactElement | null => {
  const description = getDescription({
    year,
    phase,
    isEligible,
    isOperateur,
  });
  if (!description && !isOutOfBhasile) {
    return null;
  }
  return (
    <div className="flex flex-col gap-2">
      {isOutOfBhasile && (
        <Alert
          severity="info"
          small
          description="Cette tarification est menée hors de Bhasile : aucune étape n’est en retard."
        />
      )}
      {description && <Alert severity="info" small description={description} />}
    </div>
  );
};

const getDescription = ({
  year,
  phase,
  isEligible,
  isOperateur,
}: Pick<Props, "year" | "phase" | "isEligible" | "isOperateur">):
  string | null => {
  if (!isEligible) {
    return "Cette structure n’a pas de tarification : ce qui existe reste consultable, en lecture seule.";
  }
  if (phase === "UPCOMING") {
    return `La campagne ${year} n’est pas encore ouverte.`;
  }
  if (phase === "CATCH_UP") {
    return isOperateur
      ? `La campagne ${year} est close : elle est en lecture seule.`
      : `La campagne ${year} est close. Seuls l’arrêté, la DAM, la DAI et l’échéancier peuvent encore être déposés et envoyés.`;
  }
  return null;
};

type Props = {
  year: number;
  phase: CampaignPhase;
  isEligible: boolean;
  isOperateur: boolean;
  isOutOfBhasile: boolean;
};
