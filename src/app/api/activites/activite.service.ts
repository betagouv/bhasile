import { Prisma } from "@/generated/prisma/client";

import {
  getActivitesForStructureRaw,
  getDepartementActivitesAverage,
} from "./activite.repository";
import { ActiviteStats } from "./activite.type";

type StructureActiviteRow = {
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

export const getActivitesForStructure = async (
  structureId: number
): Promise<StructureActiviteRow[]> => {
  const rows = await getActivitesForStructureRaw(structureId);

  return rows
    .filter((r) => r.placesAutorisees != null)
    .map((r) => {
      const tauxOccupation =
        r.tauxOccupation == null
          ? null
          : (r.tauxOccupation as Prisma.Decimal).toNumber();

      const { placesDisponibles, placesVacantes, placesOccupees } =
        computePlacesVacantesAndPlacesOccupees(
          r.placesAutorisees,
          r.placesIndisponibles,
          tauxOccupation
        );

      return {
        id: r.id,
        date: r.date,
        placesAutorisees: r.placesAutorisees!,
        desinsectisation: r.desinsectisation,
        remiseEnEtat: r.remiseEnEtat,
        sousOccupation: r.sousOccupation,
        placesIndisponibles: r.placesIndisponibles,
        tauxOccupation,
        placesOccupees,
        placesDisponibles,
        travaux: r.travaux,
        placesVacantes,
        presencesInduesBPI: r.presencesInduesBPI,
        presencesInduesDeboutees: r.presencesInduesDeboutees,
        presencesIndues:
          (r.presencesInduesBPI ?? 0) + (r.presencesInduesDeboutees ?? 0),
      };
    });
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
