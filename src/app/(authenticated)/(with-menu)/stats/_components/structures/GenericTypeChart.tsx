import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement, useState } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const GenericTypeChart = ({
  title,
  colors,
  typeAccessor,
}: Props): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [visualization, setVisualization] = useState("structures");
  const typeStructureAccessor =
    visualization === "structures" ? "nbStructures" : "nbPlaces";

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
            labels: statistiques[typeAccessor].map(
              (statItem) => statItem.label
            ),
            series: statistiques[typeAccessor].map(
              (statItem) => statItem.byYear[0][typeStructureAccessor]
            ),
          }}
          options={{ showLabel: false }}
          size={154}
          colors={colors}
        ></PieChart>
        <div>
          {statistiques[typeAccessor].map((statItem, index) => (
            <div className="pt-2" key={`${typeAccessor}-${index}`}>
              <div className="pb-2 flex items-center text-sm">
                <div
                  className="w-[15px] h-[15px] mr-2 shrink-0 grow-0"
                  style={{ backgroundColor: colors[index] }}
                />
                <span>
                  <strong>{statItem.byYear[0][typeStructureAccessor]}</strong>
                  &nbsp;
                  {visualization === "structures"
                    ? "structures "
                    : "places en "}
                  {statItem.label}&nbsp;
                  <span className="text-mention-grey">
                    (
                    {getPercentage(
                      statItem.byYear[0][typeStructureAccessor],
                      statistiques[
                        visualization === "structures"
                          ? "totalStructures"
                          : "totalPlaces"
                      ]
                    )}
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
