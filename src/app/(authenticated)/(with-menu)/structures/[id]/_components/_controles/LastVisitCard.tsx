import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";
import { getLastVisitInMonths } from "@/app/utils/structure.util";
import { ControleApiType } from "@/schemas/api/controle.schema";
import { EvaluationApiType } from "@/schemas/api/evaluation.schema";

export const LastVisitCard = ({
  evaluations,
  controles = [],
}: Props): ReactElement => {
  const lastVisitInMonths = getLastVisitInMonths(evaluations, controles);

  return lastVisitInMonths === null ? (
    <InformationCard
      primaryInformation="Aucune visite"
      secondaryInformation="passée renseignée"
    />
  ) : (
    <InformationCard
      primaryInformation={`${lastVisitInMonths} mois`}
      secondaryInformation="depuis la dernière visite"
    />
  );
};

type Props = {
  evaluations: EvaluationApiType[];
  controles?: ControleApiType[];
};
