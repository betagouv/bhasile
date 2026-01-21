"use client";

import dayjs, { Dayjs } from "dayjs";
import { ReactElement, useEffect, useState } from "react";

import LineChart from "@/app/components/common/LineChart";
import { ActiviteStats, useActiviteStats } from "@/app/hooks/useActiviteStats";
import { computeAverage } from "@/app/utils/common.util";
import {
  formatForCharts,
  getLastMonths,
  getYearFromDate,
} from "@/app/utils/date.util";
import { capitalizeFirstLetter } from "@/app/utils/string.util";
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
    getLastMonths(6)
  );
  const [typeActivite, setTypeActivite] =
    useState<keyof ActiviteApiType>("presencesInduesBPI");

  const [activiteStats, setActiviteStats] = useState<ActiviteStats>();

  const { getStats } = useActiviteStats();

  useEffect(() => {
    const fetchStats = async () => {
      const stats = await getStats(
        structure.departementAdministratif,
        selectedMonths[0]?.toISOString(),
        (selectedMonths.at(-1) as Dayjs)?.toISOString()
      );
      setActiviteStats(stats);
    };
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [typeActivite, selectedMonths]);

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

  const getActivitesData = (): (number | null)[] => {
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
      return null;
    });
  };

  const getSeuilCahierDesCharges = (): number[] => {
    const currentActivites: (ActiviteApiType | undefined)[] =
      selectedMonths.map((selectedMonth) => {
        return getCurrentActivite(activites, selectedMonth);
      });
    return currentActivites.map(() => typesActivite[typeActivite]?.seuil || 0);
  };

  const getStructureAverage = (): number[] => {
    const activitesData = getActivitesData();
    const average = computeAverage(activitesData);
    return Array(selectedMonths.length).fill(average);
  };

  const getDepartmentAverage = (): number[] => {
    const activiteStatsKey =
      `average${capitalizeFirstLetter(typeActivite)}` as keyof ActiviteStats;
    const average = activiteStats?.[activiteStatsKey];
    return Array(selectedMonths.length).fill(average);
  };

  const getSeries = (): (number | null)[][] => {
    if (typesActivite[typeActivite]?.seuil) {
      return [
        getActivitesData(),
        getSeuilCahierDesCharges(),
        getStructureAverage(),
        getDepartmentAverage(),
      ];
    }
    return [getActivitesData()];
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
              axisX: {
                showGrid: false,
                labelInterpolationFnc: (value, index) => {
                  const skip = Math.ceil(selectedMonths.length / 8);
                  return index % skip === 0 ? value : null;
                },
              },
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
          <div className="pb-1 flex items-center text-sm">
            <div className="w-[40px] border-b-2 border-b-background-flat-blue-france mr-2 shrink-0 grow-0" />
            {typesActivite[typeActivite]?.label}
          </div>
          {typesActivite[typeActivite]?.seuil && (
            <div className="pb-1 flex items-center text-sm">
              <div className="w-[40px] border-b-2 border-default-blue-france border-dashed mr-2 shrink-0 grow-0" />
              Seuil cahier des charges
            </div>
          )}
          {typesActivite[typeActivite]?.seuil && (
            <div className="pb-1 flex items-center text-sm">
              <div className="w-[40px] border-b-2 border-default-green-archipel border-dashed mr-2 shrink-0 grow-0" />
              Moyenne de la structure sur la période
            </div>
          )}
          {typesActivite[typeActivite]?.seuil && (
            <div className="pb-1 flex items-center text-sm">
              <div className="w-[40px] border-b-2 border-default-purple-glycine border-dashed mr-2 shrink-0 grow-0" />
              Moyenne départementale sur la période
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
