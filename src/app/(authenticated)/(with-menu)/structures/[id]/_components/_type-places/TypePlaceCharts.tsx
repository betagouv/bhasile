import { ReactElement } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";

export const TypePlaceCharts = ({
  placesAutorisees,
  placesPmr,
  placesLgbt,
  placesFvvTeh,
  placesQPV,
  placesLogementsSociaux,
}: Props): ReactElement => {
  return (
    <div className="grid grid-cols-5 gap-10">
      <div className="col-span-1">
        <PieChart
          data={{
            labels: ["Places PMR", "Places non-PMR"],
            series: [placesPmr, placesAutorisees - placesPmr],
          }}
          options={{ showLabel: false }}
        ></PieChart>
        <div className="fr-pt-1w text-center">
          <strong>{placesPmr}</strong> places PMR{" "}
          <span className="text-mention-grey">
            ({getPercentage(placesPmr, placesAutorisees)})
          </span>
        </div>
      </div>
      <div className="col-span-1">
        <PieChart
          data={{
            labels: [
              "Places LGBT",
              "Places FVV-TEH",
              "Places non-LGBT non-FVV-TEH",
            ],
            series: [
              placesLgbt,
              placesFvvTeh,
              placesAutorisees - placesLgbt - placesFvvTeh,
            ],
          }}
          options={{ showLabel: false }}
        ></PieChart>
        <div className="fr-pt-1w text-center">
          <strong>{placesLgbt}</strong> places LGBT{" "}
          <span className="text-mention-grey">
            ({getPercentage(placesLgbt, placesAutorisees)})
          </span>{" "}
          et <br />
          <strong>{placesFvvTeh}</strong> places FVV-TEH{" "}
          <span className="text-mention-grey">
            ({getPercentage(placesFvvTeh, placesAutorisees)})
          </span>
        </div>
      </div>
      <div className="col-span-1">
        <PieChart
          data={{
            labels: ["Places QPV", "Places non-QPV"],
            series: [placesQPV, placesAutorisees - placesQPV],
          }}
          options={{ showLabel: false }}
        ></PieChart>
        <div className="fr-pt-1w text-center">
          <strong>{placesQPV}</strong> places QPV{" "}
          <span className="text-mention-grey">
            ({getPercentage(placesQPV, placesAutorisees)})
          </span>
        </div>
      </div>
      <div className="col-span-1">
        <PieChart
          data={{
            labels: [
              "Places en logements sociaux",
              "Places non-logements sociaux",
            ],
            series: [
              placesLogementsSociaux,
              placesAutorisees - placesLogementsSociaux,
            ],
          }}
          options={{ showLabel: false }}
        ></PieChart>
        <div className="fr-pt-1w text-center">
          <strong>{placesLogementsSociaux}</strong> places en logements sociaux{" "}
          <span className="text-mention-grey">
            ({getPercentage(placesLogementsSociaux, placesAutorisees)})
          </span>
        </div>
      </div>
    </div>
  );
};

type Props = {
  placesAutorisees: number;
  placesPmr: number;
  placesLgbt: number;
  placesFvvTeh: number;
  placesQPV: number;
  placesLogementsSociaux: number;
};
