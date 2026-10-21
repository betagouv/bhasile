import { ReactElement } from "react";

import { getPercentage } from "@/app/utils/common.util";
import { CURRENT_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { GenericTypeChart } from "./GenericTypeChart";

export const TypesStructures = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const currentYearCompletude = statistiques.structures.byYear.find(
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
          {!currentYearCompletude?.isComplete && (
            <>
              <IncompleteDataIndicator
                nbStructures={currentYearCompletude?.nbRenseignees ?? 0}
                structuresPercentage={getPercentage(
                  currentYearCompletude?.nbRenseignees ?? 0,
                  currentYearCompletude?.nbAttendues ?? 1
                )}
              />
              <span className="hidden print:block text-title-blue-france text-sm font-normal">
                {currentYearCompletude?.nbRenseignees} structures actualisées
              </span>
            </>
          )}
        </>
      }
      colors={colors}
      typeAccessor="structureTypes"
    />
  );
};
