import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";
import { NoDataAccordion } from "@/app/components/NoDataAccordion";
import { filterPastVisits } from "@/app/utils/structure.util";
import { useStructureContext } from "@/contexts/StructureContext";

import { ControleAccordion } from "./ControleAccordion";
import { DemarcheNumeriqueInfo } from "./DemarcheNumeriqueInfo";
import { EIGTable } from "./EIGTable";
import { EvaluationTable } from "./EvaluationTable";
import { LastVisitCard } from "./LastVisitCard";

export const HudaPrahdaControlesBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const evaluations = structure.evaluations || [];
  const evenementsIndesirablesGraves =
    structure.evenementsIndesirablesGraves || [];

  const lastPastEvaluation = filterPastVisits(evaluations)[0];

  return (
    <Block
      title="Controle qualité"
      iconClass="fr-icon-search-line"
      entity={structure}
      entityType="Structure"
    >
      <div className="flex">
        <div className="pr-4">
          <LastVisitCard evaluations={evaluations} />
        </div>
        <InformationCard
          primaryInformation={evenementsIndesirablesGraves.length}
          secondaryInformation="événements indésirables graves"
        />
      </div>
      <div className="pt-3">
        {evaluations.length > 0 ? (
          <ControleAccordion
            title="Évaluations"
            lastVisit={lastPastEvaluation?.date}
          >
            <EvaluationTable evaluations={evaluations} />
          </ControleAccordion>
        ) : (
          <NoDataAccordion
            title="Évaluations"
            description="Aucune évaluation renseignée"
          />
        )}
        {evenementsIndesirablesGraves.length > 0 ? (
          <ControleAccordion
            title="Événements indésirables graves"
            lastVisit={evenementsIndesirablesGraves[0]?.evenementDate}
          >
            <>
              <EIGTable />
              <DemarcheNumeriqueInfo />
            </>
          </ControleAccordion>
        ) : (
          <NoDataAccordion
            title="Événements indésirables graves"
            description="Aucun EIG trouvé sur Démarche Numérique"
          />
        )}
      </div>
    </Block>
  );
};
