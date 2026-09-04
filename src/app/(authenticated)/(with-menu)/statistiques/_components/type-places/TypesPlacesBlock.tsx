"use client";

import { ReactElement } from "react";

import { InformationCard } from "@/app/components/InformationCard";
import { formatPerMille } from "@/app/utils/number.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { TypePlaceCharts } from "../../../structures/[id]/_components/_type-places/TypePlaceCharts";
import { AnnualDataNote } from "../AnnualDataNote";
import { TypesPlacesStatsTable } from "./TypesPlacesStatsTable";

export const TypesPlacesBlock = ({
  startYear,
  endYear,
}: Props): ReactElement => {
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
      </div>
      <div className="flex pb-16">
        <div className="pr-4">
          <InformationCard
            primaryInformation={statistiques.places.totalPlaces}
            secondaryInformation="places autorisées"
          />
        </div>
        <div>
          <InformationCard
            primaryInformation={formatPerMille(
              statistiques.places.tauxEquipement
            )}
            secondaryInformation="taux d'équipement"
            tertiaryInformation="nombre de places divisé par le nombre d'habitants"
          />
        </div>
      </div>
      <div className="pb-16">
        <TypePlaceCharts
          placesAutorisees={statistiques.places.totalPlaces}
          placesPmr={statistiques.places.pmr}
          placesLgbt={statistiques.places.lgbt}
          placesFvvTeh={statistiques.places.fvvTeh}
          placesQPV={statistiques.places.qpv}
          placesLogementsSociaux={statistiques.places.logementsSociaux}
        />
      </div>
      <TypesPlacesStatsTable startYear={startYear} endYear={endYear} />
      <AnnualDataNote />
    </div>
  );
};

type Props = {
  startYear?: number;
  endYear?: number;
};
