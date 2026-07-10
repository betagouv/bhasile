"use client";

import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement, useState } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";
import { BatiStat, TypeStructureStat } from "@/schemas/api/statistique.schema";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const GenericTypeChart = ({
  title,
  colors,
  typeAccessor,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [visualization, setVisualization] = useState("structures");
  const typeStructureAccessor =
    visualization === "structures" ? "structures" : "places";

  // Dénominateur iso au camembert affiché
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
      return statItem.bati;
    }
    return "";
  };

  return (
    <div>
      <h4 className="text-title-blue-france text-lg">{title}</h4>
      <SegmentedControl
        small
        legend=""
        inlineLegend
        className="[&_div]:ml-0 pb-6"
        segments={[
          {
            iconId: "fr-icon-community-line",
            label: "Structures",
            nativeInputProps: {
              value: "structures",
              checked: visualization === "structures",
              onChange: () => setVisualization("structures"),
            },
          },
          {
            iconId: "fr-icon-team-line",
            label: "Places",
            nativeInputProps: {
              value: "places",
              checked: visualization === "places",
              onChange: () => setVisualization("places"),
            },
          },
        ]}
      />
      <div className="flex">
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
        ></PieChart>
        <div>
          {statistiques.structures[typeAccessor].map((statItem, index) => (
            <div className="pt-2" key={`${typeAccessor}-${index}`}>
              <div className="pb-2 flex items-center text-sm">
                <div
                  className="w-[15px] h-[15px] mr-2 shrink-0 grow-0"
                  style={{ backgroundColor: colors[index] }}
                />
                <span className="whitespace-nowrap">
                  <strong>{statItem[typeStructureAccessor]}</strong>{" "}
                  {visualization === "structures"
                    ? "structures "
                    : "places en "}
                  {getStatItemLabel(statItem)}{" "}
                  <span className="text-mention-grey">
                    (
                    {getPercentage(statItem[typeStructureAccessor], ratioTotal)}
                    )
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

type Props = {
  title: string;
  colors: string[];
  typeAccessor: "structureTypes" | "structureBatis";
};
