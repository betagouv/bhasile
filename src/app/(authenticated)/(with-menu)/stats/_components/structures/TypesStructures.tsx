import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement, useState } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const TypesStructures = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [visualization, setVisualization] = useState("structures");
  const typeStructureAccessor =
    visualization === "structures" ? "nbStructures" : "nbPlaces";

  const colors = [
    "var(--green-tilleul-verveine-main-707)",
    "var(--green-archipel-main-557)",
    "var(--blue-ecume-main-400)",
    "var(--brown-cafe-creme-main-782)",
    "var(--orange-terre-battue-main-645)",
  ];

  return (
    <div>
      <h4 className="text-title-blue-france text-lg">Types de structures</h4>
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
              value: "tableau",
              checked: visualization === "structures",
              onChange: () => setVisualization("structures"),
            },
          },
          {
            iconId: "fr-icon-team-line",
            label: "Places",
            nativeInputProps: {
              value: "courbe",
              checked: visualization === "places",
              onChange: () => setVisualization("places"),
            },
          },
        ]}
      />
      <div className="flex">
        <PieChart
          data={{
            labels: statistiques.structureTypes.map(
              (structureType) => structureType.label
            ),
            series: statistiques.structureTypes.map(
              (structureType) => structureType.byYear[0][typeStructureAccessor]
            ),
          }}
          options={{ showLabel: false }}
          size={154}
          colors={colors}
        ></PieChart>
        <div>
          {statistiques.structureTypes.map((structureType, index) => (
            <div className="pt-2" key={`structureType-${index}`}>
              <div className="pb-2 flex items-center text-sm">
                <div
                  className="w-[15px] h-[15px] mr-2 shrink-0 grow-0"
                  style={{ backgroundColor: colors[index] }}
                />
                <span>
                  <strong>
                    {structureType.byYear[0][typeStructureAccessor]}
                  </strong>
                  &nbsp;
                  {visualization === "structures"
                    ? "structures "
                    : "places en "}
                  {structureType.label}&nbsp;
                  <span className="text-mention-grey">
                    (
                    {getPercentage(
                      structureType.byYear[0][typeStructureAccessor],
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
