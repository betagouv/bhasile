import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";
import { getLastVisitInMonths } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ControleAccordion } from "./ControleAccordion";
import { DemarchesNumeriquesInfo } from "./DemarchesNumeriquesInfo";
import { EIGTable } from "./EIGTable";
import { EvaluationTable } from "./EvaluationTable";

export const HudaPrahdaControlesBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const evaluations = structure.evaluations || [];
  const evenementsIndesirablesGraves =
    structure.evenementsIndesirablesGraves || [];

  return (
    <Block title="Controle qualité" iconClass="fr-icon-search-line">
      <div className="flex">
        <div className="pr-4">
          <InformationCard
            primaryInformation={`${getLastVisitInMonths(evaluations, [])} mois`}
            secondaryInformation="depuis la dernière visite"
          />
        </div>
        <InformationCard
          primaryInformation={evenementsIndesirablesGraves.length}
          secondaryInformation="événements indésirables graves"
        />
      </div>
      <div className="pt-3">
        <ControleAccordion title="Évaluations" lastVisit={evaluations[0].date}>
          <EvaluationTable evaluations={evaluations} />
        </ControleAccordion>
        <ControleAccordion
          title="Événements indésirables graves"
          lastVisit={evenementsIndesirablesGraves[0].evenementDate}
        >
          <>
            <EIGTable />
            <DemarchesNumeriquesInfo />
          </>
        </ControleAccordion>
      </div>
    </Block>
  );
};
