import { ReactElement } from "react";

import { getPercentage } from "@/app/utils/common.util";
import { CURRENT_YEAR } from "@/constants";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";

import { IncompleteDataIndicator } from "../IncompleteDataIndicator";
import { GenericTypeChart } from "./GenericTypeChart";

export const TypesBatis = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const currentYearCompletude = statistiques.structures.byYear.find(
    (yearItem) => yearItem.year === CURRENT_YEAR
  )?.completude;

  const colors = [
    "var(--blue-cumulus-main-526)",
    "var(--yellow-moutarde-850-200)",
    "var(--purple-glycine-main-494)",
  ];

  return (
    <GenericTypeChart
      title={
        <>
          Types de bâtis en {CURRENT_YEAR}{" "}
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
      typeAccessor="structureBatis"
    />
  );
};
