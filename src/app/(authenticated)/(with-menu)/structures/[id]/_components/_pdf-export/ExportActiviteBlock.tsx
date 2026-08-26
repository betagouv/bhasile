import { ReactElement } from "react";

import { ActiviteHistoriqueTable } from "@/app/components/activites/ActiviteHistoriqueTable";
import { ActiviteMotifsIndisponibilite } from "@/app/components/activites/ActiviteMotifsIndisponibilite";
import { ActivitePlaces } from "@/app/components/activites/ActivitePlaces";
import { Block } from "@/app/components/common/Block";
import { useStructureContext } from "@/contexts/StructureContext";
import { StructureType } from "@/types/structure.type";

import { OfiiDisclaimer } from "../_activite/OfiiDisclaimer";

export const ExportActiviteBlock = ({
  startDate,
  endDate,
}: Props): ReactElement => {
  const { structure } = useStructureContext();
  const hasActivites = (structure.activites?.length ?? 0) > 0;
  const showOfiiData = structure.type !== StructureType.CAES && hasActivites;

  return (
    <Block
      title="Activité"
      iconClass="fr-icon-team-line"
      entity={structure}
      entityType="Structure"
      disclaimer={<OfiiDisclaimer showOfiiData={showOfiiData} />}
    >
      {showOfiiData && (
        <>
          <h4
            className="text-lg text-title-blue-france"
            id="indisponibilite-title"
          >
            Indisponibilités
          </h4>
          <div className="flex pt-10 pb-10">
            <ActivitePlaces
              placesAutorisees={structure.activites?.[0].placesEnregistreesDna}
              placesIndisponibles={structure.activites?.[0].placesIndisponibles}
            />
            <div className="pl-20 w-100">
              <ActiviteMotifsIndisponibilite
                desinsectisation={structure.activites?.[0].desinsectisation}
                remiseEnEtat={structure.activites?.[0].remiseEnEtat}
                sousOccupation={structure.activites?.[0].sousOccupation}
                travaux={structure.activites?.[0].travaux}
              />
            </div>
          </div>
          <hr className="pb-10!" />
          {startDate}
          {endDate}
          <ActiviteHistoriqueTable activites={structure.activites || []} />
        </>
      )}
    </Block>
  );
};

type Props = {
  startDate: string;
  endDate: string;
};
