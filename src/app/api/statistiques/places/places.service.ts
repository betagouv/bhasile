import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import { StatistiquesContext } from "../shared/context";
import { computePlacesStatistiques } from "./places.util";

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

  return computePlacesStatistiques(
    structures,
    typologies,
    adresses,
    adresseTypologies,
    departements
  );
};
