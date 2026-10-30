"use client";

import { ReactElement } from "react";

import { TypePlaceCharts } from "@/app/(authenticated)/(with-menu)/structures/[id]/_components/_type-places/TypePlaceCharts";
import { getPercentage } from "@/app/utils/common.util";
import { getCurrentYear } from "@/app/utils/now.util";
import { isYearIncomplete } from "@/app/utils/statistiques-period.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { AnnualDataNote } from "../AnnualDataNote";
import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { TypesPlacesStatsTable } from "./TypesPlacesStatsTable";

export const TypesPlacesBlock = ({
  startYear,
  endYear,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const currentYearPlaces = statistiques.places.byYear.find(
    (yearItem) => yearItem.year === getCurrentYear()
  );

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
          En {getCurrentYear()}{" "}
          {isYearIncomplete(currentYearPlaces?.completude) && (
            <IncompleteDataIndicator
              nbStructures={currentYearPlaces?.completude?.nbRenseignees || 0}
              structuresPercentage={getPercentage(
                currentYearPlaces?.completude?.nbRenseignees || 0,
                currentYearPlaces?.completude?.nbAttendues || 1
              )}
            />
          )}
        </h4>
        {isYearIncomplete(currentYearPlaces?.completude) && (
          <h5 className="hidden print:block text-title-blue-france text-sm font-normal">
            {currentYearPlaces?.completude?.nbRenseignees} structures
            actualisées
          </h5>
        )}
        <TypePlaceCharts
          placesAutorisees={currentYearPlaces?.totalPlaces ?? 0}
          placesPmr={currentYearPlaces?.pmr ?? 0}
          placesLgbt={currentYearPlaces?.lgbt ?? 0}
          placesFvvTeh={currentYearPlaces?.fvvTeh ?? 0}
        />
        <h4 className="text-title-blue-france text-lg pt-8">À date</h4>
        <TypePlaceCharts
          placesAutorisees={statistiques.places.totalPlaces}
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
