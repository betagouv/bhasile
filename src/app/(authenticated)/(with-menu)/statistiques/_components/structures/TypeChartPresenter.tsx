"use client";

import { ReactElement } from "react";

import { ChartLegend } from "@/app/components/ChartLegend";
import { NumberDisplay } from "@/app/components/common/NumberDisplay";
import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";
import { useStatistiquesContext } from "@/contexts/StatistiquesContext";
import { BatiStat, TypeStructureStat } from "@/schemas/api/statistique.schema";
import { RepartitionLabel } from "@/types/adresse.type";

type VisualizationMode = "structures" | "places";

type PresenterProps = {
  colors: string[];
  typeAccessor: "structureTypes" | "structureBatis";
  visualization: VisualizationMode;
};

export const TypeChartPresenter = ({
  colors,
  typeAccessor,
  visualization,
}: PresenterProps): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const typeStructureAccessor = visualization;

  const placesTotal =
    typeAccessor === "structureTypes"
      ? statistiques.structures.totalPlaces
      : statistiques.structures.totalPlacesAdresse;

  const ratioTotal =
    visualization === "structures"
      ? statistiques.structures.totalStructures
      : placesTotal;

  const getStatItemLabel = (statItem: TypeStructureStat | BatiStat): string => {
    const labelAccessor = typeAccessor === "structureTypes" ? "type" : "bati";
    if (labelAccessor === "type" && "type" in statItem) {
      return statItem.type;
    }
    if (labelAccessor === "bati" && "bati" in statItem) {
      return RepartitionLabel[statItem.bati];
    }
    return "";
  };

  const getIntermediateLabel = () => {
    if (typeAccessor === "structureTypes") {
      return visualization === "structures" ? " " : "places en ";
    }
    return visualization === "structures"
      ? "structures en bâti "
      : "places en bâti ";
  };

  return (
    <div className="flex items-center gap-4">
      <div className="w-38 h-38 shrink-0 flex items-center justify-center">
        <PieChart
          data={{
            labels: statistiques.structures[typeAccessor].map((statItem) =>
              getStatItemLabel(statItem)
            ),
            series: statistiques.structures[typeAccessor].map(
              (statItem) => statItem[typeStructureAccessor]
            ),
          }}
          options={{ showLabel: false }}
          size={154}
          colors={colors}
        />
      </div>
      <div>
        {statistiques.structures[typeAccessor].map((statItem, index) => {
          const itemValue = statItem[typeStructureAccessor];

          const legendLabel = (
            <span className="text-sm">
              <strong>
                <NumberDisplay value={itemValue} />
              </strong>{" "}
              {getIntermediateLabel()}
              {getStatItemLabel(statItem)}{" "}
              <span className="text-mention-grey">
                ({getPercentage(itemValue, ratioTotal)})
              </span>
            </span>
          );

          return (
            <div className="pt-2" key={`${typeAccessor}-${index}`}>
              <ChartLegend
                color={colors[index]}
                label={legendLabel}
                type="square"
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};
