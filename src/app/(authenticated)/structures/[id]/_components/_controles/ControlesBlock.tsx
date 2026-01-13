import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";
import { getLastVisitInMonths } from "@/app/utils/structure.util";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ControleAccordion } from "./ControleAccordion";
import { ControleTable } from "./ControleTable";
import { EIGTable } from "./EIGTable";
import { EvaluationTable } from "./EvaluationTable";

export const ControlesBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const evaluations = structure.evaluations || [];
  const controles = structure.controles || [];
  const evenementsIndesirablesGraves =
    structure.evenementsIndesirablesGraves || [];

  return (
    <Block
      title="Controle qualité"
      iconClass="fr-icon-search-line"
      onEdit={() => {
        router.push(`/structures/${structure.id}/modification/05-controle`);
      }}
    >
      <div className="flex">
        <div className="pr-4">
          <InformationCard
            primaryInformation={`${getLastVisitInMonths(
              evaluations,
              controles
            )} mois`}
            secondaryInformation="depuis la dernière visite"
          />
        </div>
        {evaluations[0]?.note !== undefined && (
          <div className="pr-4">
            <InformationCard
              primaryInformation={`${evaluations[0]?.note}/5`}
              secondaryInformation="de moyenne à la dernière évaluation"
            />
          </div>
        )}
        <InformationCard
          primaryInformation={evenementsIndesirablesGraves.length}
          secondaryInformation="événements indésirables graves"
        />
      </div>
      <div className="pt-3">
        {evaluations.length > 0 && (
          <ControleAccordion
            title="Évaluations"
            lastVisit={evaluations[0]?.date}
          >
            <EvaluationTable evaluations={evaluations} />
          </ControleAccordion>
        )}
        {controles.length > 0 && (
          <ControleAccordion
            title="Inspections-contrôles"
            lastVisit={controles?.[0]?.date}
          >
            <ControleTable />
          </ControleAccordion>
        )}
        {evenementsIndesirablesGraves.length > 0 && (
          <ControleAccordion
            title="Événements indésirables graves"
            lastVisit={evenementsIndesirablesGraves[0]?.evenementDate}
          >
            <EIGTable />
          </ControleAccordion>
        )}
      </div>
    </Block>
  );
};
