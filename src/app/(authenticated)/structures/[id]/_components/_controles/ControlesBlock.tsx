import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { InformationCard } from "@/app/components/InformationCard";
import { NoDataAccordion } from "@/app/components/NoDataAccordion";
import {
  getLastVisitInMonths,
  isStructureAutorisee,
} from "@/app/utils/structure.util";

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

  const last12MonthsEIG = evenementsIndesirablesGraves.filter((eig) =>
    dayjs(eig.evenementDate).isAfter(dayjs().subtract(12, "month"))
  );

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
          {evaluations.length === 0 && controles.length === 0 ? (
            <InformationCard
              primaryInformation="Aucune visite"
              secondaryInformation="renseignée"
            />
          ) : (
            <InformationCard
              primaryInformation={`${getLastVisitInMonths(
                evaluations,
                controles
              )} mois`}
              secondaryInformation="depuis la dernière visite"
            />
          )}
        </div>
        {evaluations[0]?.note !== undefined && (
          <div className="pr-4">
            <InformationCard
              primaryInformation={`${evaluations[0]?.note} / 4`}
              secondaryInformation="de moyenne à la dernière évaluation"
            />
          </div>
        )}
        <InformationCard
          primaryInformation={`${last12MonthsEIG.length} EIG`}
          secondaryInformation="sur ces 12 derniers mois"
        />
      </div>
      <div className="pt-3">
        {isStructureAutorisee(structure.type) && (
          <>
            {evaluations.length > 0 ? (
              <ControleAccordion
                title="Évaluations"
                lastVisit={evaluations[0]?.date}
              >
                <EvaluationTable evaluations={evaluations} />
              </ControleAccordion>
            ) : (
              <NoDataAccordion
                title="Evaluations"
                description="Aucune évaluation renseignée"
              />
            )}
          </>
        )}
        {controles.length > 0 ? (
          <ControleAccordion
            title="Inspections-contrôles"
            lastVisit={controles?.[0]?.date}
          >
            <ControleTable />
          </ControleAccordion>
        ) : (
          <NoDataAccordion
            title="Inspections-contrôles"
            description="Aucune inspection-contrôle renseignée"
          />
        )}
        {evenementsIndesirablesGraves.length > 0 ? (
          <ControleAccordion
            title="Événements indésirables graves"
            lastVisit={evenementsIndesirablesGraves[0]?.evenementDate}
          >
            <EIGTable />
          </ControleAccordion>
        ) : (
          <NoDataAccordion
            title="Inspections-contrôles"
            description="Aucun EIG trouvé sur Démarches Numériques"
          />
        )}
      </div>
    </Block>
  );
};
