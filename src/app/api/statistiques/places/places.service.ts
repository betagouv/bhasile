import { StatistiqueApiRead } from "@/schemas/api/statistique.schema";

import type { StatistiquesContext } from "../statistiques.db.type";
import { computePlacesStatistiques } from "./places.util";

export const getPlacesStatistiques = (
  context: StatistiquesContext
): StatistiqueApiRead["places"] => {
  const { structures, typologies, adresses, departements } = context;

  return computePlacesStatistiques(
    structures,
    typologies,
    adresses,
    departements
  );
};
