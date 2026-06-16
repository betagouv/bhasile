import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";

import { TypePlaceCharts } from "../../../structures/[id]/_components/_type-places/TypePlaceCharts";
import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";
import { TypesPlacesStatsTable } from "./TypesPlacesStatsTable";

export const TypesPlacesBlock = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  return (
    <div className="bg-white pt-6 px-6 pb-8 border border-default-grey rounded-[10px] border-solid">
      <div className="flex justify-between items-start">
        <div className="flex">
          <span className="text-title-blue-france mr-3 fr-icon-map-pin-2-line" />
          <h3 className="text-title-blue-france fr-h6 mb-12">
            Types de places
          </h3>
        </div>
        {/* TODO : à mettre à jour quand on aura les campagnes d'actualisation */}
        {/* <div className="flex items-center text-right text-xs text-title-blue-france">
          Données mises à jour le {new Date().toLocaleDateString()}
        </div> */}
      </div>
      <div className="flex pb-16">
        <div className="pr-4">
          <InformationCard
            primaryInformation={statistiques.totalPlaces}
            secondaryInformation="places autorisées"
          />
        </div>
        <InformationCard
          primaryInformation={`${statistiques.tauxEquipement} ‰`}
          secondaryInformation="taux d'équipement"
          tertiaryInformation="nombre de places divisé par le nombre d'habitants"
        />
      </div>
      <div className="pb-16">
        <TypePlaceCharts
          placesAutorisees={statistiques.placesAutorisees}
          placesPmr={statistiques.placesPmr}
          placesLgbt={statistiques.placesLgbt}
          placesFvvTeh={statistiques.placesFvvTeh}
          placesQPV={statistiques.placesQPV}
          placesLogementsSociaux={statistiques.placesLogementsSociaux}
        />
      </div>
      <TypesPlacesStatsTable />
      <div className="italic text-sm pt-3">
        Les chiffres correspondent au 31 décembre de chaque année.
      </div>
    </div>
  );
};
