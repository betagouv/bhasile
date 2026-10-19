import { ReactElement } from "react";

import { getPercentage } from "@/app/utils/common.util";
import { CURRENT_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { GenericTypeChart } from "./GenericTypeChart";

export const TypesStructures = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const currentYearCompletude = statistiques.places.byYear.find(
    (yearItem) => yearItem.year === CURRENT_YEAR
  )?.completude;

  const colors = [
    "var(--green-tilleul-verveine-main-707)",
    "var(--green-archipel-main-557)",
    "var(--blue-ecume-main-400)",
    "var(--brown-cafe-creme-main-782)",
    "var(--orange-terre-battue-main-645)",
  ];

  return (
    <GenericTypeChart
      title={
        <>
          Types de structures en {CURRENT_YEAR}{" "}
          <IncompleteDataIndicator
            nbStructures={currentYearCompletude?.nbRenseignees ?? 0}
            structuresPercentage={getPercentage(
              currentYearCompletude?.nbRenseignees ?? 0,
              currentYearCompletude?.nbAttendues ?? 1
            )}
          />
        </>
      }
      colors={colors}
      typeAccessor="structureTypes"
    />
  );
};
