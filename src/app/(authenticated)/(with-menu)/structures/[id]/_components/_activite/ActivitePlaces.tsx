"use client";

import { ReactElement } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";

import { useStructureContext } from "../../_context/StructureClientContext";

const pieChartOptions = {
  showLabel: false,
  donut: true,
  donutWidth: 30,
};

export const ActivitePlaces = (): ReactElement => {
  const { structure } = useStructureContext();
  const activite = structure.activites?.[0];
  const placesAutorisees = activite?.placesAutorisees || 0;
  const placesIndisponibles = activite?.placesIndisponibles || 0;
  const placesDisponibles = activite?.placesDisponibles || 0;

  return (
    <div className="flex items-center pt-3">
      <div>
        <PieChart
          size={160}
          data={{
            labels: ["Places indisponibles", "Places disponibles"],
            series: [placesIndisponibles, placesDisponibles],
          }}
          options={pieChartOptions}
          colors={["var(--grey-925-125)", "", "var(--yellow-moutarde-850-200)"]}
          isDonut={true}
        >
          <div className="absolute w-22 top-13 left-26 text-sm text-center">
            <strong>{placesAutorisees}</strong> places enregistrées DNA
          </div>
        </PieChart>
        <div className="pt-2 text-center">
          <div>
            <strong>{placesIndisponibles}</strong> indisponibles{" "}
            <span className="text-mention-grey">
              ({getPercentage(placesIndisponibles, placesAutorisees)})
            </span>
          </div>
          <div>
            <strong>{placesDisponibles}</strong> disponibles{" "}
            <span className="text-mention-grey">({getPercentage(placesDisponibles, placesAutorisees)})</span>
          </div>
        </div>
      </div>
    </div>
  );
};
