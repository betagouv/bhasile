"use client";

import { ReactElement } from "react";

import PieChart from "@/app/components/common/PieChart";
import { getPercentage } from "@/app/utils/common.util";
import { StructureType } from "@/types/structure.type";

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
  const placesVacantes = activite?.placesVacantes || 0;
  const presencesInduesBPI = activite?.presencesInduesBPI || 0;
  const presencesInduesDeboutees = activite?.presencesInduesDeboutees || 0;

  const placesDisponibles = placesAutorisees - placesIndisponibles;
  const placesOccupees = placesDisponibles - placesVacantes;

  return (
    <div className="flex items-center pt-3">
      <div>
        <PieChart
          size={160}
          data={{
            labels: ["Places indisponibles", "Places disponibles"],
            series: [
              placesIndisponibles,
              placesAutorisees - placesIndisponibles,
            ],
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
            <strong>{placesIndisponibles}</strong> indisponibles (
            {getPercentage(placesIndisponibles, placesAutorisees)})
          </div>
          <div>
            <strong>{placesAutorisees - placesIndisponibles}</strong>{" "}
            disponibles (
            {getPercentage(
              placesAutorisees - placesIndisponibles,
              placesAutorisees
            )}
            )
          </div>
        </div>
      </div>
      <span className="fr-icon-arrow-right-s-line text-title-blue-france fr-icon--lg" />
      <div>
        <PieChart
          size={160}
          data={{
            labels: ["Places vacantes", "Places non vacantes"],
            series: [placesVacantes, placesDisponibles - placesVacantes],
          }}
          options={pieChartOptions}
          colors={["var(--grey-925-125)", "", "var(--purple-glycine-850-200)"]}
          isDonut={true}
        >
          <div className="absolute w-22 top-15 left-26 text-sm text-center">
            <strong>{placesDisponibles}</strong> places disponibles
          </div>
        </PieChart>
        <div className="pt-2 text-center">
          <div>
            <strong>{placesIndisponibles}</strong> vacantes (
            {getPercentage(placesVacantes, placesDisponibles)})
          </div>
          <div>
            <strong>{placesOccupees}</strong> occupées (
            {getPercentage(placesOccupees, placesDisponibles)})
          </div>
        </div>
      </div>
      {structure.type !== StructureType.CPH && (
        <>
          <span className="fr-icon-arrow-right-s-line text-title-blue-france fr-icon--lg" />
          <div>
            <PieChart
              size={160}
              data={{
                labels: [
                  "Places indues BPI",
                  "Places indues déboutées",
                  "Places non indues et non deboutées",
                ],
                series: [
                  presencesInduesBPI,
                  presencesInduesDeboutees,
                  placesOccupees -
                    presencesInduesBPI -
                    presencesInduesDeboutees,
                ],
              }}
              options={pieChartOptions}
              colors={[
                "var(--blue-cumulus-main-526)",
                "var(--blue-cumulus-925-125)",
                "var(--blue-cumulus-850-200)",
              ]}
              isDonut={true}
            >
              <div className="absolute w-22 top-15 left-26 text-sm text-center">
                <strong>{placesOccupees}</strong> places occupées
              </div>
            </PieChart>
            <div className="pt-2 text-center">
              <div>
                <strong>{presencesInduesBPI}</strong> en présence indue BPI (
                {getPercentage(presencesInduesBPI, placesOccupees)})
              </div>
              <div>
                <strong>{presencesInduesDeboutees}</strong> en présence indue
                deboutée (
                {getPercentage(presencesInduesDeboutees, placesOccupees)})
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
