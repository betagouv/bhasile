import { SegmentedControl } from "@codegouvfr/react-dsfr/SegmentedControl";
import { ReactElement, useState } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";

import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const TypesBatis = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();
  const [visualization, setVisualization] = useState("structures");
  const typeStructureAccessor =
    visualization === "structures" ? "nbStructures" : "nbPlaces";

  const colors = [
    "var(--blue-cumulus-main-526)",
    "var(--yellow-moutarde-850-200)",
    "var(--purple-glycine-main-494)",
  ];

  return (
    <div>
      <h4 className="text-title-blue-france text-lg">Types de bâtis</h4>
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
            labels: statistiques.structureBatis.map(
              (structureBati) => structureBati.label
            ),
            series: statistiques.structureBatis.map(
              (structureBati) => structureBati.byYear[0][typeStructureAccessor]
            ),
          }}
          options={{ showLabel: false }}
          size={154}
          colors={colors}
        ></PieChart>
        <div>
          {statistiques.structureBatis.map((structureBati, index) => (
            <div className="pt-2" key={`structureType-${index}`}>
              <div className="pb-2 flex items-center text-sm">
                <div
                  className="w-[15px] h-[15px] mr-2 shrink-0 grow-0"
                  style={{ backgroundColor: colors[index] }}
                />
                <span>
                  <strong>
                    {structureBati.byYear[0][typeStructureAccessor]}
                  </strong>
                  &nbsp;
                  {visualization === "structures"
                    ? "structures en bâti "
                    : "places en bâti "}
                  {structureBati.label}&nbsp;
                  <span className="text-mention-grey">
                    (
                    {getPercentage(
                      structureBati.byYear[0][typeStructureAccessor],
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
