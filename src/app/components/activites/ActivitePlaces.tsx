"use client";

import { ReactElement } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";

import { NumberDisplay } from "../common/NumberDisplay";

const pieChartOptions = {
  showLabel: false,
  donut: true,
  donutWidth: 30,
};

export const ActivitePlaces = ({
  placesAutorisees = 0,
  placesDisponibles = 0,
  placesIndisponibles = 0,
  placesCaes = 0,
}: Props): ReactElement => {
  const indisponibles = Number(placesIndisponibles ?? 0);
  const disponibles = Number(placesDisponibles ?? 0);
  const caes = Number(placesCaes ?? 0);

  const total = disponibles + indisponibles + caes;

  const labels = [
    "Places indisponibles",
    "Places disponibles",
    ...(caes ? ["Places CAES"] : []),
  ];
  const series = [indisponibles, disponibles, ...(caes ? [caes] : [])];

  return (
    <div className="flex items-center pt-3">
      <div>
        <PieChart
          size={180}
          data={{ labels, series }}
          options={pieChartOptions}
          isDonut={true}
          colors={[
            "var(--grey-925-125)",
            "var(--yellow-moutarde-850-200)",
            caes
              ? "var(--yellow-moutarde-main-679)"
              : "var(--yellow-moutarde-850-200)",
          ]}
        >
          <div className="absolute w-22 top-15 left-12 text-sm text-center">
            <strong>
              <NumberDisplay value={placesAutorisees} />
            </strong>{" "}
            places enregistrées DNA
          </div>
        </PieChart>
        <div className="pt-2 text-center">
          <div>
            <strong>
              <NumberDisplay value={indisponibles} />
            </strong>{" "}
            indisponibles{" "}
            <span className="text-mention-grey">
              ({getPercentage(indisponibles, total)})
            </span>
          </div>
          <div>
            <strong>
              <NumberDisplay value={disponibles} />
            </strong>{" "}
            disponibles{" "}
            <span className="text-mention-grey">
              ({getPercentage(disponibles, total)})
            </span>
          </div>
          {caes ? (
            <div>
              <strong>
                <NumberDisplay value={caes} />
              </strong>{" "}
              places CAES
              <br />
              <span className="italic">- indisponibilité non suivie</span>{" "}
              <span className="text-mention-grey">
                ({getPercentage(caes, total)})
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

type Props = {
  placesAutorisees?: number;
  placesDisponibles?: number | null;
  placesIndisponibles?: number | null;
  placesCaes?: number | null;
};
