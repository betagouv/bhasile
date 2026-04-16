import { getDepartementActivitesAverage } from "./activite.repository";
import { ActiviteStats } from "./activite.type";

export const getAverageDepartementPlaces = async (
  departement: string | null,
  startDate: string | null,
  endDate: string | null
): Promise<ActiviteStats | null> => {
  return getDepartementActivitesAverage(departement, startDate, endDate);
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
