import { Activite } from "@/generated/prisma/client";

import { decimalToNumber } from "@/app/utils/decimal.util";
import { getDepartementActivitesAverage } from "./activite.repository";
import { ActiviteStats } from "./activite.type";
import { sum, weightedAverage } from "@/app/utils/math.util";

export type StructureActiviteRow = {
  id: number;
  date: Date;
  placesAutorisees: number;
  desinsectisation: number | null;
  remiseEnEtat: number | null;
  sousOccupation: number | null;
  placesIndisponibles: number | null;
  tauxOccupation: number | null;
  placesOccupees: number | null;
  placesDisponibles: number | null;
  travaux: number | null;
  placesVacantes: number | null;
  presencesInduesBPI: number | null;
  presencesInduesDeboutees: number | null;
  presencesIndues: number | null;
};

export const getAverageDepartementPlaces = async (
  departement: string | null,
  startDate: string | null,
  endDate: string | null
): Promise<ActiviteStats | null> => {
  return getDepartementActivitesAverage(departement, startDate, endDate);
};

export const processActivitesForStructure = (
  activites: Activite[] | null | undefined
): StructureActiviteRow[] => {
  if (!activites?.length) return [];

  const groups = new Map<number, Activite[]>();
  for (const a of activites) {
    const key = a.date.getTime();
    const list = groups.get(key);
    if (list) list.push(a);
    else groups.set(key, [a]);
  }

  return [...groups.entries()]
    .sort(([a], [b]) => b - a)
    .map(([, rows]) => {
      const date = rows[0].date;
      const id = rows[0].id;

      const placesAutorisees = sum(rows.map((r) => r.placesAutorisees));
      const desinsectisation = sum(rows.map((r) => r.desinsectisation));
      const remiseEnEtat = sum(rows.map((r) => r.remiseEnEtat));
      const sousOccupation = sum(rows.map((r) => r.sousOccupation));
      const travaux = sum(rows.map((r) => r.travaux));
      const placesIndisponibles = sum(rows.map((r) => r.placesIndisponibles));
      const presencesInduesBPI = sum(rows.map((r) => r.presencesInduesBPI));
      const presencesInduesDeboutees = sum(
        rows.map((r) => r.presencesInduesDeboutees)
      );

      const computedPlaces = rows.map((r) => {
        return computePlacesVacantesAndPlacesOccupees(
          r.placesAutorisees,
          r.placesIndisponibles,
          decimalToNumber(r.tauxOccupation)
        );
      });

      const placesDisponibles = sum(
        computedPlaces.map((c) => c.placesDisponibles)
      );
      const placesOccupees = sum(computedPlaces.map((c) => c.placesOccupees));
      const placesVacantes = sum(computedPlaces.map((c) => c.placesVacantes));

      // TODO: confirm weighting with PlacesAutorisees is correct for OFII model
      const tauxOccupation = weightedAverage(
        rows.map((r) => ({
          weight: r.placesAutorisees,
          value: decimalToNumber(r.tauxOccupation),
        }))
      );

      if (placesAutorisees == null) return null;

      return {
        id,
        date,
        placesAutorisees,
        desinsectisation,
        remiseEnEtat,
        sousOccupation,
        placesIndisponibles,
        tauxOccupation,
        placesOccupees,
        placesDisponibles,
        travaux,
        placesVacantes,
        presencesInduesBPI,
        presencesInduesDeboutees,
        presencesIndues:
          presencesInduesBPI == null && presencesInduesDeboutees == null
            ? null
            : (presencesInduesBPI ?? 0) + (presencesInduesDeboutees ?? 0),
      };
    })
    .filter((r): r is StructureActiviteRow => r !== null);
};

export const computePlacesVacantesAndPlacesOccupees = (
  placesAutorisees: number | null | undefined,
  placesIndisponibles: number | null | undefined,
  tauxOccupation: number | null | undefined
): {
  placesDisponibles: number | null;
  placesVacantes: number | null;
  placesOccupees: number | null;
} => {
  if (
    placesAutorisees == null ||
    placesIndisponibles == null ||
    tauxOccupation == null
  ) {
    return {
      placesDisponibles: null,
      placesVacantes: null,
      placesOccupees: null,
    };
  }

  const placesDisponibles = placesAutorisees - placesIndisponibles;
  const placesOccupees = Math.round(placesDisponibles * tauxOccupation);
  const placesVacantes = Math.round(placesDisponibles - placesOccupees);

  return { placesDisponibles, placesVacantes, placesOccupees };
};
