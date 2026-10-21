"use client";

import { ReactElement } from "react";

import { getPercentage } from "@/app/utils/common.util";
import { isYearIncomplete } from "@/app/utils/statistiques-period.util";
import { CURRENT_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { TypePlaceCharts } from "../../../structures/[id]/_components/_type-places/TypePlaceCharts";
import { AnnualDataNote } from "../AnnualDataNote";
import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { TypesPlacesStatsTable } from "./TypesPlacesStatsTable";

export const TypesPlacesBlock = ({
  startYear,
  endYear,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const currentYearCompletude = statistiques.places.byYear.find(
    (yearItem) => yearItem.year === CURRENT_YEAR
  )?.completude;

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
      <div className="pb-16">
        <h4 className="text-title-blue-france text-lg print:mb-0">
          En {CURRENT_YEAR}{" "}
          {isYearIncomplete(currentYearCompletude) && (
            <IncompleteDataIndicator
              nbStructures={currentYearCompletude?.nbRenseignees || 0}
              structuresPercentage={getPercentage(
                currentYearCompletude?.nbRenseignees || 0,
                currentYearCompletude?.nbAttendues || 1
              )}
            />
          )}
        </h4>
        <h5 className="hidden print:block text-title-blue-france text-sm font-normal">
          {currentYearCompletude?.nbRenseignees} structures actualisées
        </h5>
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
