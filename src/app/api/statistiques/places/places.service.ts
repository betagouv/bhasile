import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import {
  computeGlobalPlacesStats,
  computePlacesYearStats,
  emptyPlacesSpeciales,
} from "./places.util";

export const getPlacesStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["places"] => {
  const {
    structures,
    typologies,
    adresses,
    adresseTypologies,
    departements,
  } = context;

  const global = computeGlobalPlacesStats(
    structures,
    typologies,
    adresses,
    adresseTypologies,
    departements
  );
  const byYear = computePlacesYearStats(
    structures,
    typologies,
    adresses,
    adresseTypologies
  );

  return { ...global, byYear };
};

export const emptyPlacesStatistiques = (): StatistiqueApiRead["places"] => ({
  totalPlaces: 0,
  tauxEquipement: [],
  placesSpeciales: emptyPlacesSpeciales(),
  byYear: [],
});
