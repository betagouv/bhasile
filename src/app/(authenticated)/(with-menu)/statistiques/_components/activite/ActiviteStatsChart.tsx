"use client";

import dayjs from "dayjs";
import { ReactElement, useState } from "react";

import LineChart from "@/app/components/common/LineChart";
import {
  formatForCharts,
  getLastMonths,
  getYearFromDate,
} from "@/app/utils/date.util";
import { ActiviteByMonthStat } from "@/schemas/api/statistique.schema";

import {
  TypeActiviteKey,
  typesActivite,
} from "../../../structures/[id]/_components/_activite/activite.constants";
import { ActiviteTypes } from "../../../structures/[id]/_components/_activite/ActiviteTypes";
import { useStatistiquesContext } from "../../_context/StatistiquesClientContext";

export const ActiviteStatsChart = (): ReactElement => {
  const { statistiques } = useStatistiquesContext();

  const [typeActivite, setTypeActivite] = useState<TypeActiviteKey>(
    "placesIndisponibles"
  );

  // TODO : rendre dynamique quand les dates charts seront modifiables dynamiquement
  const selectedMonths = getLastMonths(12);

  const getCurrentActivite = (
    activites: ActiviteByMonthStat[],
    date: dayjs.Dayjs
  ): ActiviteByMonthStat | undefined => {
    return activites.find((activite) => {
      const isSameMonth =
        new Date(activite.date)?.getMonth() === date.get("month");
      const isSameYear = getYearFromDate(activite.date) === date.get("year");

      return isSameMonth && isSameYear;
    });
  };

  const getActivitesData = (): (number | null)[] => {
    return selectedMonths.map((selectedMonth) => {
      const currentActivite = getCurrentActivite(
        statistiques.activite.byMonth,
        selectedMonth
      );
      if (currentActivite) {
        return (
          ((currentActivite?.[typeActivite] as number) /
            currentActivite?.placesEnregistreesDna) *
          100
        );
      }
      return null;
    });
  };

  const getSeuilCahierDesCharges = (): number[] => {
    const currentActivites: (ActiviteByMonthStat | undefined)[] =
      selectedMonths.map((selectedMonth) => {
        return getCurrentActivite(statistiques.activite.byMonth, selectedMonth);
      });
    return currentActivites.map(() => typesActivite[typeActivite]?.seuil || 0);
  };

  return (
    <div className="w-full">
      <div className="flex pb-6">
        <ActiviteTypes
          typeActivite={typeActivite}
          setTypeActivite={setTypeActivite}
          isCphStructure={false}
        />
      </div>
      <div className="flex">
        <div className="flex-4">
          <LineChart
            data={{
              labels: selectedMonths.map(formatForCharts),
              series: [getActivitesData(), getSeuilCahierDesCharges()],
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
                  return value + " %";
                },
              },
            }}
          />
        </div>
        <div className="pl-5">
          <div className="pb-2 flex items-center text-sm">
            <div className="w-[40px] border-b-2 border-b-background-flat-blue-france mr-2 shrink-0 grow-0" />
            {typesActivite[typeActivite]?.label}
          </div>
          <div className="pb-2 flex items-center text-sm">
            <div className="w-[40px] border-b-2 border-default-blue-france border-dashed mr-2 shrink-0 grow-0" />
            Seuil cahier des charges
          </div>
        </div>
      </div>
    </div>
  );
};
