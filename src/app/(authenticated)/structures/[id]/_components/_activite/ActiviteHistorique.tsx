"use client";

import dayjs from "dayjs";
import { ReactElement, useState } from "react";

import LineChart from "@/app/components/common/LineChart";
import { computeAverage } from "@/app/utils/common.util";
import {
  formatForCharts,
  getMonthsBetween,
  getYearFromDate,
} from "@/app/utils/date.util";
import { ActiviteApiType } from "@/schemas/api/activite.schema";

import { useStructureContext } from "../../_context/StructureClientContext";
import { ActiviteDurations } from "./ActiviteDurations";
import { ActiviteTypes } from "./ActiviteTypes";

const typesActivite: Partial<
  Record<keyof ActiviteApiType, { label: string; seuil: number | null }>
> = {
  presencesInduesBPI: { label: "Présences indues BPI", seuil: 3 },
  presencesInduesDeboutees: { label: "Présences indues déboutées", seuil: 4 },
  presencesIndues: { label: "Présences indues totales", seuil: 7 },
  placesVacantes: { label: "Places vacantes", seuil: 3 },
  placesIndisponibles: { label: "Places indisponibles", seuil: 3 },
  placesAutorisees: { label: "Places totales", seuil: null },
};

export const ActiviteHistorique = (): ReactElement => {
  const { structure } = useStructureContext();
  const { activites = [], debutConvention, finConvention } = structure;

  const [selectedMonths, setSelectedMonths] = useState<dayjs.Dayjs[]>(
    getMonthsBetween(debutConvention, finConvention)
  );
  const [typeActivite, setTypeActivite] =
    useState<keyof ActiviteApiType>("presencesInduesBPI");

  const getCurrentActivite = (
    activites: ActiviteApiType[],
    date: dayjs.Dayjs
  ): ActiviteApiType | undefined => {
    return activites.find((activite) => {
      const isSameMonth =
        new Date(activite.date)?.getMonth() === date.get("month");
      const isSameYear = getYearFromDate(activite.date) === date.get("year");
      return isSameMonth && isSameYear;
    });
  };

  const getActivitesData = (): number[] => {
    return selectedMonths.map((selectedMonth) => {
      const currentActivite = getCurrentActivite(activites, selectedMonth);
      if (currentActivite) {
        if (typeActivite === "placesAutorisees") {
          return currentActivite?.placesAutorisees;
        }
        return (
          ((currentActivite?.[typeActivite] as number) /
            currentActivite?.placesAutorisees) *
          100
        );
      }
      return 0;
    });
  };

  const getSeuilRecommande = (): number[] => {
    const currentActivites: (ActiviteApiType | undefined)[] =
      selectedMonths.map((selectedMonth) => {
        return getCurrentActivite(activites, selectedMonth);
      });
    return currentActivites.map(() => typesActivite[typeActivite]?.seuil || 0);
  };

  const getAverage = (): number[] => {
    const activitesData = getActivitesData();
    const average = computeAverage(activitesData);
    return Array(selectedMonths.length).fill(average);
  };

  const getSeries = (): number[][] => {
    if (typesActivite[typeActivite]?.seuil) {
      return [getActivitesData(), getSeuilRecommande(), getAverage()];
    }
    return [getActivitesData(), getAverage()];
  };

  return (
    <div>
      <h4 className="text-lg text-title-blue-france">Historique</h4>
      <div className="flex pb-5">
        <ActiviteTypes
          typeActivite={typeActivite}
          setTypeActivite={setTypeActivite}
        />
      </div>
      <div className="pb-5">
        <ActiviteDurations
          setSelectedMonths={setSelectedMonths}
          debutConvention={debutConvention}
          finConvention={finConvention}
        />
      </div>
      <div className="flex">
        <div className="flex-4">
          <LineChart
            data={{
              labels: selectedMonths.map(formatForCharts),
              series: getSeries(),
            }}
            options={{
              fullWidth: true,
              axisX: { showGrid: false },
              axisY: {
                offset: 50,
                labelInterpolationFnc: (value) => {
                  return typesActivite[typeActivite]?.seuil
                    ? value + " %"
                    : value;
                },
              },
            }}
          />
        </div>
        <div className="pl-5">
          <div className="pb-1 flex items-center">
            <div className="w-[40px] border-b-2 border-b-background-flat-blue-cumulus mr-2 shrink-0 grow-0" />
            {typesActivite[typeActivite]?.label}
          </div>
          {typesActivite[typeActivite]?.seuil && (
            <div className="pb-1 flex items-center">
              <div className="w-[40px] border-b-2 border-b-background-flat-blue-ecume border-dashed mr-2 shrink-0 grow-0" />
              Seuil recommandé
            </div>
          )}
          <div className="pb-1 flex items-center">
            <div
              className={`w-[40px] border-b-2 border-b-background-flat-${typesActivite[typeActivite]?.seuil ? "green-bourgeon" : "blue-ecume"} border-dashed mr-2 shrink-0 grow-0`}
            />
            Moyenne sur la période
          </div>
        </div>
      </div>
    </div>
  );
};
