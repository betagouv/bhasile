import { ReactElement } from "react";

import { ActiviteMotifsIndisponibilite } from "@/app/components/activites/ActiviteMotifsIndisponibilite";
import { ActivitePlaces } from "@/app/components/activites/ActivitePlaces";
import { useStructureContext } from "@/contexts/StructureContext";
import { StructureType } from "@/types/structure.type";

import { ActiviteHistorique } from "./ActiviteHistorique";
import { OfiiDisclaimer } from "./OfiiDisclaimer";

export const ActiviteBlock = (): ReactElement => {
  const { structure } = useStructureContext();
  const hasActivites = (structure.activites?.length ?? 0) > 0;
  const showOfiiData = structure.type !== StructureType.CAES && hasActivites;

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className={`text-title-blue-france mr-3 fr-icon-team-line`} />
          <h3 className="text-title-blue-france fr-h6 mb-12">Activité</h3>
        </div>
        <OfiiDisclaimer showOfiiData={showOfiiData} />
      </div>
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
          <ActiviteHistorique />
        </>
      )}
    </div>
  );
};
