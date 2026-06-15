import { sumValues } from "@/app/utils/math.util";
import { PresencesInduesMonthStat, StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import {
  getMonthKey,
  getMonthKeysFromDates,
  monthKeyToDate,
} from "../shared/monthly.util";
import type { StatistiqueDbActivite } from "../shared/db.type";

const computePresencesInduesByMonth = (
  timeSeries: StatistiqueDbActivite[]
): PresencesInduesMonthStat[] => {
  const byMonth = new Map<
    string,
    {
      presencesInduesBPI: number;
      presencesInduesDeboutees: number;
      placesAutorisees: number;
    }
  >();

  for (const activite of timeSeries) {
    const key = getMonthKey(new Date(activite.date));
    const current = byMonth.get(key) ?? {
      presencesInduesBPI: 0,
      presencesInduesDeboutees: 0,
      placesAutorisees: 0,
    };
    byMonth.set(key, {
      presencesInduesBPI:
        current.presencesInduesBPI + (activite.presencesInduesBPI ?? 0),
      presencesInduesDeboutees:
        current.presencesInduesDeboutees +
        (activite.presencesInduesDeboutees ?? 0),
      placesAutorisees:
        current.placesAutorisees + (activite.placesAutorisees ?? 0),
    });
  }

  return getMonthKeysFromDates(
    timeSeries.map((activite) => new Date(activite.date))
  ).map((key) => ({
    date: monthKeyToDate(key),
    ...(byMonth.get(key) ?? {
      presencesInduesBPI: 0,
      presencesInduesDeboutees: 0,
      placesAutorisees: 0,
    }),
  }));
};

export const computeActiviteStat = (
  latest: StatistiqueDbActivite[],
  timeSeries: StatistiqueDbActivite[]
): StatistiqueApiRead["activite"] => {
  const placesAutorisees =
    sumValues(latest.map((activite) => activite.placesAutorisees)) ?? 0;
  const placesIndisponibles =
    sumValues(latest.map((activite) => activite.placesIndisponibles)) ?? 0;

  return {
    placesEnregistreesDna: placesAutorisees,
    placesDisponibles: placesAutorisees - placesIndisponibles,
    placesIndisponibles,
    motifsIndisponibilite: {
      desinsectisation:
        sumValues(latest.map((activite) => activite.desinsectisation)) ?? 0,
      remiseEnEtat:
        sumValues(latest.map((activite) => activite.remiseEnEtat)) ?? 0,
      sousOccupation:
        sumValues(latest.map((activite) => activite.sousOccupation)) ?? 0,
      travaux: sumValues(latest.map((activite) => activite.travaux)) ?? 0,
    },
    presencesInduesByMonth: computePresencesInduesByMonth(timeSeries),
  };
};
