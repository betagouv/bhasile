import dayjs from "dayjs";
import { useRouter } from "next/navigation";
import { ReactElement } from "react";

import { Block } from "@/app/components/common/Block";
import { DocumentDownloadDropdown } from "@/app/components/download/DocumentDownloadDropdown";
import { InformationCard } from "@/app/components/InformationCard";
import { NoDataAccordion } from "@/app/components/NoDataAccordion";
import { getNow } from "@/app/utils/now.util";
import { getControleQualiteDownloadContent } from "@/app/utils/spreadsheet-download.util";
import { getLastPastVisit } from "@/app/utils/structure.util";
import { useStructureContext } from "@/contexts/StructureContext";

import { ControleAccordion } from "./ControleAccordion";
import { ControleTable } from "./ControleTable";
import { EIGTable } from "./EIGTable";
import { EvaluationTable } from "./EvaluationTable";
import { LastVisitCard } from "./LastVisitCard";

export const ControlesBlock = (): ReactElement => {
  const { structure } = useStructureContext();

  const router = useRouter();

  const evaluations = structure.evaluations || [];
  const controles = structure.controles || [];
  const evenementsIndesirablesGraves =
    structure.evenementsIndesirablesGraves || [];

  const last12MonthsEIG = evenementsIndesirablesGraves.filter((eig) =>
    dayjs(eig.evenementDate).isAfter(dayjs(getNow()).subtract(12, "month"))
  );

  const lastPastEvaluation = getLastPastVisit(evaluations);
  const lastPastControle = getLastPastVisit(controles);

  const lastNote = lastPastEvaluation?.note;
  const hasLastNote = lastNote !== undefined && lastNote !== null;

  return (
    <Block
      title="Controle qualité"
      iconClass="fr-icon-search-line"
      onEdit={() => {
        router.push(
          `/structures/${structure.id}/modification/controle-qualite`
        );
      }}
      entity={structure}
      entityType="Structure"
      downloadDropdown={
        <DocumentDownloadDropdown
          downloadContent={getControleQualiteDownloadContent(structure)}
        />
      }
    >
      <div className="flex">
        <div className="pr-4">
          <LastVisitCard evaluations={evaluations} controles={controles} />
        </div>
        {lastPastEvaluation && (
          <div className="pr-4">
            <InformationCard
              primaryInformation={
                hasLastNote ? (
                  <>
                    {lastNote} <span className="text-xl">/&nbsp;4</span>
                  </>
                ) : (
                  "Sans note"
                )
              }
              secondaryInformation={
                hasLastNote
                  ? "de moyenne à la dernière évaluation"
                  : "à la dernière évaluation"
              }
            />
          </div>
        )}
        <div>
          <InformationCard
            primaryInformation={`${last12MonthsEIG.length} EIG`}
            secondaryInformation="sur les 12 derniers mois"
          />
        </div>
      </div>
      <div className="pt-12">
        {structure.isAutorisee && (
          <>
            {evaluations.length > 0 ? (
              <ControleAccordion
                title="Évaluations"
                lastVisit={lastPastEvaluation?.date}
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
            lastVisit={lastPastControle?.date}
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
            title="Événements indésirables graves"
            description="Aucun EIG trouvé sur Démarche Numérique"
          />
        )}
      </div>
    </Block>
  );
};
